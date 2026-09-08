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

export interface ExtractedUrlSuggestion {
  url: string;
  sourceType: 'link' | 'email' | 'domain';
  rawMatch: string;
}

export function extractCompanyUrlsFromJd(text: string): ExtractedUrlSuggestion[] {
  if (!text || typeof text !== 'string') return [];

  const suggestions: ExtractedUrlSuggestion[] = [];
  const seenUrls = new Set<string>();

  const addUrl = (url: string, sourceType: 'link' | 'email' | 'domain', rawMatch: string) => {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      const parsed = new URL(cleanUrl);
      const landingPage = `${parsed.protocol}//${parsed.host}`;

      if (!seenUrls.has(landingPage)) {
        seenUrls.add(landingPage);
        suggestions.push({
          url: landingPage,
          sourceType,
          rawMatch,
        });
      }

      // If domain has subdomains (e.g. careers.company.com), extract root landing page (https://company.com)
      const parts = parsed.hostname.split('.');
      if (parts.length > 2) {
        const rootDomain = parts.slice(-2).join('.');
        if (!GENERIC_EMAIL_DOMAINS.has(rootDomain)) {
          const rootUrl = `${parsed.protocol}//${rootDomain}`;
          if (!seenUrls.has(rootUrl)) {
            seenUrls.add(rootUrl);
            suggestions.push({
              url: rootUrl,
              sourceType,
              rawMatch,
            });
          }
        }
      }
    } catch {
      // Invalid URL syntax, ignore
    }
  };

  // 1. Explicit HTTP/HTTPS Links
  const urlRegex = /(https?:\/\/[^\s\)\],<"']+)/gi;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    const rawUrl = match[1].replace(/[.,;:!?]+$/, '');
    addUrl(rawUrl, 'link', rawUrl);
  }

  // 2. Email Addresses (e.g. hr@company.com or careers@tech.co)
  const emailRegex = /[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  while ((match = emailRegex.exec(text)) !== null) {
    const rawEmail = match[0];
    const domain = match[1].toLowerCase();
    if (!GENERIC_EMAIL_DOMAINS.has(domain)) {
      addUrl(`https://${domain}`, 'email', rawEmail);
    }
  }

  // 3. Standalone Website Domains (e.g. www.acme.com or acme.io)
  const domainRegex = /\b(?:www\.)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi;
  while ((match = domainRegex.exec(text)) !== null) {
    const domain = match[1].toLowerCase();
    if (!GENERIC_EMAIL_DOMAINS.has(domain)) {
      addUrl(`https://${domain}`, 'domain', match[0]);
    }
  }

  return suggestions;
}
