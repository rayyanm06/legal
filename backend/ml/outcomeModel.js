/**
 * Outcome Predictor Model
 * A lightweight, deterministic model that computes a case strength score
 * from an array of semantically similar Indian court cases.
 */

/**
 * Assign a court authority weight based on the court name.
 * Higher = more authoritative / precedent-setting.
 */
function getCourtWeight(courtStr = '') {
  const lower = courtStr.toLowerCase();
  if (lower.includes('supreme')) return 1.0;
  if (lower.includes('high court') || lower.includes('high ct')) return 0.8;
  if (lower.includes('district') || lower.includes('sessions')) return 0.6;
  if (lower.includes('consumer') || lower.includes('ncdrc') || lower.includes('tribunal')) return 0.65;
  return 0.5;
}

/**
 * Normalize outcome string into one of four buckets.
 */
function normalizeOutcome(outcome = '') {
  const lower = outcome.toLowerCase();
  if (['allowed', 'acquitted', 'partly allowed'].includes(lower)) return 'allowed';
  if (['dismissed', 'convicted'].includes(lower)) return 'dismissed';
  if (['partly allowed', 'settled'].includes(lower)) return 'partial';
  return 'unknown';
}

/**
 * Predict case outcome strength from a list of similar cases.
 *
 * @param {Array} similarCases - Cases returned from vectorStore.findSimilarCases()
 * @returns {{strengthScore: number, verdictType: string, dataConfidence: number, outcomeBreakdown: object}}
 */
export function predictOutcome(similarCases = []) {
  // Default: no data
  if (!similarCases || similarCases.length === 0) {
    return {
      strengthScore: 50,
      verdictType: 'Insufficient Data',
      dataConfidence: 0,
      outcomeBreakdown: { allowed: 0, dismissed: 0, partial: 0, unknown: 0 },
    };
  }

  const outcomeBreakdown = { allowed: 0, dismissed: 0, partial: 0, unknown: 0 };
  let courtWeightSum = 0;

  for (const c of similarCases) {
    const outcome = normalizeOutcome(c.outcome || c.metadata?.outcome || '');
    outcomeBreakdown[outcome] = (outcomeBreakdown[outcome] || 0) + 1;
    courtWeightSum += getCourtWeight(c.court || c.metadata?.court || '');
  }

  const total = similarCases.length;

  // Outcome score: positive outcomes (allowed + partial) vs total
  const positiveCount = outcomeBreakdown.allowed + outcomeBreakdown.partial * 0.5;
  const outcomeScore = positiveCount / total; // 0–1

  // Average court authority level
  const avgCourtLevel = courtWeightSum / total; // 0–1

  // Data confidence: scales up with number of cases, max at 5
  const dataConfidence = Math.min(total / 5, 1); // 0–1

  // Composite score (weighted formula)
  const rawStrength = (outcomeScore * 0.6 + avgCourtLevel * 0.4) * dataConfidence * 100;
  const strengthScore = Math.min(Math.max(Math.round(rawStrength), 0), 100);

  // Verdict classification
  let verdictType = 'Weak Claim';
  if (strengthScore > 65) verdictType = 'Strong Claim';
  else if (strengthScore > 40) verdictType = 'Moderate Claim';

  return {
    strengthScore,
    verdictType,
    dataConfidence,
    outcomeBreakdown,
  };
}
