import { GoogleGenAI } from '@google/genai';

// The instructions that tell Gemini how to behave
const SYSTEM_INSTRUCTION =
  'You are CampusAI, a friendly study assistant for university students. ' +
  'Explain course topics in simple, clear language with short examples. ' +
  'Keep answers focused and not too long. If a question is unclear, ask a short follow-up question.';

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'The AI key is not set on the server.' }, { status: 500 });
  }

  // 1. Read the conversation sent by the chat page
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];

  // 2. Convert to Gemini's format. Keep only the last 12 messages to stay small.
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

  // 3. Ask Gemini
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
      contents: contents,
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });

    const reply = response.text;
    if (!reply) {
      return Response.json({ error: 'The AI sent an empty answer.' }, { status: 502 });
    }

    return Response.json({ reply: reply });
  } catch (error) {
    // The full error is shown in your terminal, never sent to the browser
    console.error('Gemini error:', error);
    const status = error && error.status === 429 ? 429 : 500;
    return Response.json({ error: 'The AI could not answer right now.' }, { status: status });
  }
}