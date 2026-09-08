const axios = require('axios');
const env = require('../config/env');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Calls Groq LLM API with JSON response format.
 * Returns parsed JSON object or null if LLM call fails.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<object|null>}
 */
async function callLLMJSON(systemPrompt, userPrompt) {
  const apiKey = env.LLM_API_KEY || env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[LLM Service] No LLM_API_KEY / GROQ_API_KEY configured. Skipping live LLM call.');
    return null;
  }

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content);
  } catch (err) {
    console.error(`[LLM Service Error]: ${err.response?.data?.error?.message || err.message}`);
    return null;
  }
}

module.exports = {
  callLLMJSON,
};
