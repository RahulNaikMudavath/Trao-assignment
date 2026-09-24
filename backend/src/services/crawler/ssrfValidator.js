import { config } from '../../config.js';

const PRIVATE_IP_RANGES = [
  /^127\./, // 127.0.0.0/8 (Loopback)
  /^10\./, // 10.0.0.0/8 (Private)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 (Private)
  /^192\.168\./, // 192.168.0.0/16 (Private)
  /^169\.254\./, // 169.254.0.0/16 (Link Local / Cloud Metadata)
  /^0\./, // 0.0.0.0/8
];

export function validateUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: `Invalid protocol: ${parsed.protocol}. Only HTTP and HTTPS are permitted.` };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check loopback / localhost
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

    if (isLocalhost) {
      if (config.allowLocalUrls) {
        return { valid: true, url: parsed };
      }
      return { valid: false, error: 'Loopback and localhost addresses are forbidden in production.' };
    }

    // Check private IP ranges
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(hostname)) {
        if (config.allowLocalUrls) {
          return { valid: true, url: parsed };
        }
        return { valid: false, error: 'Private IP addresses are forbidden.' };
      }
    }

    return { valid: true, url: parsed };
  } catch (err) {
    return { valid: false, error: `Malformed URL: ${err.message}` };
  }
}
