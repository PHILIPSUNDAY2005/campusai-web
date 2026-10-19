import { GoogleGenAI } from '@google/genai';
import { getUserFromRequest } from '../../../lib/serverAuth';
import { checkRateLimit } from '../../../lib/rateLimit';

// Give the server up to 30 seconds (retries can take a while)
export const maxDuration = 30;

const MIN_LENGTH = 50;
const MAX_LENGTH = 12000;
const MAX_ATTEMPTS = 3;
const SUMMARY_LIMIT = 10; // summaries per student
const SUMMARY_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes

// The instructions that tell Gemini exactly how to answer
const SYSTEM_INSTRUCTION =
  'You summarize lecture notes for university students. ' +
  'Reply in plain text only, with no markdown symbols. ' +
  'First line: "Title: " followed by a short title of at most 6 words. ' +
  'Then write 4 to 6 key points, one per line, each one clear sentence. ' +
  'Do not add anything else.';

// Wait for a number of milliseconds
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Is this error a short connection problem that is worth trying again?
function isRetryable(error) {
  const code = error && error.cause && error.cause.code;
  if (['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(code)) {
    return true;
  }
  if (error && typeof error.message === 'string' && error.message.includes('fetch failed')) {
    return true;
  }
  // 503 means Gemini is busy for a moment
  return error && error.status === 503;
}

// Turns Gemini's text into { title, points }
function parseSummary(raw) {
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  let title = 'Lecture Notes';
  const points = [];

  for (const line of lines) {
    if (/^title:/i.test(line)) {
      const cleanedTitle = line.replace(/^title:\s*/i, '').replace(/[*#]/g, '').trim();
      if (cleanedTitle !== '') {
        title = cleanedTitle;
      }
      continue;
    }

    // Remove bullets, numbers and bold marks if Gemini added them
    const cleaned = line
      .replace(/^[-*•]\s*/, '')
      .replace(/^\d+[.)]\s*/, '')
      .replace(/\*\*/g, '')
      .trim();

    if (cleaned !== '') {
      points.push(cleaned);
    }
  }

  return { title: title, points: points };
}

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

  // 2. Read the notes sent by the page
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';

  if (text.length < MIN_LENGTH) {
    return Response.json(
      { error: 'Please paste a little more text (at least 50 characters).' },
      { status: 400 }
    );
  }
  if (text.length > MAX_LENGTH) {
    return Response.json(
      { error: 'These notes are too long. Please paste a shorter section.' },
      { status: 400 }
    );
  }

  // 3. Is this student asking too much?
  const limit = await checkRateLimit(caller.uid, 'summarize', SUMMARY_LIMIT, SUMMARY_WINDOW_MS);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
    return Response.json(
      {
        error:
          'You have summarized a lot of notes in a short time. Please wait about ' +
          minutes +
          ' minute' +
          (minutes === 1 ? '' : 's') +
          ' and try again.',
      },
      { status: 429 }
    );
  }

  // 4. Ask Gemini, trying again if the connection drops
  const ai = new GoogleGenAI({ apiKey: apiKey });
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
        contents: [
          { role: 'user', parts: [{ text: 'Summarize these lecture notes:\n\n' + text }] },
        ],
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });

      const raw = response.text;
      if (!raw) {
        return Response.json({ error: 'The AI sent an empty answer.' }, { status: 502 });
      }

      const summary = parseSummary(raw);
      if (summary.points.length === 0) {
        return Response.json(
          { error: 'The AI could not find key points. Please try again.' },
          { status: 502 }
        );
      }

      return Response.json(summary);
    } catch (error) {
      lastError = error;
      console.error('Gemini error (attempt ' + attempt + ' of ' + MAX_ATTEMPTS + '):', error);

      if (attempt < MAX_ATTEMPTS && isRetryable(error)) {
        await sleep(1500);
        continue;
      }
      break;
    }
  }

  // All attempts failed
  const status = lastError && lastError.status === 429 ? 429 : 500;
  const message =
    status === 429
      ? 'The AI is busy right now. Please wait a minute and try again.'
      : 'The AI could not summarize right now. Please check your connection and try again.';
  return Response.json({ error: message }, { status: status });
}