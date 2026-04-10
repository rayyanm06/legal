import { API_ENDPOINTS } from '../../../api/config';

const BACKEND_AI_URL = API_ENDPOINTS.AI_ASK;

/**
 * Send a prompt to the backend AI proxy and return the text response.
 * @param {string} prompt - The user/system prompt to send
 * @param {number} maxTokens - Max tokens for the response (default 1000)
 * @returns {Promise<string>} The AI-generated text
 */
export async function askClaude(prompt, maxTokens = 1000) {
  const response = await fetch(BACKEND_AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      maxTokens,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errBody.error || `API error ${response.status}`);
  }

  const data = await response.json();
  // The backend returns { content: [...] } mirroring Anthropic's structure
  return data.content[0].text;
}

/**
 * Parse a JSON response from Claude, handling markdown code fences.
 */
export function parseJSONResponse(raw) {
  if (typeof raw !== 'string') return raw;

  // 1. Try pure parse (strip out any hallucinated markdown asterisks outside of quotes)
  const sanitize = (text) => text.replace(/\*\*\s*"/g, '"').replace(/"\s*\*\*/g, '"');
  
  try {
    return JSON.parse(sanitize(raw.trim()));
  } catch (e) {}

  // 2. Try Markdown block extraction (Best for Claude/GPT)
  const mdMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (mdMatch) {
    try {
      return JSON.parse(sanitize(mdMatch[1].trim()));
    } catch (e) {}
  }

  // 3. Fallback extraction (Brackets)
  let firstObj = raw.indexOf('{');
  let lastObj = raw.lastIndexOf('}');
  let firstArr = raw.indexOf('[');
  let lastArr = raw.lastIndexOf(']');

  let candidates = [];
  
  if (firstObj !== -1 && lastObj > firstObj) {
      candidates.push(raw.substring(firstObj, lastObj + 1));
  }
  if (firstArr !== -1 && lastArr > firstArr) {
      candidates.push(raw.substring(firstArr, lastArr + 1));
  }
  
  // Sort by length to prefer the largest encompassing JSON structure
  candidates.sort((a, b) => b.length - a.length);

  for (let cand of candidates) {
      try {
          return JSON.parse(sanitize(cand));
      } catch (e) {
          // If the longest bracket match has a syntax error, we just keep trying
      }
  }

  console.error("Critical Parsing Failure on AI AI Payload:", raw);
  throw new Error("AI returned malformed data structure.");
}
