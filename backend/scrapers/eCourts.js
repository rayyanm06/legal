/**
 * eCourts.gov.in Scraper
 * Attempts to fetch case status data from eCourts.
 * Note: eCourts is heavily JS-rendered; this module returns empty arrays gracefully if data is unavailable.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const ECOURTS_BASE = 'https://ecourts.gov.in';
const ECOURTS_SERVICES = 'https://services.ecourts.gov.in';

/**
 * Parse case status from HTML content
 */
function parseCaseStatus($, el) {
  const text = $(el).text();
  const lower = text.toLowerCase();
  if (lower.includes('disposed') || lower.includes('decided')) return 'Disposed';
  if (lower.includes('pending')) return 'Pending';
  if (lower.includes('fresh filing')) return 'Fresh Filing';
  return 'Unknown';
}

/**
 * Try scraping case search results from eCourts
 * @param {string} query - Case number or search term
 * @param {string} state - Indian state name (optional)
 * @returns {Promise<Array>}
 */
export async function searchECourts(query, state = '') {
  try {
    // eCourts search URL (public search, no JS required for basic results)
    const searchUrl = `${ECOURTS_SERVICES}/ecourts_home/?p=home/index`;

    const response = await axios.get(searchUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; nyAI-legal-bot/1.0)',
        'Accept': 'text/html',
      },
      params: {
        search_query: query,
        state: state,
      }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // Try to parse table rows from case listings
    $('table tr').each((i, row) => {
      if (i === 0) return; // Skip header row
      const cells = $(row).find('td');
      if (cells.length >= 3) {
        results.push({
          caseNumber: $(cells[0]).text().trim(),
          court: $(cells[1]).text().trim() || 'Unknown Court',
          state: state || 'Not specified',
          status: parseCaseStatus($, cells[2]),
          filingDate: $(cells[3])?.text().trim() || 'Unknown',
          decisionDate: $(cells[4])?.text().trim() || 'Pending',
          acts: $(cells[5])?.text().trim() || 'Unknown',
        });
      }
    });

    if (results.length > 0) {
      console.log(`[eCourts] Found ${results.length} results for: "${query}"`);
    }
    return results;

  } catch (err) {
    // eCourts is JS-heavy - graceful empty return, no crash
    console.warn(`[eCourts] Could not fetch data (likely JS-rendered): ${err.message}`);
    return [];
  }
}
