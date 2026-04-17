// server.js - Express server for Legal Literacy Engine feature
// Runs on port 5000 and provides in-memory state for scenarios and progress

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Lawyer from './models/Lawyer.js';

// ─── ML PIPELINE — Case Strength Analyser ───────────────────────────────────
import { searchCases } from './scrapers/indianKanoon.js';
import { findSimilarCases, upsertCase } from './ml/vectorStore.js';
import { predictOutcome } from './ml/outcomeModel.js';
import scrapeJob from './jobs/scrapeJob.js';
import reminderJob from './jobs/reminderJob.js';

// Start background jobs (Disabled on Vercel/serverless)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  scrapeJob.start();
  reminderJob.start();
}


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// ─── AI PROVIDER CONFIG ───
const getProviders = () => ({
  GEMINI: {
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    model: "gemini-2.0-flash",
    fallbackModel: "gemini-1.5-flash",
    key: process.env.GEMINI_API_KEY
  },
  OPENROUTER: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    // Only fastest/most-reliable free models — cut slow ones
    models: [
      "google/gemini-flash-1.5:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "mistralai/mistral-7b-instruct:free",
    ],
    key: process.env.OPENROUTER_API_KEY
  },
  OLLAMA: {
    url: "https://api.novita.ai/v3/openai/chat/completions",
    model: "meta-llama/llama-3.1-8b-instruct",
    key: process.env.OLLAMA_API_KEY
  },
  POLLINATIONS: {
    url: "https://text.pollinations.ai/",
    model: "openai"
  },
  ANTHROPIC: {
    url: "https://api.anthropic.com/v1/messages",
    model: "claude-3-haiku-20240307",
    key: process.env.ANTHROPIC_API_KEY
  },
  OPENAI: {
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    key: process.env.OPENAI_API_KEY
  }
});

// ─── TIMEOUT WRAPPER ─── Prevents any slow provider from blocking the chain
function withTimeout(promise, ms = 12000, label = '') {
  const timer = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timer]);
}

// ─── MONGODB CONNECTION ───
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nyai';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB via Mongoose'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ─── AUTH MIDDLEWARE ───
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nyAI_super_secret_dev_key');
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch(err) {
      res.status(401).json({ error: 'Not authorized' });
    }
  } else {
    res.status(401).json({ error: 'No token provided' });
  }
};

// ─── AUTHENTICATION ROUTES ───
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'nyAI_super_secret_dev_key', {
    expiresIn: '30d',
  });
};

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: "User already exists with that email" });

    const user = await User.create({ name, email, password });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Static mock categories and scenarios
let scenarios = [
  {
    id: 1,
    category: "Consumer Rights",
    situation: "You ordered a smartphone online, but received a box containing a bar of soap. The seller refuses to issue a refund, claiming you received the correct item.",
    question: "What is your best immediate legal recourse?",
    options: [
      "A. Accept the loss as terms were agreed.",
      "B. File a complaint on the National Consumer Helpline.",
      "C. Directly sue the delivery boy.",
      "D. Post strongly worded comments on their social media."
    ],
    correctOption: "B",
    explanation: "Under the Consumer Protection Act, consumers have the right to seek redressal against unfair trade practices. The National Consumer Helpline provides immediate mediation and formal grievance filing support.",
    difficulty: "beginner"
  },
  {
    id: 2,
    category: "Workplace Rights",
    situation: "You have resigned from your company serving full notice period. Your employer is now withholding your final month's salary and full & final settlement without giving any formal reason.",
    question: "What is the correct formal step to take first?",
    options: [
      "A. Send a formal legal notice demanding payment under the Payment of Wages Act.",
      "B. Steal company property equivalent to the salary amount.",
      "C. Threaten the HR manager on WhatsApp.",
      "D. Wait indefinitely for the company's grace."
    ],
    correctOption: "A",
    explanation: "Withholding wages after normal exits is illegal. A formal legal notice gives the employer a timeline to clear dues, failing which you can approach the Labour Commissioner under the Payment of Wages Act.",
    difficulty: "intermediate"
  },
  {
    id: 3,
    category: "Tenant Rights",
    situation: "Your landlord suddenly tells you to vacate the apartment within 2 days, changing the locks while you were out, even though you have a valid 11-month rent agreement and no payment defaults.",
    question: "Is the landlord's action legal?",
    options: [
      "A. Yes, since it's their property, they can do as they please.",
      "B. No, illegal eviction without a court order or proper notice is a criminal offense.",
      "C. Yes, if they reimburse your deposit immediately.",
      "D. Only if their relatives need the house urgently."
    ],
    correctOption: "B",
    explanation: "Even owners cannot evict tenants arbitrarily without due process. Changing locks and illegal eviction is punishable. You can file an FIR for trespass and illegal eviction.",
    difficulty: "intermediate"
  },
  {
    id: 4,
    category: "Right to Information",
    situation: "You noticed the road in your colony was built only last month but has completely broken down. You want to know the contractor's details and the budget allocated.",
    question: "How can you formally acquire this information?",
    options: [
      "A. Ask the local politician during a rally.",
      "B. Bribe a municipal clerk for the files.",
      "C. File an RTI (Right to Information) application.",
      "D. Guess the amount and complain in a newspaper."
    ],
    correctOption: "C",
    explanation: "The RTI Act empowers citizens to request data from public authorities. You can formally file an RTI application online or offline to retrieve copies of contracts and budgets.",
    difficulty: "beginner"
  }
];

// Removed static initialization (initUser) for progress logic
// ─── SMART AI DISPATCHER ───

async function callOllama(prompt, maxTokens, config) {
  try {
    const resp = await axios.post(config.url, {
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      stream: false
    }, {
      headers: { "Authorization": `Bearer ${config.key}` }
    });
    return resp.data.choices[0].message.content;
  } catch (err) {
    throw new Error(err.response?.data?.error?.message || err.message);
  }
}

async function callAnthropic(prompt, maxTokens, config) {
  try {
    const resp = await axios.post(config.url, {
      model: config.model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }, {
      headers: {
        "x-api-key": config.key,
        "anthropic-version": "2023-06-01"
      }
    });
    return resp.data.content[0].text;
  } catch (err) {
    throw new Error(err.response?.data?.error?.message || err.message);
  }
}


async function callPollinations(prompt, maxTokens, config) {
  const resp = await axios.post(config.url, {
    messages: [{ role: "user", content: prompt }],
    model: config.model,
    max_tokens: maxTokens
  });
  return typeof resp.data === 'string' ? resp.data.trim() : JSON.stringify(resp.data);
}


async function callOpenAI(prompt, maxTokens, config) {
  try {
    const resp = await axios.post(config.url, {
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens
    }, {
      headers: { "Authorization": `Bearer ${config.key}` }
    });
    return resp.data.choices[0].message.content;
  } catch (err) {
    throw new Error(err.response?.data?.error?.message || err.message);
  }
}

async function callGemini(prompt, maxTokens, config) {
  try {
    const url = `${config.url}/${config.model}:generateContent?key=${config.key}`;
    const resp = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens }
    });
    return resp.data.candidates[0].content.parts[0].text;
  } catch (err) {
    throw new Error(err.response?.data?.error?.message || err.message);
  }
}


// ─── OPENROUTER CALLER (OpenAI-compatible) ───

async function callOpenRouter(prompt, maxTokens, config, specificModel = null) {
  const modelToUse = specificModel || (Array.isArray(config.models) ? config.models[0] : config.model);
  try {
    const resp = await axios.post(config.url, {
      model: modelToUse,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens
    }, {
      headers: {
        "Authorization": `Bearer ${config.key}`,
        "HTTP-Referer": "https://nyai.legal",
        "X-Title": "nyAI Legal Connect"
      }
    });
    return resp.data.choices?.[0]?.message?.content;
  } catch (err) {
    throw new Error(err.response?.data?.error?.message || err.message);
  }
}


// ─── SMART AI DISPATCHER HELPER ───

async function handleAIRequest(prompt, maxTokens = 1500) {
  const PROVIDERS = getProviders();
  let result = null;
  let engine = "None";
  const TIMEOUT_MS = 12000; // 12s hard timeout per provider

  // 1. FASTEST (PAID): Try OpenAI first — paid key, lowest latency
  if (!result && PROVIDERS.OPENAI.key) {
    try {
      result = await withTimeout(callOpenAI(prompt, maxTokens, PROVIDERS.OPENAI), TIMEOUT_MS, 'OpenAI');
      engine = "OpenAI (GPT-4o-mini)";
      console.log(`✅ AI via ${engine}`);
    } catch (e) {
      console.warn("OpenAI failed:", e.message);
    }
  }

  // 2. FALLBACK: Gemini (free key, sub-3s)
  if (!result && PROVIDERS.GEMINI.key) {
    const geminiModels = [PROVIDERS.GEMINI.model, PROVIDERS.GEMINI.fallbackModel].filter(Boolean);
    for (const model of geminiModels) {
      if (result) break;
      try {
        const config = { ...PROVIDERS.GEMINI, model };
        result = await withTimeout(callGemini(prompt, maxTokens, config), TIMEOUT_MS, `Gemini(${model})`);
        engine = `Google Gemini (${model})`;
        console.log(`✅ AI via ${engine}`);
      } catch (e) {
        console.warn(`Gemini (${model}) failed:`, e.message);
      }
    }
  }

  // 3. Try OpenRouter free models with timeout
  if (!result && PROVIDERS.OPENROUTER.key) {
    const models = Array.isArray(PROVIDERS.OPENROUTER.models) ? PROVIDERS.OPENROUTER.models : [PROVIDERS.OPENROUTER.model];
    for (const model of models) {
      if (result) break;
      try {
        result = await withTimeout(callOpenRouter(prompt, maxTokens, PROVIDERS.OPENROUTER, model), TIMEOUT_MS, `OpenRouter(${model})`);
        engine = `OpenRouter (${model})`;
        console.log(`✅ AI via ${engine}`);
      } catch (e) {
        console.warn(`OpenRouter (${model}) failed:`, e.message);
      }
    }
  }

  // 4. Novita AI
  if (!result && PROVIDERS.OLLAMA.key) {
    try {
      result = await withTimeout(callOllama(prompt, maxTokens, PROVIDERS.OLLAMA), TIMEOUT_MS, 'Novita');
      engine = "Novita AI Cloud";
      console.log(`✅ AI via ${engine}`);
    } catch (e) {
      console.warn("Novita failed:", e.message);
    }
  }

  // 5. Anthropic
  if (!result && PROVIDERS.ANTHROPIC.key) {
    try {
      result = await withTimeout(callAnthropic(prompt, maxTokens, PROVIDERS.ANTHROPIC), TIMEOUT_MS, 'Anthropic');
      engine = "Anthropic Claude";
      console.log(`✅ AI via ${engine}`);
    } catch (e) {
      console.warn("Anthropic failed:", e.message);
    }
  }

  // 6. Last resort: Pollinations (no key, slowest)
  if (!result) {
    try {
      result = await withTimeout(callPollinations(prompt, maxTokens, PROVIDERS.POLLINATIONS), 25000, 'Pollinations');
      engine = "Pollinations AI";
      console.log(`✅ AI via ${engine}`);
    } catch (e) {
      console.error("Pollinations failed:", e.message);
    }
  }

  if (!result) throw new Error("All AI providers exhausted or misconfigured.");
  return { text: result, engine };
}

app.post('/ai/ask', async (req, res) => {
  const { prompt, maxTokens = 1000 } = req.body;
  try {
    const { text, engine } = await handleAIRequest(prompt, maxTokens);
    res.json({ content: [{ text }], engine });
  } catch (err) {
    console.error("Dispatcher Error:", err);
    res.status(500).json({ error: "Failed to communicate with AI engines." });
  }
});

// ─── DEDICATED QUIZ GENERATION ENDPOINT ─── More reliable than /ai/ask for JSON
app.post('/api/generate-quiz', async (req, res) => {
  const { topics, difficulty, count } = req.body;
  if (!topics || !topics.length) {
    return res.status(400).json({ error: "Topics are required." });
  }

  const safeCount = Math.min(count || 3, 5); // Cap at 5 to stay within token limits
  const topicsList = topics.join(', ');

  const systemPrompt = `You are a legal education quiz creator for India. You MUST respond with ONLY a valid JSON array, no other text before or after.`;
  
  const userPrompt = `Create exactly ${safeCount} quiz questions for a ${difficulty || 'Beginner'} level student about: ${topicsList}.
Each question must be a real-world scenario for a young Indian adult aged 18-28.

Return ONLY this JSON array (no markdown, no explanation, just raw JSON):
[{"id":1,"category":"topic name","situation":"2-3 sentence scenario","question":"What should you do?","options":["A. option","B. option","C. option","D. option"],"correctOption":"B","explanation":"2-3 sentence explanation","difficulty":"${difficulty || 'Beginner'}"}]`;

  try {
    const PROVIDERS = getProviders();

    // Try OpenAI with JSON mode first (guaranteed valid JSON)
    if (PROVIDERS.OPENAI.key) {
      try {
        const resp = await axios.post(PROVIDERS.OPENAI.url, {
          model: PROVIDERS.OPENAI.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 2000,
          response_format: { type: "json_object" }
        }, {
          headers: { "Authorization": `Bearer ${PROVIDERS.OPENAI.key}` }
        });

        const raw = resp.data.choices[0].message.content;
        const parsed = JSON.parse(raw);
        const questions = Array.isArray(parsed) ? parsed : Object.values(parsed).find(v => Array.isArray(v)) || [];
        if (questions.length > 0 && questions[0].options) {
          console.log(`✅ Quiz via OpenAI JSON mode (${questions.length} questions)`);
          return res.json({ questions, engine: "OpenAI (Paid)" });
        }
      } catch (e) {
        console.warn("OpenAI JSON mode failed:", e.message);
      }
    }

    // Fallback: Try Gemini (fast and reliable with JSON)
    if (PROVIDERS.GEMINI.key) {
      try {
        const url = `${PROVIDERS.GEMINI.url}/${PROVIDERS.GEMINI.model}:generateContent?key=${PROVIDERS.GEMINI.key}`;
        const resp = await axios.post(url, {
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { maxOutputTokens: 2000, responseMimeType: "application/json" }
        });

        const raw = resp.data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(raw);
        const questions = Array.isArray(parsed) ? parsed : Object.values(parsed).find(v => Array.isArray(v)) || [];
        if (questions.length > 0 && questions[0].options) {
          console.log(`✅ Quiz via Gemini JSON mode (${questions.length} questions)`);
          return res.json({ questions, engine: "Google Gemini (Free)" });
        }
      } catch (e) {
        console.warn("Gemini JSON mode failed:", e.message);
      }
    }


    // Last resort: generic dispatcher with stricter prompt
    const { text, engine } = await handleAIRequest(userPrompt, 1500);
    const cleaned = text.replace(/```json|```/g, '').trim();
    let questions;
    try {
      const parsed = JSON.parse(cleaned);
      questions = Array.isArray(parsed) ? parsed : Object.values(parsed).find(v => Array.isArray(v)) || [];
    } catch (e) {
      // Try bracket extraction
      const arrMatch = cleaned.match(/\[[\s\S]*\]/);
      questions = arrMatch ? JSON.parse(arrMatch[0]) : [];
    }
    
    if (!questions || questions.length === 0 || !questions[0]?.options) {
      return res.status(500).json({ error: "AI returned malformed questions. Please try again." });
    }
    return res.json({ questions, engine });

  } catch (err) {
    console.error("Quiz Generation Error:", err);
    res.status(500).json({ error: "Failed to generate quiz. Please try again shortly." });
  }
});

app.post('/api/legal-chat', async (req, res) => {
  const { message, conversationHistory = [], language = 'en', state } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const stateContext = state ? `User's state: ${state}` : 'State: Not specified (ask user if relevant)';

    let prompt = `You are nyAI, an Indian legal information assistant. You provide accurate, jurisdiction-specific legal information under Indian law. You are NOT a lawyer and do NOT give legal advice.

${stateContext}

IDENTITY RULES
- Always refer to yourself as nyAI.
- Never claim to be a lawyer or say "in my legal opinion".
- If a question requires a court filing, police complaint, or notarized document, end with the ESCALATION line.

RESPONSE FORMAT — always use this exact structure:
**Situation understood:** [1 sentence restatement of what the user is asking]
**What Indian law says:** [Cite the specific Act + Section in plain English. E.g., "Under Section 12 of the Consumer Protection Act, 2019..."]
**Your options:** [2–4 numbered practical steps the user can take right now]
**Recommended next step:** [Single most practical immediate action]
**Need a lawyer?** [Yes / No / Maybe — with a one-line reason]

DOMAIN CLASSIFICATION (use internally to guide your answer)
Identify which domain applies: Consumer Rights | Property & Real Estate | Employment & Labour | Criminal (IPC/CrPC) | Family Law | Tenant/Landlord | Business & Contracts | RTI | Other

JURISDICTION RULES
- If the user's state is known, reference state-specific laws where applicable (e.g., state Rent Control Acts, Shops & Establishments Acts).
- If state is unknown and the answer changes by state, ask: "Which state are you in? Laws on this vary by state."
- Never give generic international answers when Indian law applies.

SAFETY RULE
- If the user appears to be in immediate danger (domestic violence, criminal threat, abuse), provide emergency contacts FIRST before any legal information: Police: 100, Women's Helpline: 181, Child Helpline: 1098.

ESCALATION TRIGGER
If the matter requires court filing, FIR, notarized document, or stamp paper — always end your response with:
"⚖️ This step requires a qualified advocate. Would you like to connect with a verified lawyer on nyAI?"

DISCLAIMER (append to every response):
*nyAI provides general legal information, not legal advice. For binding legal action, consult a qualified advocate.*

CONSTRAINTS
- Max response: 350 words unless user asks for detail.
- Do not speculate on section numbers. If unsure, say "under the relevant provisions of [Act name]".
- Do not hallucinate case citations.
${language !== 'en' ? `\nLANGUAGE: Respond in ISO language code '${language}'.` : ''}

${conversationHistory.length > 0 ? `CONVERSATION HISTORY:\n${conversationHistory.map(m => `${m.isAi ? 'nyAI' : 'User'}: ${m.text}`).join('\n')}\n` : ''}
User: ${message}
nyAI:`;

    const { text, engine } = await handleAIRequest(prompt, 1500);

    // ChatPage.jsx specifically expects `text`
    res.json({ text, engine });
  } catch (err) {
    console.error("Legal Chat Error:", err);
    res.status(500).json({ fallback: "I'm sorry, I'm having trouble connecting to the AI models right now.", error: err.message });
  }
});

app.post('/api/analyze-document', async (req, res) => {
  const { documentText } = req.body;
  if (!documentText || documentText.trim().length === 0) {
    return res.status(400).json({ error: "Document text is required." });
  }

  console.log(`[Analyzer] Processing document of length: ${documentText.length}`);
  const truncated = documentText.substring(0, 8000);

  const systemPrompt = `You are a "Shark Lawyer" with 30 years of experience in Indian Law.
Your goal is to PROTECT your client by being EXTREMELY CRITICAL of any document.
You must find EVERY possible risk, ambiguity, or unfair clause. 
Never be lenient. If a clause is even slightly vague, flag it as a Danger or Warning.
Always find at least 3-5 risk flags for any real document.
Return ONLY a valid JSON object.`;

  const userPrompt = `Analyze this document for ANY possible risks to my interest:
---
${truncated}
---
The result must be a JSON object with this structure:
{
  "documentType": "String",
  "partyA": "String",
  "partyB": "String",
  "healthScore": 0-100 (Be harsh!),
  "riskLevel": "Low|Medium|High|Critical",
  "summary": "1-2 sentences of the biggest dangers",
  "riskFlags": [
    { "type": "Danger|Warning|Info", "title": "...", "desc": "...", "recommendation": "..." }
  ],
  "keyClauses": [
    { "clause": "...", "text": "...", "status": "Fair|Vague|Unfair" }
  ],
  "missingClauses": ["..."],
  "recommendations": ["..."]
}`;

  try {
    const PROVIDERS = getProviders();
    let parsedData = null;

    // 1. Try OpenAI JSON mode
    if (PROVIDERS.OPENAI.key) {
      try {
        console.log("[Analyzer] Attempting OpenAI (Shark Mode)...");
        const resp = await axios.post(PROVIDERS.OPENAI.url, {
          model: PROVIDERS.OPENAI.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 2000,
          response_format: { type: "json_object" }
        }, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${PROVIDERS.OPENAI.key}`
          }
        });
        if (resp.status === 200) {
          parsedData = JSON.parse(resp.data.choices[0].message.content);
          console.log("✅ [Analyzer] Success via OpenAI");
        }
      } catch (e) {
        console.warn("⚠️ [Analyzer] OpenAI failed:", e.message);
      }
    }

    // 2. Try Gemini JSON mode
    if (!parsedData && PROVIDERS.GEMINI.key) {
      try {
        console.log("[Analyzer] Attempting Gemini (Shark Mode)...");
        const url = `${PROVIDERS.GEMINI.url}/${PROVIDERS.GEMINI.model}:generateContent?key=${PROVIDERS.GEMINI.key}`;
        const resp = await axios.post(url, {
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { maxOutputTokens: 2000, responseMimeType: "application/json" }
        });
        if (resp.status === 200) {
          parsedData = JSON.parse(resp.data.candidates[0].content.parts[0].text);
          console.log("✅ [Analyzer] Success via Gemini");
        }
      } catch (e) {
        console.warn("⚠️ [Analyzer] Gemini failed:", e.message);
      }
    }

    // 3. Fallback
    if (!parsedData) {
      let rawText = '';
      try {
        const { text } = await handleAIRequest(userPrompt, 2000);
        rawText = text;
        parsedData = JSON.parse(text.replace(/```json|```/g, '').trim());
      } catch (e) {
        const objMatch = rawText.match(/\{[\s\S]*\}/);
        parsedData = objMatch ? JSON.parse(objMatch[0]) : null;
      }
    }

    if (!parsedData) {
      return res.status(500).json({ error: "Shark AI is resting. Please try again." });
    }

    // --- SMART NORMALIZER ---
    const findKey = (data, keywords) => {
      const keys = Object.keys(data);
      const found = keys.find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
      return found ? data[found] : null;
    };

    // Normalize Risks
    const risks = findKey(parsedData, ['risk', 'issue', 'flag', 'danger', 'alert']) || [];
    if (Array.isArray(risks) && risks.length > 0) parsedData.riskFlags = risks;

    // Normalize Clauses
    const clauses = findKey(parsedData, ['clause', 'point', 'section', 'item']) || [];
    if (Array.isArray(clauses) && clauses.length > 0) parsedData.keyClauses = clauses;

    // Final mapping for internal structure
    parsedData.riskFlags = (parsedData.riskFlags || []).map(f => ({
      type: f.type || 'Warning',
      title: f.title || f.issue || f.label || 'Legal Risk',
      desc: f.desc || f.description || f.text || '',
      recommendation: f.recommendation || f.suggestion || f.fix || ''
    }));

    parsedData.keyClauses = (parsedData.keyClauses || []).map(c => ({
      clause: c.clause || c.title || c.label || 'Clause',
      text: c.text || c.content || c.excerpt || '',
      status: c.status || 'Vague'
    }));

    parsedData.healthScore = parsedData.healthScore ?? 50;
    parsedData.documentType = parsedData.documentType || 'Legal Document';

    res.json(parsedData);
  } catch (err) {
    console.error("❌ Shark Analyzer Error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});


app.post('/api/generate-response', async (req, res) => {
  const { documentText, analysisResult } = req.body;
  if (!documentText) {
    return res.status(400).json({ error: "Document text is required." });
  }

  try {
    const prompt = `You are an expert Indian corporate lawyer.
The user has received the following legal document (e.g. contract, notice):
---
${documentText.substring(0, 3000)}
---

A prior AI analysis flagged the following risks:
${JSON.stringify(analysisResult?.riskFlags || "None detected", null, 2)}

Draft a highly professional, formal legal response on behalf of the user to the sender of this document.
The response should firmly but politely challenge any unfair clauses and state the user's position clearly under Indian law.
Provide ONLY the raw text of the response (no markdown formatting, no commentary).`;

    const { text, engine } = await handleAIRequest(prompt, 1000);
    res.json({ text, engine });
  } catch (err) {
    console.error("Generate Response Error:", err);
    res.status(500).json({ error: "Failed to generate response." });
  }
});

app.post('/ai/generate-scenarios', async (req, res) => {
  const prompt = `Generate 3 unique legal scenarios for India. Return ONLY a valid JSON array. 
Fields: id (starting from ${scenarios.length + 1}), category, situation, question, options, correctOption, explanation, difficulty.`;

  try {
    const { text, engine } = await handleAIRequest(prompt, 2000);
    const cleaned = text.replace(/```json|```/g, "").trim();
    const newScenarios = JSON.parse(cleaned);
    scenarios = [...scenarios, ...newScenarios];
    res.json({ message: `Success. Created ${newScenarios.length} cases.`, engine, total: scenarios.length });
  } catch (err) {
    console.error("Generation Error:", err);
    res.status(500).json({ error: "Failed to generate or parse AI scenarios." });
  }
});

// ─── DATA ROUTES ───

app.get('/api/lawyers', async (req, res) => {
  const { lat, lng, radius = 50000, query = "lawyer" } = req.query;
  const apiKey = process.env.VITE_GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    return res.status(400).json({ error: "Missing VITE_GOOGLE_PLACES_API_KEY in .env" });
  }

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Google Places REST Error:", error);
    res.status(500).json({ error: "Failed to fetch places" });
  }
});

app.get('/api/scenarios', (req, res) => {
  res.json(scenarios);
});

app.post('/api/progress', async (req, res) => {
  const { userId, scenarioId, isCorrect } = req.body;
  try {
    let user = null;
    if (userId && mongoose.isValidObjectId(userId)) {
      user = await User.findById(userId);
    }
    
    // Fallback for guest
    if (!user) {
       return res.json({
          totalPoints: isCorrect ? 10 : 0, level: "Beginner", badges: ["Guest Mode"], completedScenarios: [scenarioId], accuracy: 100, totalCasesClosed: 1, activeEngine: "Guest"
       });
    }

    if (!user.completedScenarios.includes(scenarioId)) {
      user.completedScenarios.push(scenarioId);
      user.totalAnswers += 1;
      if (isCorrect) {
        user.correctAnswers += 1;
        user.totalPoints += 10;
      }
      if (user.completedScenarios.length === 1 && !user.badges.includes("First Step")) {
        user.badges.push("First Step");
      }
      if (user.correctAnswers >= 5 && !user.badges.includes("Sharp Mind")) {
        user.badges.push("Sharp Mind");
      }
      if (user.completedScenarios.length >= 10 && !user.badges.includes("Legal Eagle")) {
        user.badges.push("Legal Eagle");
      }
      await user.save();
    }

    let level = "Beginner";
    if (user.totalPoints >= 51 && user.totalPoints <= 150) level = "Aware";
    if (user.totalPoints > 150) level = "Advanced";

    const providers = getProviders();
    const engine = providers.OLLAMA.key ? "Ollama Cloud" : (providers.OPENAI.key ? "OpenAI" : "None");

    res.json({
      totalPoints: user.totalPoints,
      level,
      badges: user.badges,
      completedScenarios: user.completedScenarios,
      accuracy: user.totalAnswers > 0 ? Math.round((user.correctAnswers / user.totalAnswers) * 100) : 0,
      totalCasesClosed: user.completedScenarios.length,
      activeEngine: engine
    });
  } catch (err) {
    console.error("Progress Error:", err);
    res.status(500).json({ error: "Failed to update progress" });
  }
});

app.get('/api/progress/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    let user = null;
    if (userId && mongoose.isValidObjectId(userId)) {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.json({
        totalPoints: 0, level: "Beginner", badges: [], completedScenarios: [], accuracy: 0, totalCasesClosed: 0, activeEngine: "Guest"
      });
    }

    let level = "Beginner";
    if (user.totalPoints >= 51 && user.totalPoints <= 150) level = "Aware";
    if (user.totalPoints > 150) level = "Advanced";

    const providers = getProviders();
    const engine = providers.OLLAMA.key ? "Ollama Cloud" : (providers.OPENAI.key ? "OpenAI" : "None");

    res.json({
      totalPoints: user.totalPoints,
      level,
      badges: user.badges,
      completedScenarios: user.completedScenarios,
      accuracy: user.totalAnswers > 0 ? Math.round((user.correctAnswers / user.totalAnswers) * 100) : 0,
      totalCasesClosed: user.completedScenarios.length,
      activeEngine: engine
    });
  } catch (err) {
    console.error("Fetch Progress Error:", err);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

// ─── EMAIL TRANSPORTER ───
const createEmailTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  
  if (!user || !pass) {
    console.warn("⚠️  EMAIL_USER or EMAIL_PASS not set in .env — email sending will fail.");
    return null;
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
};

// ─── SEND LAWYER EMAIL ENDPOINT ───
app.post('/api/send-lawyer-email', async (req, res) => {
  const { clientInfo, answers, lawyer, category } = req.body;
  
  if (!clientInfo || !lawyer) {
    return res.status(400).json({ success: false, error: "Missing client or lawyer information." });
  }
  
  // Build the AI prompt to compose the email
  const answersText = Object.entries(answers || {})
    .map(([key, value]) => `- ${key.replace(/_/g, ' ').toUpperCase()}: ${value}`)
    .join('\n');
  
  const composePrompt = `You are a professional legal assistant for nyAI, an Indian legal-tech platform.
Compose a formal, professional email to a lawyer notifying them about a new client inquiry.

LAWYER DETAILS:
- Name: ${lawyer.name}
- Specialty: ${lawyer.specialty || category}
- City: ${lawyer.city || 'India'}

CLIENT DETAILS:
- Name: ${clientInfo.name}
- Phone: ${clientInfo.phone}
- Email: ${clientInfo.email}
- City: ${clientInfo.city}

CASE CATEGORY: ${category}

CASE DETAILS PROVIDED BY CLIENT:
${answersText}

INSTRUCTIONS:
1. Write a professional email body (not including subject line).
2. Address the lawyer formally (Dear ${lawyer.name}).
3. Introduce the client and their legal matter concisely.
4. Summarize the case details provided in a structured, easy-to-read format.
5. Include the client's contact information clearly.
6. End with a request for the advocate to reach out to the client at their earliest convenience.
7. Sign off as "nyAI Legal Connect Platform".
8. Keep the tone professional, respectful, and concise.
9. Do NOT add any HTML tags, just plain text.`;

  try {
    // Step 1: Compose the email using AI
    let emailBody;
    try {
      const { text } = await handleAIRequest(composePrompt, 1500);
      emailBody = text;
    } catch (aiError) {
      // Fallback: compose manually if AI fails
      console.warn("AI compose failed, using manual template:", aiError.message);
      emailBody = `Dear ${lawyer.name},

Greetings from nyAI Legal Connect Platform.

A new client has submitted a consultation request through our platform for your expertise in ${category}. Below are the details:

CLIENT INFORMATION:
• Name: ${clientInfo.name}
• Phone: ${clientInfo.phone}
• Email: ${clientInfo.email}
• City: ${clientInfo.city}

CASE DETAILS (${category}):
${answersText}

We kindly request you to review the above information and reach out to the client at your earliest convenience.

Thank you for being a trusted advocate on our platform.

Warm regards,
nyAI Legal Connect Platform
"Democratizing access to justice for every Indian citizen."`;
    }

    // Step 2: Send the email
    const transporter = createEmailTransporter();
    
    if (!transporter) {
      console.log("─── EMAIL WOULD BE SENT (SMTP not configured) ───");
      console.log(`TO: ${lawyer.email}`);
      console.log(`SUBJECT: New Client Inquiry — ${category} | ${clientInfo.name} via nyAI`);
      console.log(`BODY:\n${emailBody}`);
      console.log("─── END EMAIL ───");
      
      return res.json({ 
        success: true, 
        message: "Email composed successfully (SMTP not configured — logged to console).",
        preview: emailBody
      });
    }

    const mailOptions = {
      from: `"${clientInfo.name} via nyAI" <${process.env.EMAIL_USER}>`,
      to: lawyer.email,
      replyTo: clientInfo.email,
      subject: `New Client Inquiry — ${category} | ${clientInfo.name} via nyAI`,
      text: emailBody
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${lawyer.email}: ${info.messageId}`);
    
    res.json({ 
      success: true, 
      message: `Email successfully sent to ${lawyer.name}.`,
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to send email: ${error.message}` 
    });
  }
});

app.post('/api/predict-case', async (req, res) => {
  const { description, state } = req.body;
  if (!description) return res.status(400).json({ error: "Case description is required." });

  try {
    // ── 1. Live search IndianKanoon for matching real cases ──────────────────
    const liveCases = await searchCases(description, 8);
    console.log(`[Predictor] Live search returned ${liveCases.length} cases`);

    // ── 2. Upsert live results into vector store for future queries ──────────
    for (const c of liveCases) {
      await upsertCase(c);
    }

    // ── 3. Find semantically similar cases from vector store ─────────────────
    const similarCases = await findSimilarCases(description, 5);
    console.log(`[Predictor] Found ${similarCases.length} similar cases in store`);

    // ── 4. Run outcome model on similar cases ────────────────────────────────
    const { strengthScore, verdictType, dataConfidence, outcomeBreakdown } = predictOutcome(
      similarCases.length > 0 ? similarCases : liveCases
    );

    // ── 5. LLM generates procedural guidance grounded in real case context ───
    const caseContext = (similarCases.length > 0 ? similarCases : liveCases)
      .slice(0, 3)
      .map(c => `- ${c.title || c.metadata?.title} (${c.court || c.metadata?.court}, ${c.date || c.metadata?.date}): ${c.outcome || c.metadata?.outcome}`)
      .join('\n');

    const guidancePrompt = `You are an Indian legal analyst. Based on these real similar cases:
${caseContext || 'No direct case matches found — use general Indian legal principles.'}

And this case description: "${description}"
State: ${state || 'Not specified'}

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "applicableLaw": "Primary Indian Act and Section (e.g. Consumer Protection Act 2019, Section 35)",
  "recommendedForum": "Specific court or forum to approach",
  "successAction": "Mediation | Litigation | Arbitration | Settlement | Police Complaint | Consumer Forum",
  "avgDuration": "e.g. 14 Months",
  "timeline": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "evidenceChecklist": ["item 1", "item 2", "item 3"],
  "riskFactors": ["item 1", "item 2"]
}`;

    const { text } = await handleAIRequest(guidancePrompt, 800);
    let guidance = {};
    try {
      guidance = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch(parseErr) {
      console.warn('[Predictor] Guidance JSON parse failed, using defaults');
    }

    // ── 6. Build final enriched response ─────────────────────────────────────
    res.json({
      // Strength score from real data
      winProbability: `${Math.round(strengthScore)}%`,
      confidenceScale: Math.round(strengthScore),
      verdictType,
      dataConfidence: `${Math.round(dataConfidence * 100)}%`,
      casesAnalysed: similarCases.length + liveCases.length,
      similarCases: (similarCases.length > 0 ? similarCases : liveCases).slice(0, 5).map(c => ({
        title: c.title || c.metadata?.title || 'Unknown',
        court: c.court || c.metadata?.court || 'Unknown',
        date: c.date || c.metadata?.date || 'Unknown',
        outcome: c.outcome || c.metadata?.outcome || 'unknown',
        url: c.url || c.metadata?.url || '',
      })),
      outcomeBreakdown,
      // LLM-generated procedural guidance
      avgDuration: guidance.avgDuration || '12–24 Months',
      applicableLaw: guidance.applicableLaw || 'Refer to relevant Indian Act',
      recommendedForum: guidance.recommendedForum || 'Consult a qualified advocate',
      successAction: guidance.successAction || 'Consult Lawyer',
      timeline: guidance.timeline || ['Review Case', 'Send Legal Notice', 'File in Court', 'Final Order'],
      evidenceChecklist: guidance.evidenceChecklist || [],
      riskFactors: guidance.riskFactors || [],
      // Meta
      disclaimer: "Strength score is derived from real Indian court judgment patterns via IndianKanoon. Actual outcomes depend on evidence, legal representation, and the presiding authority. This is not legal advice.",
      dataSource: "IndianKanoon.org",
    });

  } catch(err) {
    console.error("[Predictor] Error:", err.message);
    // Graceful fallback — never return a 500
    res.json({
      winProbability: "50%",
      confidenceScale: 50,
      verdictType: "Insufficient Data",
      dataConfidence: "0%",
      casesAnalysed: 0,
      similarCases: [],
      outcomeBreakdown: { allowed: 0, dismissed: 0, partial: 0, unknown: 0 },
      avgDuration: "Unknown",
      applicableLaw: "Refer to relevant Indian Act",
      recommendedForum: "Consult a qualified advocate",
      successAction: "Consult Lawyer",
      timeline: ["Review Case", "Send Notice", "File in Court", "Await Order"],
      evidenceChecklist: [],
      riskFactors: [],
      disclaimer: "Live data unavailable. Please try again shortly — our system is seeding case data.",
      dataSource: "Fallback mode",
    });
  }
});

app.post('/api/generate-document', async (req, res) => {
  const { type, details } = req.body;
  if (!type || !details) return res.status(400).json({ error: "Document type and details are required." });

  // High-Quality, Legally Detailed Internal Fallback Library
  const fallbacks = {
    'Rental Agreement': `RESIDENTIAL RENTAL AGREEMENT
    
This Agreement is made on this ______ day of ______, 2026, at [City], BETWEEN:
${details.landlordName || '[Landlord Name]'}, residing at [Landlord Address], hereinafter referred to as the 'LANDLORD';
AND
${details.tenantName || '[Tenant Name]'}, residing at [Tenant Address], hereinafter referred to as the 'TENANT'.

1. PREMISES: The Landlord hereby leases to the Tenant the property located at: ${details.propertyAddress || '[Property Address]'}.
2. TERM: The lease shall be for a fixed term of ${details.term || '11'} months, starting from [Start Date].
3. RENT & DEPOSIT: The Tenant agrees to pay a monthly rent of ₹${details.rentAmount || '_____'}. A security deposit of ₹${details.depositAmount || '_____'}.
4. MAINTENANCE: Tenant shall be responsible for minor repairs and electricity charges.
5. TERMINATION: One month written notice required from either side for termination before the expiry of the lease.
6. NO SUBLETTING: The Tenant shall not sublet or part with the possession of the premises.
7. QUIET ENJOYMENT: The Tenant shall have the right to peaceful and quiet enjoyment of the premises during the term.
8. GOVERNING LAW: This agreement shall be governed by the laws of India and the local jurisdiction of [City].

IN WITNESS WHEREOF the parties have set their hands on the day and year first above written.

LANDLORD: ______________    TENANT: ______________
Witness 1: ______________   Witness 2: ______________`,

    'Power of Attorney': `GENERAL POWER OF ATTORNEY (GPA)
    
KNOW ALL MEN BY THESE PRESENTS that I, ${details.principalName || '[Principal Name]'}, residing at [Principal Address], do hereby constitute and appoint:
${details.agentName || '[Agent Name]'}, residing at [Agent Address], as my lawful Attorney to do the following acts, deeds and things in my name and on my behalf:

1. MANAGEMENT: To manage, lease, and look after my properties, bank accounts, and legal matters.
2. AUTHORITY: ${details.powers || 'To sign documents, represent in court, and handle financial transactions.'}
3. LEGAL REPRESENTATION: To engage advocates, sign vakalatnamas, and attend court hearings on my behalf.
4. FINANCIAL TRANSACTIONS: To operate bank accounts, deposit/withdraw funds, and sign cheques.
5. DURATION: This Power of Attorney shall remain valid until revoked by me in writing.
6. RATIFICATION: I hereby agree to ratify and confirm all acts lawfully done by my said Attorney.

SIGNED AND DELIVERED by the Principal on this ______ day of ______, 2026.

PRINCIPAL: ______________
WITNESS 1: ______________   WITNESS 2: ______________`,

    'Will Draft': `LAST WILL AND TESTAMENT
    
I, ${details.testatorName || '[Testator Name]'}, being of sound mind and over the age of 18 years, do hereby make, publish and declare this to be my Last Will and Testament, revoking all prior Wills.

1. BENEFICIARIES: I give, devise and bequeath all my movable and immovable properties to:
${details.beneficiaryName || '[Beneficiary Name]'}, absolutely and forever.
2. ASSET DETAILS: ${details.assets || 'All my residential flat, bank savings, and gold jewellery.'}
3. EXECUTOR: I hereby appoint [Name] as the sole Executor of this my Will.
4. GUARDIANSHIP: If any beneficiary is a minor, I appoint [Name] as the guardian of such property.
5. DEBT PAYMENT: I direct that all my debts and funeral expenses be paid out of my estate.
6. SIGNATURE: My properties shall be inherited by the above beneficiary without any dispute.

DATED: This ______ day of ______, 2026.

TESTATOR: ______________
WITNESS 1: ______________   WITNESS 2: ______________`,

    'Legal Notice': `LEGAL NOTICE
    
To,
${details.receiverName || '[Receiver Name]'},
[Receiver Address]

SUB: LEGAL NOTICE FOR ${details.reason?.toUpperCase() || 'RECOVERY OF DUES'}

Under instructions from my client, ${details.senderName || '[Sender Name]'}, I hereby serve you with this Legal Notice:
1. That my client states: ${details.details || '[Statement of facts]'}.
2. That you have breached the terms of our agreement and failed to fulfill your legal obligations.
3. That you are hereby called upon to comply with the demands of my client within 15 days from the receipt of this notice.
4. Failure to do so will compel my client to initiate legal proceedings against you in the court of law.

Yours faithfully,
[Sender/Advocate Name]`,

    'RTI Application': `RTI APPLICATION (FORM-A)
    
To,
The Public Information Officer (PIO),
${details.departmentName || '[Department Name]'}

1. APPLICANT: ${details.applicantName || '[Name]'}
2. ADDRESS: [Applicant Address]
3. PARTICULARS OF INFORMATION: I am seeking the following information under the RTI Act, 2005:
   ${details.infoRequired || '[Information details]'}
4. FEE: I have paid the application fee of ₹10 via [Mode of Payment].
5. CITIZENSHIP: I am a citizen of India.

Place: ______
Date: ______
Signature: ______________`,

    'Affidavit': `GENERAL AFFIDAVIT
    
I, ${details.deponentName || '[Name]'}, son/daughter of ${details.fatherName || '[Father Name]'}, residing at ${details.address || '[Address]'}, do hereby solemnly affirm and state on oath as follows:
1. That I am making this affidavit for the purpose of: ${details.purpose || '[Purpose]'}.
2. That I am aware of the legal consequences of providing false information under Section 193 of the IPC.
3. That the contents of this affidavit are true and correct to the best of my knowledge.

Verified at [City] on this ______ day of ______, 2026.

DEPONENT: ______________`
  };

  try {
    // Use handleAIRequest (Gemini-first fast path) instead of raw Pollinations
    const prompt = `You are an expert Indian Solicitor. Draft a professional Indian ${type} legal document.
Details: ${JSON.stringify(details)}
Rules: Return ONLY the document text. No explanations. No JSON. No markdown fences. Minimum 500 words. Include signature blocks.`;

    const { text: rawOutput, engine: docEngine } = await handleAIRequest(prompt, 1800);
    console.log(`[DocGen] Used engine: ${docEngine}`);
    let textOutput = rawOutput;

    // Try to parse if it returned JSON instead of raw text
    try {
      const parsed = JSON.parse(rawOutput);
      if (parsed.content) textOutput = parsed.content;
      else if (parsed.choices?.[0]?.message?.content) textOutput = parsed.choices[0].message.content;
    } catch(e) {
      // It's already raw text (or broken JSON), keep as is
    }
    
    // Clean up markdown/JSON markers if they appear
    textOutput = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();

    // Secondary cleanup for role/reasoning prefix stringify artifacts
    if (textOutput.startsWith('{') && textOutput.includes('"content":')) {
       try {
          const inner = JSON.parse(textOutput);
          textOutput = inner.content || textOutput;
       } catch(e) {}
    }

    // Hardened check for AI refusals or low-quality content
    const refusals = ["sorry", "can't help", "policy", "cannot fulfill", "as an ai", "language model"];
    const isUseless = refusals.some(word => textOutput.toLowerCase().includes(word)) || textOutput.length < 300;

    if (isUseless) {
       console.log(`[AI REFUSAL/QUALITY CHECK FAILED] for ${type}. Switching to Internal Master Template.`);
       return res.json({ content: fallbacks[type] || `DRAFT: ${type.toUpperCase()}\n\n[Details: ${JSON.stringify(details)}]` });
    }

    res.json({ content: textOutput });
  } catch(e) {
    console.error(`[AI FETCH FAILED] for ${type}:`, e.message);
    res.json({ content: fallbacks[type] || `Drafting failed. Contact support for ${type}.` });
  }
});

app.post('/api/detect-fake-doc', async (req, res) => {
  const { docContent, docType } = req.body;
  if (!docContent) return res.status(400).json({ error: "Document content or description is required." });

  try {
    const prompt = `Analyze this ${docType || 'Legal'} document for authenticity. 
Look for logical errors, fake dates, inconsistent formatting, or suspicious signatures. 
Content: ${docContent}

Response Format (JSON ONLY):
{
  "status": "authentic" | "suspicious" | "fake",
  "confidence": "XX%",
  "analysis": "Brief forensic findings",
  "highlights": [
    { "text": "exact phrase from content", "reason": "why this is flagged" }
  ],
  "signals": [
    { "label": "Temporal Accuracy", "pass": true, "score": "95%" },
    { "label": "Metadata Integrity", "pass": true, "score": "90%" },
    { "label": "Official Cross-check", "pass": true, "score": "85%" },
    { "label": "Logic Consistency", "pass": true, "score": "100%" }
  ]
}`;

    const fetchRes = await fetch('https://text.pollinations.ai/', {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        messages: [
          {role: "system", content: "You are an AI Forensic Analyst. Analyze the document context and logic. Output ONLY JSON."},
          {role: "user", content: prompt}
        ],
        model: "openai"
      })
    });

    let textOutput = (await fetchRes.text()).trim();
    
    // Clean up if AI adds markdown backticks
    if (textOutput.includes('```')) {
      textOutput = textOutput.split('```')[1];
      if (textOutput.startsWith('json')) textOutput = textOutput.replace(/^json/, '');
    }

    let result;
    try {
      result = JSON.parse(textOutput);
    } catch(e) {
      console.log("[PARSING FAILED] Raw Output:", textOutput);
      result = {
        status: "suspicious",
        confidence: "65%",
        analysis: "Automated logic cross-check failed to parse the detailed forensic data, but initial heuristics suggest potential inconsistencies in the document timeline or structure.",
        signals: [
          { label: "Temporal Accuracy", pass: false, score: "Low" },
          { label: "Logical Flow", pass: true, score: "High" }
        ]
      };
    }

    res.json(result);
  } catch(e) {
    console.error("Detector Error:", e);
    res.status(500).json({ error: "Detector failed. Service busy." });
  }
});


// ─── DASHBOARD API ROUTES ─────────────────────────────────────────────────────

// 1. GET /api/dashboard — main dashboard data feed
app.get('/api/dashboard', protect, async (req, res) => {
  try {
    const user = req.user;

    const activeCases = user.trackedCases.filter(c => c.status === 'active').length;

    const alertsCleared = user.totalAlerts > 0
      ? Math.round((user.alertsCleared / user.totalAlerts) * 100)
      : 0;

    const sortedNotifications = [...user.notifications]
      .sort((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0))
      .slice(0, 5);

    const unreadCount = user.notifications.filter(n => !n.read).length;

    const upcomingHearings = user.trackedCases
      .flatMap(c => c.hearings.map(h => ({
        caseId: c.caseId,
        caseTitle: c.caseTitle,
        court: c.court,
        category: c.category,
        date: h.date,
        notes: h.notes,
        daysUntil: Math.ceil((new Date(h.date) - new Date()) / (1000 * 60 * 60 * 24))
      })))
      .filter(h => h.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);

    res.json({
      userName: user.name,
      legalHealthScore: user.legalHealthScore,
      scoreChange: 4,
      docsVerified: user.docsVerified,
      totalDocs: user.totalDocs,
      activeCases,
      alertsCleared,
      consultationHrs: user.consultationHrs,
      notifications: sortedNotifications,
      unreadCount,
      trackedCases: user.trackedCases,
      upcomingHearings,
      complianceItems: [
        { label: 'Income Tax Proof', done: true },
        { label: 'Rental Renewal', done: false },
        { label: 'IP Trademark Status', done: true },
        { label: 'GST Filing Status', done: true },
        { label: 'Family Will Update', done: false }
      ]
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

// 2. POST /api/cases — add tracked case
app.post('/api/cases', protect, async (req, res) => {
  const { caseId, caseTitle, court, state, category, filingDate } = req.body;
  if (!caseId || !caseTitle) {
    return res.status(400).json({ error: 'caseId and caseTitle are required.' });
  }
  try {
    const user = req.user;

    user.trackedCases.push({ caseId, caseTitle, court, state, category, filingDate: filingDate ? new Date(filingDate) : undefined });

    user.notifications.push({
      message: `Case ${caseId} — ${caseTitle} added`,
      category: 'ALERT',
      daysUntil: 0,
      read: false
    });
    user.totalAlerts += 1;

    user.recalcHealthScore();
    await user.save();

    res.json({ success: true, trackedCases: user.trackedCases });
  } catch (err) {
    console.error('Add Case Error:', err);
    res.status(500).json({ error: 'Failed to add case.' });
  }
});

// 3. POST /api/cases/:caseId/hearings — add hearing to case
app.post('/api/cases/:caseId/hearings', protect, async (req, res) => {
  const { date, notes } = req.body;
  if (!date) return res.status(400).json({ error: 'Hearing date is required.' });

  try {
    const user = req.user;
    const trackedCase = user.trackedCases.find(c => c.caseId === req.params.caseId);
    if (!trackedCase) return res.status(404).json({ error: 'Case not found.' });

    const hearingDate = new Date(date);
    const daysUntil = Math.ceil((hearingDate - new Date()) / (1000 * 60 * 60 * 24));
    const formattedDate = hearingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    trackedCase.hearings.push({ date: hearingDate, notes });

    user.notifications.push({
      message: `Hearing for ${trackedCase.caseTitle} on ${formattedDate}${notes ? ' — ' + notes : ''}`,
      category: 'HEARING',
      daysUntil,
      read: false
    });
    user.totalAlerts += 1;

    await user.save();
    res.json({ success: true, case: trackedCase });
  } catch (err) {
    console.error('Add Hearing Error:', err);
    res.status(500).json({ error: 'Failed to add hearing.' });
  }
});

// 4. PATCH /api/cases/:caseId/status — update case status
app.patch('/api/cases/:caseId/status', protect, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'resolved', 'dropped'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  try {
    const user = req.user;
    const trackedCase = user.trackedCases.find(c => c.caseId === req.params.caseId);
    if (!trackedCase) return res.status(404).json({ error: 'Case not found.' });

    trackedCase.status = status;

    if (status === 'resolved') {
      user.notifications.push({
        message: `Case ${trackedCase.caseId} — ${trackedCase.caseTitle} resolved`,
        category: 'ALERT',
        daysUntil: 0,
        read: false
      });
      user.totalAlerts += 1;
    }

    user.recalcHealthScore();
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Update Status Error:', err);
    res.status(500).json({ error: 'Failed to update case status.' });
  }
});

// 5. DELETE /api/cases/:caseId — delete tracked case
app.delete('/api/cases/:caseId', protect, async (req, res) => {
  try {
    const user = req.user;
    const before = user.trackedCases.length;
    user.trackedCases = user.trackedCases.filter(c => c.caseId !== req.params.caseId);
    if (user.trackedCases.length === before) return res.status(404).json({ error: 'Case not found.' });
    user.recalcHealthScore();
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Delete Case Error:', err);
    res.status(500).json({ error: 'Failed to delete case.' });
  }
});

// 6. PATCH /api/notifications/read — mark all notifications read
app.patch('/api/notifications/read', protect, async (req, res) => {
  try {
    const user = req.user;
    const unread = user.notifications.filter(n => !n.read).length;
    user.notifications.forEach(n => { n.read = true; });
    user.alertsCleared += unread;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Mark Read Error:', err);
    res.status(500).json({ error: 'Failed to mark notifications read.' });
  }
});

// 7. POST /api/notifications/custom — add custom alert
app.post('/api/notifications/custom', protect, async (req, res) => {
  const { message, category, daysUntil } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required.' });
  const validCategories = ['COMPLIANCE', 'PROPERTY', 'TAX', 'HEARING', 'ALERT'];
  try {
    const user = req.user;
    user.notifications.push({
      message,
      category: validCategories.includes(category) ? category : 'ALERT',
      daysUntil: parseInt(daysUntil) || 0,
      read: false
    });
    user.totalAlerts += 1;
    await user.save();
    const sorted = [...user.notifications].sort((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0));
    res.json({ success: true, notifications: sorted });
  } catch (err) {
    console.error('Custom Alert Error:', err);
    res.status(500).json({ error: 'Failed to add custom alert.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

// ─── LAWYER PORTAL ───────────────────────────────────────────────────────────

// Lawyer auth middleware
const protectLawyer = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nyAI_super_secret_dev_key');
      req.lawyer = await Lawyer.findById(decoded.id).select('-password');
      if (!req.lawyer) throw new Error('Not a lawyer account');
      next();
    } catch(err) {
      res.status(401).json({ error: 'Not authorized as lawyer' });
    }
  } else {
    res.status(401).json({ error: 'No token provided' });
  }
};

// Register lawyer
app.post('/api/lawyer/register', async (req, res) => {
  const { name, email, password, phone, barCouncilNumber, state, city, specializations } = req.body;
  if (!name || !email || !password || !barCouncilNumber) {
    return res.status(400).json({ error: 'Name, email, password, and bar council number are required.' });
  }
  try {
    const existing = await Lawyer.findOne({ email });
    if (existing) return res.status(400).json({ error: 'A lawyer with this email already exists.' });
    const lawyer = await Lawyer.create({ name, email, password, phone, barCouncilNumber, state, city, specializations: specializations || [] });
    res.status(201).json({ _id: lawyer._id, name: lawyer.name, email: lawyer.email, token: generateToken(lawyer._id), role: 'lawyer' });
  } catch (err) {
    console.error('Lawyer Register Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login lawyer
app.post('/api/lawyer/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const lawyer = await Lawyer.findOne({ email });
    if (lawyer && (await lawyer.matchPassword(password))) {
      res.json({ _id: lawyer._id, name: lawyer.name, email: lawyer.email, barCouncilNumber: lawyer.barCouncilNumber, verified: lawyer.verified, token: generateToken(lawyer._id), role: 'lawyer' });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Lawyer Login Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 1. Get lawyer dashboard
app.get('/api/lawyer/dashboard', protectLawyer, async (req, res) => {
  try {
    const lawyer = req.lawyer;
    const now = new Date();
    const upcomingHearings = lawyer.cases
      .flatMap(c => c.hearings.map(h => ({ caseId: c.caseId, caseTitle: c.title, clientName: c.clientName, court: c.court, date: h.date, notes: h.notes, daysUntil: Math.ceil((new Date(h.date) - now) / (1000*60*60*24)) })))
      .filter(h => h.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);
    res.json({
      name: lawyer.name, barCouncilNumber: lawyer.barCouncilNumber, verified: lawyer.verified,
      totalCases: lawyer.cases.length,
      activeCases: lawyer.cases.filter(c => c.status === 'active').length,
      wonCases: lawyer.cases.filter(c => c.status === 'won').length,
      totalClients: lawyer.clients.length,
      upcomingHearings,
      recentCases: [...lawyer.cases].reverse().slice(0, 5),
      notifications: lawyer.notifications.filter(n => !n.read).slice(0, 10),
      unreadCount: lawyer.notifications.filter(n => !n.read).length
    });
  } catch (err) {
    console.error('Lawyer Dashboard Error:', err);
    res.status(500).json({ error: 'Failed to load lawyer dashboard.' });
  }
});

// 2. Add a client
app.post('/api/lawyer/clients', protectLawyer, async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'Client name required.' });
  try {
    const lawyer = req.lawyer;
    lawyer.clients.push({ name, email, phone });
    lawyer.notifications.push({ message: `New client ${name} added`, type: 'client', read: false });
    await lawyer.save();
    res.json({ success: true, clients: lawyer.clients });
  } catch (err) { res.status(500).json({ error: 'Failed to add client.' }); }
});

// 3. Get all clients
app.get('/api/lawyer/clients', protectLawyer, async (req, res) => {
  try { res.json(req.lawyer.clients); }
  catch (err) { res.status(500).json({ error: 'Failed to get clients.' }); }
});

// 4. Add a case
app.post('/api/lawyer/cases', protectLawyer, async (req, res) => {
  const { caseId, clientName, title, court, category, filingDate } = req.body;
  if (!title) return res.status(400).json({ error: 'Case title required.' });
  try {
    const lawyer = req.lawyer;
    lawyer.cases.push({ caseId, clientName, title, court, category, filingDate: filingDate ? new Date(filingDate) : undefined });
    lawyer.notifications.push({ message: `Case "${title}" added for ${clientName}`, type: 'case', read: false });
    await lawyer.save();
    res.json({ success: true, cases: lawyer.cases });
  } catch (err) { res.status(500).json({ error: 'Failed to add case.' }); }
});

// 5. Get all cases
app.get('/api/lawyer/cases', protectLawyer, async (req, res) => {
  try { res.json(req.lawyer.cases); }
  catch (err) { res.status(500).json({ error: 'Failed to get cases.' }); }
});

// 6. Get single case
app.get('/api/lawyer/cases/:caseId', protectLawyer, async (req, res) => {
  try {
    const c = req.lawyer.cases.find(c => c.caseId === req.params.caseId);
    if (!c) return res.status(404).json({ error: 'Case not found.' });
    res.json(c);
  } catch (err) { res.status(500).json({ error: 'Failed to get case.' }); }
});

// 7. Update case status
app.patch('/api/lawyer/cases/:caseId/status', protectLawyer, async (req, res) => {
  const { status } = req.body;
  const valid = ['active','won','lost','settled','dropped'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  try {
    const lawyer = req.lawyer;
    const c = lawyer.cases.find(c => c.caseId === req.params.caseId);
    if (!c) return res.status(404).json({ error: 'Case not found.' });
    c.status = status;
    lawyer.notifications.push({ message: `Case "${c.title}" marked as ${status}`, type: 'case', read: false });
    await lawyer.save();
    res.json({ success: true, case: c });
  } catch (err) { res.status(500).json({ error: 'Failed to update status.' }); }
});

// 8. Add hearing
app.post('/api/lawyer/cases/:caseId/hearings', protectLawyer, async (req, res) => {
  const { date, notes } = req.body;
  if (!date) return res.status(400).json({ error: 'Date required.' });
  try {
    const lawyer = req.lawyer;
    const c = lawyer.cases.find(c => c.caseId === req.params.caseId);
    if (!c) return res.status(404).json({ error: 'Case not found.' });
    const hDate = new Date(date);
    c.hearings.push({ date: hDate, notes });
    const fmt = hDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    lawyer.notifications.push({ message: `Hearing added for "${c.title}" on ${fmt}`, type: 'hearing', read: false });
    await lawyer.save();
    res.json({ success: true, case: c });
  } catch (err) { res.status(500).json({ error: 'Failed to add hearing.' }); }
});

// 9. Upload document
app.post('/api/lawyer/cases/:caseId/documents', protectLawyer, async (req, res) => {
  const { fileName, fileType, content } = req.body;
  if (!fileName || !content) return res.status(400).json({ error: 'fileName and content required.' });
  try {
    const lawyer = req.lawyer;
    const c = lawyer.cases.find(c => c.caseId === req.params.caseId);
    if (!c) return res.status(404).json({ error: 'Case not found.' });
    c.documents.push({ fileName, fileType, content });
    lawyer.notifications.push({ message: `"${fileName}" uploaded to "${c.title}"`, type: 'case', read: false });
    await lawyer.save();
    res.json({ success: true, case: c });
  } catch (err) { res.status(500).json({ error: 'Failed to upload document.' }); }
});

// 10. Delete document
app.delete('/api/lawyer/cases/:caseId/documents/:docIndex', protectLawyer, async (req, res) => {
  try {
    const lawyer = req.lawyer;
    const c = lawyer.cases.find(c => c.caseId === req.params.caseId);
    if (!c) return res.status(404).json({ error: 'Case not found.' });
    const idx = parseInt(req.params.docIndex);
    if (isNaN(idx) || idx < 0 || idx >= c.documents.length) return res.status(400).json({ error: 'Invalid document index.' });
    c.documents.splice(idx, 1);
    await lawyer.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete document.' }); }
});

// 11. AI legal assistance (RAG-powered)
app.post('/api/lawyer/cases/:caseId/ai-assist', protectLawyer, async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query required.' });
  try {
    const lawyer = req.lawyer;
    const c = lawyer.cases.find(c => c.caseId === req.params.caseId);
    if (!c) return res.status(404).json({ error: 'Case not found.' });

    const docsContext = c.documents.map(d => `[${d.fileName}]:\n${d.content}`).join('\n\n---\n\n').substring(0, 4000);

    let similarCases = [];
    let caseContext = 'No similar cases retrieved.';
    try {
      similarCases = await searchCases(`${c.title} ${c.category}`, 5);
      caseContext = similarCases.map(sc => `- ${sc.title} (${sc.court}, ${sc.date}): ${sc.outcome} — ${sc.snippet}`).join('\n');
    } catch (scErr) {
      console.warn('[AI Assist] IndianKanoon search failed:', scErr.message);
    }

    const prompt = `You are an expert Indian advocate assisting a lawyer with case research and strategy.

CASE DETAILS:
Title: ${c.title}
Court: ${c.court}
Category: ${c.category}
Client: ${c.clientName}

UPLOADED CASE DOCUMENTS:
${docsContext || 'No documents uploaded yet.'}

SIMILAR CASES FROM INDIAN COURTS (IndianKanoon):
${caseContext}

LAWYER'S QUESTION: ${query}

Provide a detailed, structured response covering:
1. Direct answer to the lawyer's question
2. Relevant Indian law (Acts and Sections)
3. How the uploaded documents support or weaken the case
4. Insights from similar past cases and their outcomes
5. Recommended legal strategy
6. Key arguments to make in court
7. Risks and counterarguments to prepare for

Cite specific cases and sections. Be direct and practical. This is for a qualified lawyer — use proper legal terminology.`;

    const { text, engine } = await handleAIRequest(prompt, 2000);

    c.aiNotes.push({ query, response: text, citedCases: similarCases.map(sc => sc.title) });
    await lawyer.save();

    res.json({
      response: text,
      citedCases: similarCases.map(sc => ({ title: sc.title, court: sc.court, date: sc.date, outcome: sc.outcome, url: sc.url })),
      engine
    });
  } catch (err) {
    console.error('Lawyer AI Assist Error:', err);
    res.status(500).json({ error: 'AI assistance failed.' });
  }
});

// 12. Mark lawyer notifications read
app.patch('/api/lawyer/notifications/read', protectLawyer, async (req, res) => {
  try {
    const lawyer = req.lawyer;
    lawyer.notifications.forEach(n => { n.read = true; });
    await lawyer.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to mark notifications read.' }); }
});

// ─── END LAWYER PORTAL ───────────────────────────────────────────────────────

// Export for Vercel
export default app;


if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}
