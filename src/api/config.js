// API Base URL configuration
// In development, we use localhost:5000
// In production (Vercel), we use a relative path if the API is served from the same domain
// or an environment variable VITE_API_URL

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:5000');

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
  },
  CHAT: `${API_BASE_URL}/api/legal-chat`,
  ANALYZE: `${API_BASE_URL}/api/analyze-document`,
  PREDICT: `${API_BASE_URL}/api/predict-case`,
  RESPONSE: `${API_BASE_URL}/api/generate-response`,
  SCENARIOS: `${API_BASE_URL}/api/scenarios`,
  PROGRESS: `${API_BASE_URL}/api/progress`,
  LAWYERS: `${API_BASE_URL}/api/lawyers`,
  SEND_EMAIL: `${API_BASE_URL}/api/send-lawyer-email`,
  GEN_DOC: `${API_BASE_URL}/api/generate-document`,
  DETECT: `${API_BASE_URL}/api/detect-fake-doc`,
  AI_ASK: `${API_BASE_URL}/ai/ask`,
};
