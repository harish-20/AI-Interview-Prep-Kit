const axios = require('axios');
const cheerio = require('cheerio');
const { validateUrl } = require('../utils/urlSafety');
const { withRetry } = require('../utils/retry');

const MAX_BYTES = 2 * 1024 * 1024; // 2MB limit

/**
 * Validates and fetches HTML content from a target URL.
 * Enforces SSRF checks, content-type verification, and byte limit bounds.
 *
 * @param {string} targetUrl - URL to fetch.
 * @param {object} [options]
 * @param {boolean} [options.allowLocalhost=false] - Whether to allow localhost URLs (for testing/CLI).
 * @returns {Promise<{ url: string, content: string, status: 'ok' | 'error', error?: string }>}
 */
async function fetchAndClean(targetUrl, options = {}) {
  const urlCheck = validateUrl(targetUrl, options);
  if (!urlCheck.valid) {
    return {
      url: targetUrl,
      content: '',
      status: 'error',
      error: `Blocked by SSRF / URL safety guard: ${urlCheck.reason}`,
    };
  }

  try {
    const result = await withRetry(async () => {
      const response = await axios.get(targetUrl, {
        timeout: 8000,
        maxContentLength: MAX_BYTES,
        headers: {
          'User-Agent': 'AI-Interview-Prep-Bot/1.0 (+https://ai-interview-prep-kit.local)',
          Accept: 'text/html,application/xhtml+xml',
        },
        responseType: 'text',
      });

      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        throw new Error(`Invalid content-type: ${contentType}. Expected text/html.`);
      }

      return response.data;
    });

    const $ = cheerio.load(result);

    // Strip scripts, styles, navs, footers, and non-content tags
    $('script, style, noscript, nav, footer, iframe, svg, header').remove();

    const cleanedText = $('body').text().replace(/\s+/g, ' ').trim();

    return {
      url: targetUrl,
      content: cleanedText.slice(0, 10000), // Cap at 10k chars for LLM safety
      status: 'ok',
    };
  } catch (err) {
    return {
      url: targetUrl,
      content: '',
      status: 'error',
      error: err.message,
    };
  }
}

/**
 * Discovers subpages from a target company homepage URL.
 *
 * @param {string} companyUrl
 * @param {object} [options]
 * @returns {Promise<string[]>}
 */
async function discoverCompanyPages(companyUrl, options = {}) {
  const urlCheck = validateUrl(companyUrl, options);
  if (!urlCheck.valid) {
    return [companyUrl];
  }

  try {
    const pageResult = await fetchAndClean(companyUrl, options);
    if (pageResult.status !== 'ok') {
      return [companyUrl];
    }
    // Return primary page + discovered links (placeholder logic returns primary)
    return [companyUrl];
  } catch {
    return [companyUrl];
  }
}

module.exports = {
  fetchAndClean,
  discoverCompanyPages,
};
