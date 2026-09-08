const GENERIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'protonmail.com',
  'aol.com',
  'zoho.com',
  'gmx.com',
  'mail.com',
  'yandex.com',
  'live.com',
  'msn.com',
  'proton.me',
]);

/**
 * Extracts candidate landing page URLs from JD text (links & non-generic email domains).
 * @param {string} text
 * @returns {string[]} Array of candidate URLs
 */
function extractCompanyUrlsFromJd(text) {
  if (!text || typeof text !== 'string') return [];

  const suggestions = [];
  const seenUrls = new Set();

  const addUrl = (url) => {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      const parsed = new URL(cleanUrl);
      const landingPage = `${parsed.protocol}//${parsed.host}`;

      if (!seenUrls.has(landingPage)) {
        seenUrls.add(landingPage);
        suggestions.push(landingPage);
      }

      // Root domain extraction for subdomains
      const parts = parsed.hostname.split('.');
      if (parts.length > 2) {
        const rootDomain = parts.slice(-2).join('.');
        if (!GENERIC_EMAIL_DOMAINS.has(rootDomain)) {
          const rootUrl = `${parsed.protocol}//${rootDomain}`;
          if (!seenUrls.has(rootUrl)) {
            seenUrls.add(rootUrl);
            suggestions.push(rootUrl);
          }
        }
      }
    } catch {
      // ignore invalid URLs
    }
  };

  // 1. Explicit HTTP/HTTPS Links
  const urlRegex = /(https?:\/\/[^\s\)\],<"']+)/gi;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const rawUrl = match[1].replace(/[.,;:!?]+$/, '');
    addUrl(rawUrl);
  }

  // 2. Email Domains
  const emailRegex = /[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  while ((match = emailRegex.exec(text)) !== null) {
    const domain = match[1].toLowerCase();
    if (!GENERIC_EMAIL_DOMAINS.has(domain)) {
      addUrl(`https://${domain}`);
    }
  }

  // 3. Standalone Domains
  const domainRegex = /\b(?:www\.)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi;
  while ((match = domainRegex.exec(text)) !== null) {
    const domain = match[1].toLowerCase();
    if (!GENERIC_EMAIL_DOMAINS.has(domain)) {
      addUrl(`https://${domain}`);
    }
  }

  return suggestions;
}

module.exports = {
  extractCompanyUrlsFromJd,
};
