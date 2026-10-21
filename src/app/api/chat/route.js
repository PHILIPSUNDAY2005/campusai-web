import { GoogleGenAI } from '@google/genai';
import { FieldValue } from 'firebase-admin/firestore';
import { getUserFromRequest } from '../../../lib/serverAuth';
import { getAdmin } from '../../../lib/firebaseAdmin';
import { checkRateLimit } from '../../../lib/rateLimit';
import { sleep, isRetryable } from '../../../lib/summaryTools';

export const maxDuration = 60; // gives the retries below enough time

// Models to try, in order. Each model has its own free limit, so when one is used up
// the next one can still answer. You can change the list in Vercel with
// GEMINI_MODEL (the first choice) and GEMINI_FALLBACK_MODELS (names separated by commas).
const DEFAULT_FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'];
const MAX_WAIT_SECONDS = 20; // the longest we will wait for a short per-minute limit

// Gemini's own limit was reached (too many requests for the whole site)
function isLimitError(error) {
  if (!error) {
    return false;
  }
  const text = typeof error.message === 'string' ? error.message : '';
  return error.status === 429 || text.includes('RESOURCE_EXHAUSTED');
}

// The limit for the whole DAY is used up (waiting a minute will not help)
function isDailyLimit(error) {
  const text = error && typeof error.message === 'string' ? error.message : '';
  return isLimitError(error) && /PerDay|per day|RPD/i.test(text);
}

// Gemini sometimes says how long to wait ("retry in 22s"). Returns seconds, or null.
function retryDelaySeconds(error) {
  const text = error && typeof error.message === 'string' ? error.message : '';
  const match = text.match(/retry in ([\d.]+)\s*s/i) || text.match(/"retryDelay"\s*:\s*"([\d.]+)s"/i);
  if (!match) {
    return null;
  }
  const seconds = parseFloat(match[1]);
  return Number.isFinite(seconds) ? seconds : null;
}

// The model name does not exist (or is not available to this key)
function isNotFound(error) {
  return !!error && error.status === 404;
}

// A short, safe description for the Vercel logs (no keys or private text)
function errorSummary(error) {
  const text = error && typeof error.message === 'string' ? error.message : String(error);
  return {
    status: error && error.status,
    name: error && error.name,
    message: text.slice(0, 600),
  };
}

const CHAT_LIMIT = 30; // questions per student
const CHAT_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_CHARS = 3000000; // about 2.2 MB of picture (the hosting limit is about 4.5 MB)
const MAX_SAVED_MESSAGES = 40;
const CHAT_ID_PATTERN = /^[A-Za-z0-9]{8,40}$/;

// Checks the first bytes, so a renamed file cannot pretend to be a picture
function imageMatches(type, bytes) {
  if (type === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  if (type === 'image/webp') {
    const head = Buffer.from(bytes.slice(0, 12)).toString('latin1');
    return head.startsWith('RIFF') && head.slice(8, 12) === 'WEBP';
  }
  return false;
}

// Keeps only one plain word (letters, accents, hyphens, apostrophes), so nothing else
// can be slipped into the AI's instructions through the name.
function cleanName(value) {
  if (typeof value !== 'string') {
    return '';
  }
  const firstWord = value.trim().split(/\s+/)[0] || '';
  const name = firstWord.replace(/[^\p{L}\p{M}'-]/gu, '').slice(0, 30);
  return name.length >= 2 ? name : '';
}

// Saves the conversation under this student's own account.
// Returns { chatId, replyId }, or null if saving failed (the answer is still shown).
async function saveChat(uid, chatId, messages, reply) {
  try {
    const { adminDb } = getAdmin();
    const saved = messages
      .filter((m) => m && typeof m.text === 'string' && m.text.trim() !== '')
      .map((m) => ({
        id: typeof m.id === 'number' ? m.id : Date.now(),
        text: m.text.slice(0, 8000),
        isUser: m.isUser === true,
        rateable: m.rateable === true, // a real AI answer that can get a thumbs up or down
      }));
    const replyId = Date.now() + 1;
    saved.push({ id: replyId, text: reply.slice(0, 8000), isUser: false, rateable: true });
    const recent = saved.slice(-MAX_SAVED_MESSAGES);

    const chats = adminDb.collection('users').doc(uid).collection('chats');

    if (typeof chatId === 'string' && CHAT_ID_PATTERN.test(chatId)) {
      await chats.doc(chatId).set(
        { messages: recent, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      return { chatId: chatId, replyId: replyId };
    }

    const firstQuestion = saved.find((m) => m.isUser);
    const title = firstQuestion ? firstQuestion.text.replace(/\s+/g, ' ').slice(0, 60) : 'New chat';
    const ref = chats.doc();
    await ref.set({
      title: title,
      messages: recent,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { chatId: ref.id, replyId: replyId };
  } catch (error) {
    console.error('Chat save error:', error);
    return null;
  }
}

// The instructions that tell Gemini how to teach and how to format answers
const SYSTEM_INSTRUCTION = [
  'You are CampusAI, a study assistant that explains like a good university teacher.',
  'Write in simple English, explain difficult terms in plain words, and use examples students can relate to (campus life, phones, everyday situations).',
  'Format every answer in Markdown.',
  '',
  'ADAPT TO THE QUESTION. Do not force every answer into the same structure:',
  '- Simple or quick question: answer directly in one to three sentences. No headings.',
  '- Definition only: give the definition, then a short example if useful.',
  '- Types or categories: give a numbered list, then explain each type separately with a simple example.',
  '- Full topic explanation (for example "explain X" or "teach me X"): use ## headings chosen to fit the topic, such as Definition, Types, How It Works, Functions, Examples, Advantages, Disadvantages and Summary. Include only the sections that apply to the topic.',
  '- Revision notes: give concise, organized notes with bold key terms, and finish with a short "Key Points to Remember" list.',
  '- Comparison of two or more things: use a Markdown table.',
  '- Programming question: put code in fenced code blocks with the language name, then explain it briefly.',
  '',
  'GREETINGS AND SMALL TALK:',
  '- If the student only greets you (hi, hello, good morning), says thanks, or makes small talk, reply warmly in one or two short sentences. Use their first name if it is known.',
  '- Then invite them to ask about a course, a topic or their notes. Do not write headings, lists or long answers for a greeting.',
  '',
  'FORMATTING RULES:',
  '- For study questions, begin with the answer. No greeting, filler, praise or emojis.',
  '- Give each major point its own ## heading. Use ### for subheadings.',
  '- Never put definitions, types, examples, advantages and disadvantages into one paragraph.',
  '- Keep paragraphs to three sentences or fewer.',
  '- Use numbered lists for steps and categories. Use bullet points for examples and key points.',
  '- Put important terms in bold.',
  '- Use tables only when they genuinely make a comparison easier.',
  '- Never use horizontal rules (---).',
  '- For a full topic explanation, end with a "## Summary" section that recaps the main points.',
  '- Do not end with a question or an offer to explain more.',
  '',
  'ACCURACY:',
  '- Do not invent facts. If you are not sure, say so briefly.',
  '- Only ask a short follow-up question when the student\'s message is truly unclear.',
  '- Keep answers focused: usually under 250 words, and up to about 450 words for a full topic explanation, unless the student asks for more detail.',
].join('\n');

export async function POST(request) {
  // 1. Only logged-in students with a verified email may use the AI
  const caller = await getUserFromRequest(request);
  if (!caller) {
    return Response.json({ error: 'Please log in again.' }, { status: 401 });
  }
  if (!caller.emailVerified) {
    return Response.json({ error: 'Please verify your email first.' }, { status: 403 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'The AI key is not set on the server.' }, { status: 500 });
  }

  // 2. Read the conversation sent by the chat page
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];

  // 3. Convert to Gemini's format. Keep only the last 12 messages to stay small.
  let contents = messages
    .slice(-12)
    .filter((m) => typeof m.text === 'string' && m.text.trim() !== '')
    .map((m) => ({
      role: m.isUser ? 'user' : 'model',
      parts: [{ text: m.text.slice(0, 4000) }],
    }));

  // Gemini expects the conversation to start with the student's message
  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift();
  }

  if (contents.length === 0) {
    return Response.json({ error: 'Please send a question.' }, { status: 400 });
  }

  // 3b. A photo may be attached to the newest question
  if (body.image) {
    const image = body.image;
    if (typeof image.data !== 'string' || !IMAGE_TYPES.includes(image.mimeType)) {
      return Response.json({ error: 'Please attach a JPG, PNG or WebP photo.' }, { status: 400 });
    }
    if (image.data.length > MAX_IMAGE_CHARS) {
      return Response.json({ error: 'That photo is too big. Please try a smaller one.' }, { status: 413 });
    }
    const imageBytes = new Uint8Array(Buffer.from(image.data, 'base64'));
    if (!imageMatches(image.mimeType, imageBytes)) {
      return Response.json({ error: 'That file does not look like a real photo.' }, { status: 400 });
    }
    const newest = contents[contents.length - 1];
    if (newest.role === 'user') {
      newest.parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    }
  }

  // 4. Is this student asking too much?
  const limit = await checkRateLimit(caller.uid, 'chat', CHAT_LIMIT, CHAT_WINDOW_MS);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
    return Response.json(
      {
        error:
          'You have asked a lot of questions in a short time. Please wait about ' +
          minutes +
          ' minute' +
          (minutes === 1 ? '' : 's') +
          ' and try again.',
      },
      { status: 429 }
    );
  }

  // 5. Ask Gemini. Try each model in turn. If they are all at their limit and Gemini says
  //    the wait is short, wait once and go through the list again.
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const studentName = cleanName(body.name);
  const instruction = studentName
    ? SYSTEM_INSTRUCTION + "\n\nThe student's first name is " + studentName + '.'
    : SYSTEM_INSTRUCTION;

  const mainModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const fromSettings = (process.env.GEMINI_FALLBACK_MODELS || process.env.GEMINI_FALLBACK_MODEL || '')
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '');
  const models = [
    ...new Set([mainModel, ...(fromSettings.length > 0 ? fromSettings : DEFAULT_FALLBACK_MODELS)]),
  ];

  let lastError = null;
  let sawMinuteLimit = false; // a limit that clears after a short wait
  let stop = false; // some other problem: trying more models will not help

  for (let round = 1; round <= 2 && !stop; round++) {
    let shortestWait = null;

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: { systemInstruction: instruction },
        });

        const reply = response.text;
        if (!reply) {
          lastError = new Error('empty answer');
          console.error('Gemini sent an empty answer (model ' + model + ')');
          continue;
        }

        // 6. Save the conversation so the student can open it again later
        const savedChat = await saveChat(caller.uid, body.chatId, messages, reply);

        return Response.json({
          reply: reply,
          chatId: savedChat ? savedChat.chatId : null,
          replyId: savedChat ? savedChat.replyId : null,
        });
      } catch (error) {
        lastError = error;
        // The full error is shown in your Vercel logs, never sent to the browser
        console.error('Gemini error (round ' + round + ', model ' + model + '):', errorSummary(error));

        if (isLimitError(error)) {
          if (!isDailyLimit(error)) {
            sawMinuteLimit = true;
            const wait = retryDelaySeconds(error);
            if (wait !== null && (shortestWait === null || wait < shortestWait)) {
              shortestWait = wait;
            }
          }
          continue; // this model is out for now: try the next one
        }

        if (error.status === 503 || isNotFound(error) || isRetryable(error)) {
          continue; // busy, missing or a dropped connection: try the next model
        }

        stop = true; // for example a bad request: the same problem would happen again
        break;
      }
    }

    // Every model was at a short limit: wait once, then go through the list again
    if (!stop && round === 1 && sawMinuteLimit && shortestWait !== null && shortestWait <= MAX_WAIT_SECONDS) {
      await sleep(Math.ceil(shortestWait * 1000) + 1000);
      sawMinuteLimit = false;
      continue;
    }
    break;
  }

  if (isLimitError(lastError)) {
    return Response.json(
      {
        error: sawMinuteLimit
          ? 'The AI has reached its usage limit for the moment. Please wait about a minute and ask again.'
          : 'The AI has reached its limit for today. It starts working again after the daily reset, at about 8 or 9 am Lagos time.',
      },
      { status: 429 }
    );
  }
  if (lastError && lastError.status === 503) {
    return Response.json(
      { error: 'The AI is busy for a moment. Please try again in a few seconds.' },
      { status: 503 }
    );
  }
  return Response.json({ error: 'The AI could not answer right now.' }, { status: 500 });
}
