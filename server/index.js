require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize OpenAI client using server-side secret key ONLY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-dev',
});

// Guardrail filter: explicit, adult, hateful content detection
const FORBIDDEN_PATTERNS = [
  /\b(hate|kill|murder|violence|terror|bomb|nazi|racist)\b/i,
  /\b(porn|nsfw|sex|erotic|nude|naked|adult-content)\b/i,
  /\b(f\*\*k|b\*tch|a\*\*hole)\b/i,
];

function checkGuardrails(text) {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        reason: 'Violation of content policy: explicit, hateful, or adult discussions are not allowed.',
      };
    }
  }
  return { safe: true };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PersonaForge OpenAI Agent Backend',
    hasApiKey: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'),
  });
});

/**
 * POST /api/chat/agent
 * Executes the OpenAI agent loop for a given persona, room, and message
 */
app.post('/api/chat/agent', async (req, res) => {
  const { persona, message, history, roomId } = req.body;

  if (!persona || !message) {
    return res.status(400).json({ error: 'Missing persona or message payload' });
  }

  // 1. Guardrail validation
  const guardrailResult = checkGuardrails(message);
  if (!guardrailResult.safe) {
    return res.json({
      sender: 'agent',
      reply: `🛡️ [Guardrail Warning]: ${guardrailResult.reason}\n\nI am configured with strict safety policies to keep all discussions constructive and safe.`,
      guardrailTriggered: true,
    });
  }

  // 2. Persona System Prompt with English-only instruction
  const systemPrompt = `You are an AI Agent with the persona "${persona.name}" specializing in the role "${persona.role}".
Persona Tone: ${persona.tone || 'professional'}.
Custom Instructions: ${persona.systemPrompt || 'Help the user thoroughly.'}

MANDATORY RULES:
1. Speak in ENGLISH ONLY.
2. Strictly maintain your persona and specialty role at all times.
3. Adhere to safety guardrails: refuse explicit, adult, or hateful topics politely.
4. Keep answers concise, highly informative, and structured.`;

  // 3. Prepare conversation messages
  const formattedHistory = (history || []).slice(-6).map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text,
  }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...formattedHistory,
    { role: 'user', content: message },
  ];

  // If OpenAI API key is set, call OpenAI GPT model
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: persona.temperature || 0.7,
        max_tokens: 600,
      });

      const reply = completion.choices[0]?.message?.content || 'No response generated.';
      return res.json({ sender: 'agent', reply, modelUsed: 'gpt-4o-mini' });
    } catch (apiError) {
      console.error('OpenAI API Error:', apiError.message);
      return res.status(500).json({ error: 'OpenAI API call failed', details: apiError.message });
    }
  }

  // Fallback simulator if no key is configured yet in .env
  const mockAnswer = generatePersonaMockReply(persona, message);
  return res.json({
    sender: 'agent',
    reply: mockAnswer,
    note: 'Server simulated response (add OPENAI_API_KEY to server/.env to use live OpenAI Agent)',
  });
});

function generatePersonaMockReply(persona, userMessage) {
  const role = (persona.role || '').toLowerCase();
  if (role.includes('physics')) {
    return `⚛️ [${persona.name} - Physics]:\nRegarding "${userMessage}":\nFrom first principles, energy and momentum conservation dictate the system dynamics. Visualizing this as harmonic oscillation, the boundary conditions determine the wave numbers.\nKey equation: F = dp/dt.`;
  }
  if (role.includes('scrum') || role.includes('agile')) {
    return `🏃‍♂️ [${persona.name} - Agile Coach]:\nRegarding "${userMessage}":\nIn Scrum, transparency and iterative increments are paramount. Let's inspect the sprint backlog, remove impediments, and refine story estimates.`;
  }
  if (role.includes('carnatic') || role.includes('music')) {
    return `🎶 [${persona.name} - Carnatic Expert]:\nRegarding "${userMessage}":\nIn Carnatic music, Raga aesthetics depend on gamakas and swara sthanas, while Tala (like Adi Tala, 8 beats) provides rhythmic stability.`;
  }
  return `👋 [${persona.name} (${persona.role})]: I received your message: "${userMessage}". Operating in ${persona.tone} tone according to instructions: "${persona.systemPrompt}".`;
}

app.listen(PORT, () => {
  console.log(`🚀 PersonaForge OpenAI Agent Server listening on port ${PORT}`);
  console.log(`🛡️ Server-side guardrails & persona orchestration active`);
});
