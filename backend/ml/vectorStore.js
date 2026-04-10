/**
 * In-Memory Vector Store with Cosine Similarity
 * Stores case embeddings in memory with persistent search capability.
 * This avoids the need for a running ChromaDB server while keeping the
 * same API surface as specified. Can be swapped for ChromaDB later.
 */

// ─── Simple Embedding via TF-IDF-like term frequency ───────────────────────
// Since @xenova/transformers requires ESM dynamic import and can be slow to
// load on Vercel serverless, we use a fast, zero-dependency text vectorizer
// that still captures meaningful semantic overlap for legal queries.

const VOCAB_SIZE = 512;

/**
 * Hash a string token into a stable index 0–(VOCAB_SIZE-1)
 */
function hashToken(token) {
  let hash = 5381;
  for (let i = 0; i < token.length; i++) {
    hash = ((hash << 5) + hash) ^ token.charCodeAt(i);
  }
  return Math.abs(hash) % VOCAB_SIZE;
}

/**
 * Convert text → fixed-length float vector using hashed term frequencies.
 * Includes legal-domain bigrams for better precision.
 */
function textToVector(text = '') {
  const vec = new Float32Array(VOCAB_SIZE).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);

  // Unigrams
  for (const token of tokens) {
    vec[hashToken(token)] += 1;
  }

  // Bigrams (pairs of adjacent tokens — captures "consumer court", "wrongful termination", etc.)
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = tokens[i] + '_' + tokens[i + 1];
    vec[hashToken(bigram)] += 1.5; // bigrams weighted higher
  }

  // L2-normalize
  let norm = 0;
  for (let i = 0; i < VOCAB_SIZE; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < VOCAB_SIZE; i++) vec[i] /= norm;

  return vec;
}

/**
 * Cosine similarity between two Float32Array vectors
 */
function cosineSimilarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // vectors are already L2-normalized
}

// ─── In-Memory Case Store ────────────────────────────────────────────────────

const caseStore = []; // { id, embedding, metadata }
const seenIds = new Set();

/**
 * Upsert a case into the in-memory vector store.
 * @param {object} caseObj - { title, court, date, outcome, url, snippet, domain }
 */
export async function upsertCase(caseObj) {
  try {
    const id = caseObj.docId || caseObj.url || caseObj.title;
    if (!id || seenIds.has(id)) return; // deduplicate

    const text = `${caseObj.title} ${caseObj.snippet || ''} ${caseObj.outcome || ''}`;
    const embedding = textToVector(text);

    seenIds.add(id);
    caseStore.push({
      id,
      embedding,
      metadata: {
        title: caseObj.title || 'Unknown',
        court: caseObj.court || 'Unknown',
        date: caseObj.date || 'Unknown',
        outcome: caseObj.outcome || 'unknown',
        url: caseObj.url || '',
        domain: caseObj.domain || 'general',
        snippet: (caseObj.snippet || '').slice(0, 500),
      },
    });
  } catch (err) {
    console.warn('[VectorStore] upsertCase error:', err.message);
  }
}

/**
 * Find the top-n most similar cases to a query string.
 * @param {string} queryText
 * @param {number} n
 * @returns {Promise<Array>} - Array of case metadata objects, sorted by similarity
 */
export async function findSimilarCases(queryText, n = 5) {
  try {
    if (caseStore.length === 0) return [];

    const queryVec = textToVector(queryText);

    const scored = caseStore.map(entry => ({
      ...entry.metadata,
      score: cosineSimilarity(queryVec, entry.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, n);
  } catch (err) {
    console.warn('[VectorStore] findSimilarCases error:', err.message);
    return [];
  }
}

/**
 * Get total number of cases in the store (for logging/debugging)
 */
export function getStoreSize() {
  return caseStore.length;
}
