const { URL } = require('url');

/**
 * Validates a target URL to guard against SSRF (Server-Side Request Forgery).
 * Rejects non-HTTP/HTTPS protocols, private IP ranges, loopbacks, and link-local addresses.
 * 
 * @param {string} urlString - The URL string to validate.
 * @param {object} options - Options object.
 * @param {boolean} [options.allowLocalhost=false] - Whether to allow localhost/loopback (useful for CLI/testing).
 * @returns {{ valid: boolean, url?: URL, reason?: string }}
 */
function validateUrl(urlString, options = {}) {
  const { allowLocalhost = false } = options;

  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, reason: 'URL must be a non-empty string.' };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
  } catch (err) {
    return { valid: false, reason: `Invalid URL format: ${err.message}` };
  }

  // Only allow HTTP and HTTPS protocols
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { valid: false, reason: `Unsupported protocol: ${parsedUrl.protocol}` };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // If localhost is allowed (e.g. CLI batch evaluate on local server)
  if (allowLocalhost && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1')) {
    return { valid: true, url: parsedUrl };
  }

  // Reject explicit loopback/localhost hostnames
  if (hostname === 'localhost' || hostname === '::1' || hostname === '0.0.0.0') {
    return { valid: false, reason: 'Loopback and localhost addresses are prohibited.' };
  }

  // Check IPv4 private and link-local ranges
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);
  if (match) {
    const octets = match.slice(1, 5).map(Number);

    // 127.0.0.0/8 (Loopback)
    if (octets[0] === 127) {
      return { valid: false, reason: 'Loopback IP addresses are prohibited.' };
    }
    // 10.0.0.0/8 (Private)
    if (octets[0] === 10) {
      return { valid: false, reason: 'Private IP space (10.0.0.0/8) is prohibited.' };
    }
    // 172.16.0.0/12 (Private)
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
      return { valid: false, reason: 'Private IP space (172.16.0.0/12) is prohibited.' };
    }
    // 192.168.0.0/16 (Private)
    if (octets[0] === 192 && octets[1] === 168) {
      return { valid: false, reason: 'Private IP space (192.168.0.0/16) is prohibited.' };
    }
    // 169.254.0.0/16 (Link-local / AWS metadata endpoint)
    if (octets[0] === 169 && octets[1] === 254) {
      return { valid: false, reason: 'Link-local IP space (169.254.0.0/16) is prohibited.' };
    }
    // 0.0.0.0
    if (octets.every((o) => o === 0)) {
      return { valid: false, reason: 'Invalid IP address.' };
    }
  }

  return { valid: true, url: parsedUrl };
}

module.exports = {
  validateUrl,
};
