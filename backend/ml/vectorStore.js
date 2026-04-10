/**
 * MongoDB-backed Vector Store
 * Persists case embeddings to MongoDB Atlas so data survives Vercel cold starts.
 * Falls back to in-memory cache within the same serverless invocation.
 *
 * Embedding: hashed TF-IDF (512 dims, L2-normalised) — zero external dependencies.
 */

import CourtCase from '../models/CourtCase.js';

// ─── Embedder ─────────────────────────────────────────────────────────────────

const VOCAB_SIZE = 512;

function hashToken(token) {
  let hash = 5381;
  for (let i = 0; i < token.length; i++) {
    hash = ((hash << 5) + hash) ^ token.charCodeAt(i);
  }
  return Math.abs(hash) % VOCAB_SIZE;
}

function textToVector(text = '') {
  const vec = new Float32Array(VOCAB_SIZE).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);

  for (const token of tokens) {
    vec[hashToken(token)] += 1;
  }
  for (let i = 0; i < tokens.length - 1; i++) {
    vec[hashToken(tokens[i] + '_' + tokens[i + 1])] += 1.5;
  }

  // L2 normalise
  let norm = 0;
  for (let i = 0; i < VOCAB_SIZE; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < VOCAB_SIZE; i++) vec[i] /= norm;

  return vec;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return dot;
}

// ─── In-process warm cache (speeds up repeat queries in same invocation) ───────
const warmCache = new Map(); // caseId → document

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Upsert a case into MongoDB (and warm cache).
 */
export async function upsertCase(caseObj) {
  try {
    const caseId = caseObj.docId || caseObj.url || caseObj.title;
    if (!caseId) return;
    if (warmCache.has(caseId)) return; // already cached this invocation

    const text = `${caseObj.title} ${caseObj.snippet || ''} ${caseObj.outcome || ''}`;
    const embeddingFloat = textToVector(text);
    const embedding = Array.from(embeddingFloat); // plain array for MongoDB

    const doc = {
      caseId,
      title: caseObj.title || 'Unknown',
      court: caseObj.court || 'Unknown',
      date: caseObj.date || 'Unknown',
      outcome: caseObj.outcome || 'unknown',
      url: caseObj.url || '',
      snippet: (caseObj.snippet || '').slice(0, 500),
      domain: caseObj.domain || 'general',
      embedding,
    };

    // Upsert into MongoDB
    await CourtCase.findOneAndUpdate(
      { caseId },
      { $set: doc },
      { upsert: true, new: true }
    );

    warmCache.set(caseId, doc);
  } catch (err) {
    // Non-fatal: log but never crash
    console.warn('[VectorStore] upsertCase error:', err.message);
  }
}

/**
 * Find top-n most similar cases to the query using cosine similarity.
 * Loads up to 500 recent cases from MongoDB, ranks by similarity.
 */
export async function findSimilarCases(queryText, n = 5) {
  try {
    const queryVec = textToVector(queryText);

    // Pull recent cases from MongoDB (limit to keep compute bounded)
    const cases = await CourtCase.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    if (cases.length === 0) return [];

    const scored = cases.map(c => ({
      title: c.title,
      court: c.court,
      date: c.date,
      outcome: c.outcome,
      url: c.url,
      domain: c.domain,
      score: c.embedding?.length > 0
        ? cosineSimilarity(queryVec, c.embedding)
        : 0,
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, n);

  } catch (err) {
    console.warn('[VectorStore] findSimilarCases error:', err.message);
    return [];
  }
}

/**
 * Get total count of cases in the store.
 */
export async function getStoreSize() {
  try {
    return await CourtCase.countDocuments();
  } catch {
    return warmCache.size;
  }
}
