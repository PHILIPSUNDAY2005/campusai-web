import { GoogleGenAI } from '@google/genai';
import { getUserFromRequest } from '../../../lib/serverAuth';
import { checkRateLimit } from '../../../lib/rateLimit';
import { SYSTEM_INSTRUCTION, sleep, isRetryable, parseSummary } from '../../../lib/summaryTools';

export const maxDuration = 60;

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB (the hosting limit is about 4.5 MB)
const MAX_TEXT_CHARS = 12000;
const MAX_ATTEMPTS = 3;
const UPLOAD_LIMIT = 8; // files per student
const UPLOAD_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes

const EXTENSION_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  txt: 'text/plain',
};

const FILE_INSTRUCTION =
  SYSTEM_INSTRUCTION +
  ' The notes may be a photo of handwriting or print, a PDF, or plain text. ' +
  'If the file does not contain readable study notes, reply with exactly the word UNREADABLE and nothing else.';

// Works out the real type from the browser's type or the file extension
function detectType(file) {
  const declared = (file.type || '').toLowerCase();
  const allowed = Object.values(EXTENSION_TYPES);
  if (declared === 'image/jpg') {
    return 'image/jpeg';
  }
  if (allowed.includes(declared)) {
    return declared;
  }
  const name = (file.name || '').toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop() : '';
  return EXTENSION_TYPES[ext] || '';
}

// Checks the first bytes, so a renamed file cannot pretend to be a picture
function contentMatches(type, bytes) {
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
  if (type === 'application/pdf') {
    return Buffer.from(bytes.slice(0, 5)).toString('latin1') === '%PDF-';
  }
  return true; // plain text has no fixed starting bytes
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

  // 2. Read and check the file
  let file;
  try {
    const form = await request.formData();
    file = form.get('file');
  } catch (error) {
    return Response.json({ error: 'We could not read the upload. Please try again.' }, { status: 400 });
  }

  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return Response.json({ error: 'Please choose a file first.' }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: 'That file is empty.' }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ error: 'That file is too big. The limit is 4 MB.' }, { status: 413 });
  }

  const type = detectType(file);
  if (type === '') {
    return Response.json(
      { error: 'Please upload a JPG, PNG, WebP, PDF or TXT file.' },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!contentMatches(type, bytes)) {
    return Response.json(
      { error: 'That file does not look like a real ' + type.split('/')[1].toUpperCase() + ' file.' },
      { status: 400 }
    );
  }

  // 3. Build what we send to Gemini
  let parts;
  if (type === 'text/plain') {
    const text = Buffer.from(bytes).toString('utf8').trim();
    if (text.length < 50) {
      return Response.json(
        { error: 'There is too little text in that file (at least 50 characters).' },
        { status: 400 }
      );
    }
    if (text.length > MAX_TEXT_CHARS) {
      return Response.json(
        { error: 'That text file is too long. Please use a shorter section.' },
        { status: 400 }
      );
    }
    parts = [{ text: 'Summarize these lecture notes:\n\n' + text }];
  } else {
    parts = [
      { text: 'Read and summarize these lecture notes.' },
      { inlineData: { mimeType: type, data: Buffer.from(bytes).toString('base64') } },
    ];
  }

  // 4. Is this student uploading too much?
  const limit = await checkRateLimit(caller.uid, 'upload', UPLOAD_LIMIT, UPLOAD_WINDOW_MS);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
    return Response.json(
      {
        error:
          'You have uploaded a lot in a short time. Please wait about ' +
          minutes +
          ' minute' +
          (minutes === 1 ? '' : 's') +
          ' and try again.',
      },
      { status: 429 }
    );
  }

  // 5. Ask Gemini, trying again if the connection drops
  const ai = new GoogleGenAI({ apiKey: apiKey });
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
        contents: [{ role: 'user', parts: parts }],
        config: { systemInstruction: FILE_INSTRUCTION },
      });

      const raw = response.text;
      if (!raw) {
        return Response.json({ error: 'The AI sent an empty answer.' }, { status: 502 });
      }

      if (raw.trim().toUpperCase().startsWith('UNREADABLE')) {
        return Response.json(
          {
            error:
              'We could not find readable notes in that file. Try a clearer, well-lit photo or a different file.',
          },
          { status: 422 }
        );
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
      console.error('Gemini upload error (attempt ' + attempt + ' of ' + MAX_ATTEMPTS + '):', error);

      if (attempt < MAX_ATTEMPTS && isRetryable(error)) {
        await sleep(1500);
        continue;
      }
      break;
    }
  }

  const status = lastError && lastError.status === 429 ? 429 : 500;
  const message =
    status === 429
      ? 'The AI is busy right now. Please wait a minute and try again.'
      : 'The AI could not read that file right now. Please check your connection and try again.';
  return Response.json({ error: message }, { status: status });
}
