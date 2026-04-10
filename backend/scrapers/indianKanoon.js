/**
 * Indian Kanoon Scraper
 * Searches IndianKanoon for matching court cases via API or web scraping fallback.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const IK_API_BASE = 'https://api.indiankanoon.org';
const IK_WEB_BASE = 'https://indiankanoon.org';

/**
 * Detect outcome keyword from a snippet or title
 */
function detectOutcome(text = '') {
  const lower = text.toLowerCase();
  if (lower.includes('allowed') && !lower.includes('partly allowed')) return 'allowed';
  if (lower.includes('partly allowed') || lower.includes('partially allowed')) return 'partly allowed';
  if (lower.includes('dismissed') || lower.includes('quashed')) return 'dismissed';
  if (lower.includes('acquitted')) return 'acquitted';
  if (lower.includes('convicted') || lower.includes('guilty')) return 'convicted';
  if (lower.includes('settled') || lower.includes('disposed')) return 'settled';
  return 'unknown';
}

/**
 * Determine court level string from court name
 */
function normalizeCourt(courtStr = '') {
  const lower = courtStr.toLowerCase();
  if (lower.includes('supreme')) return 'Supreme Court';
  if (lower.includes('high court') || lower.includes('high ct')) return 'High Court';
  if (lower.includes('district') || lower.includes('sessions')) return 'District Court';
  if (lower.includes('consumer') || lower.includes('ncdrc') || lower.includes('ncdra')) return 'Consumer Forum';
  if (lower.includes('tribunal')) return 'Tribunal';
  return courtStr || 'Unknown Court';
}

/**
 * Search via IndianKanoon official API
 */
async function searchViaAPI(query, maxResults) {
  const apiKey = process.env.INDIANKANOON_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') throw new Error('No IK API key');

  const url = `${IK_API_BASE}/search/?formInput=${encodeURIComponent(query)}&pagenum=0`;
  const response = await axios.get(url, {
    headers: { Authorization: `Token ${apiKey}` },
    timeout: 8000,
  });

  const docs = response.data?.docs || [];
  return docs.slice(0, maxResults).map(doc => ({
    title: doc.title || doc.headline || 'Untitled',
    court: normalizeCourt(doc.docsource || ''),
    date: doc.publishdate || doc.judgement_date || 'Unknown',
    docId: doc.tid || doc.docid || '',
    snippet: doc.headline || doc.snippet || '',
    outcome: detectOutcome((doc.headline || '') + ' ' + (doc.snippet || '')),
    url: `${IK_WEB_BASE}/doc/${doc.tid || doc.docid || ''}/`,
  }));
}

/**
 * Fallback: scrape the IndianKanoon search results page
 */
async function searchViaScraping(query, maxResults) {
  const url = `${IK_WEB_BASE}/search/?formInput=${encodeURIComponent(query)}&type=0`;
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; nyAI-legal-bot/1.0)',
      'Accept': 'text/html',
    },
  });

  const $ = cheerio.load(response.data);
  const results = [];

  $('.result').each((i, el) => {
    if (results.length >= maxResults) return;

    const titleEl = $(el).find('.result_title a');
    const title = titleEl.text().trim() || 'Untitled';
    const href = titleEl.attr('href') || '';
    const docIdMatch = href.match(/\/doc\/(\d+)\//);
    const docId = docIdMatch ? docIdMatch[1] : '';

    const snippet = $(el).find('.snippet').text().trim() || '';
    const courtInfo = $(el).find('.docsource_main, .docsource').first().text().trim() || '';
    const dateInfo = $(el).find('.date').text().trim() || '';

    results.push({
      title,
      court: normalizeCourt(courtInfo),
      date: dateInfo || 'Unknown',
      docId,
      snippet,
      outcome: detectOutcome(title + ' ' + snippet),
      url: docId ? `${IK_WEB_BASE}/doc/${docId}/` : `${IK_WEB_BASE}${href}`,
    });
  });

  return results;
}

/**
 * Main exported function: search IndianKanoon for relevant cases.
 * @param {string} query - The search query (case description or domain)
 * @param {number} maxResults - Max number of cases to return
 * @returns {Promise<Array>} - Array of case objects
 */
export async function searchCases(query, maxResults = 10) {
  // Try official API first
  try {
    const results = await searchViaAPI(query, maxResults);
    if (results.length > 0) {
      console.log(`[IK API] Found ${results.length} cases for: "${query}"`);
      return results;
    }
  } catch (apiErr) {
    console.warn(`[IK API] Falling back to scraping: ${apiErr.message}`);
  }

  // Fallback to web scraping
  try {
    const results = await searchViaScraping(query, maxResults);
    console.log(`[IK Scrape] Found ${results.length} cases for: "${query}"`);
    return results;
  } catch (scrapeErr) {
    console.error(`[IK Scrape] Failed: ${scrapeErr.message}`);
    return [];
  }
}
