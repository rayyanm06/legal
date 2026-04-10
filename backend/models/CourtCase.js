/**
 * CourtCase Mongoose Model
 * Persists scraped Indian court cases to MongoDB so the vector store
 * survives across Vercel serverless cold starts.
 */

import mongoose from 'mongoose';

const CourtCaseSchema = new mongoose.Schema({
  // Unique identifier (docId from IndianKanoon or URL hash)
  caseId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: { type: String, default: 'Unknown' },
  court: { type: String, default: 'Unknown' },
  date: { type: String, default: 'Unknown' },
  outcome: { type: String, default: 'unknown' },
  url: { type: String, default: '' },
  snippet: { type: String, default: '' },
  domain: { type: String, default: 'general' },
  // Hashed TF-IDF vector stored as array of numbers (512 dims)
  embedding: {
    type: [Number],
    default: [],
  },
}, {
  timestamps: true,
});

// TTL index: auto-expire cases older than 30 days to keep the collection fresh
CourtCaseSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export default mongoose.model('CourtCase', CourtCaseSchema);
