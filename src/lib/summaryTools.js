// Shared helpers for turning Gemini's answer into { title, points }

export const SYSTEM_INSTRUCTION =
  'You summarize lecture notes for university students. ' +
  'Reply in plain text only, with no markdown symbols. ' +
  'First line: "Title: " followed by a short title of at most 6 words. ' +
  'Then write 4 to 6 key points, one per line, each one clear sentence. ' +
  'Do not add anything else.';

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Is this error a short connection problem that is worth trying again?
export function isRetryable(error) {
  const code = error && error.cause && error.cause.code;
  if (['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(code)) {
    return true;
  }
  if (error && typeof error.message === 'string' && error.message.includes('fetch failed')) {
    return true;
  }
  // 503 means Gemini is busy for a moment
  return !!error && error.status === 503;
}

// Turns Gemini's text into { title, points }
export function parseSummary(raw) {
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
      .replace(/^[-*\u2022]\s*/, '')
      .replace(/^\d+[.)]\s*/, '')
      .replace(/\*\*/g, '')
      .trim();

    if (cleaned !== '') {
      points.push(cleaned);
    }
  }

  return { title: title, points: points };
}
