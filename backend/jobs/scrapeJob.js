/**
 * Background Scrape Job
 * Uses node-cron to periodically seed the vector store with Indian court cases
 * across key legal domains. Runs once at startup and then daily at 2am.
 */

import cron from 'node-cron';
import { searchCases } from '../scrapers/indianKanoon.js';
import { upsertCase, getStoreSize } from '../ml/vectorStore.js';

// Domains to seed the vector store with relevant case data
const LEGAL_DOMAINS = [
  { query: 'consumer rights refund deficiency service India', domain: 'consumer' },
  { query: 'tenant eviction landlord deposit India', domain: 'tenant_landlord' },
  { query: 'wrongful termination employment labour India', domain: 'employment' },
  { query: 'property dispute ownership transfer India', domain: 'property' },
  { query: 'criminal IPC FIR bail India', domain: 'criminal' },
  { query: 'RTI information public authority India', domain: 'rti' },
  { query: 'cheque bounce dishonour NI Act India', domain: 'financial' },
  { query: 'divorce maintenance custody family court India', domain: 'family' },
];

/**
 * Run one full scrape cycle across all legal domains
 */
async function runScrapeCycle() {
  console.log(`[ScrapeJob] 🔄 Starting scrape cycle at ${new Date().toISOString()}`);
  let totalStored = 0;

  for (const { query, domain } of LEGAL_DOMAINS) {
    try {
      const cases = await searchCases(query, 20);
      let domainCount = 0;

      for (const c of cases) {
        await upsertCase({ ...c, domain });
        domainCount++;
      }

      totalStored += domainCount;
      console.log(`[ScrapeJob] ✅ ${domain}: stored ${domainCount} cases`);

      // Small delay between domains to be respectful of rate limits
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (err) {
      console.warn(`[ScrapeJob] ⚠️ Failed for domain "${domain}": ${err.message}`);
    }
  }

  console.log(`[ScrapeJob] ✅ Cycle complete. Total stored: ${totalStored} | Store size: ${getStoreSize()}`);
}

// Schedule: run every day at 2:00 AM
const scrapeJob = cron.schedule('0 2 * * *', runScrapeCycle, {
  scheduled: false, // don't auto-start; we control it from server.js
  timezone: 'Asia/Kolkata',
});

// Run once on startup after a short delay (to let the server warm up)
setTimeout(() => {
  runScrapeCycle().catch(err =>
    console.warn('[ScrapeJob] Initial seed failed (non-fatal):', err.message)
  );
}, 5000);

export default scrapeJob;
