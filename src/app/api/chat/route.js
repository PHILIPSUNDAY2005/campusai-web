import { GoogleGenAI } from '@google/genai';

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
  'FORMATTING RULES:',
  '- Begin with the answer. No greeting, filler, praise or emojis.',
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