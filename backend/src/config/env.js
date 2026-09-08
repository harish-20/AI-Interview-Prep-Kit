const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  PORT: process.env.PORT || 8080,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-interview-prep-kit',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret_dev_only',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'gemini',
  LLM_API_KEY: process.env.LLM_API_KEY || process.env.GROQ_API_KEY || '',
};

module.exports = env;
