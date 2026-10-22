/**
 * Validates whether the given string is a valid web URL (http or https).
 * @param {string} stringUrl 
 * @returns {{ valid: boolean, error?: string, normalizedUrl?: string }}
 */
export function validateUrl(stringUrl) {
  if (!stringUrl || typeof stringUrl !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = stringUrl.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are supported' };
    }

    if (!parsed.hostname || parsed.hostname.length === 0) {
      return { valid: false, error: 'URL must contain a valid domain name' };
    }

    // Reject localhost or loops if undesirable, but for testing http://localhost or standard domains should work.
    // Ensure hostname has at least a dot unless it's localhost
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
      return { valid: false, error: 'URL must contain a valid domain extension (e.g. .com, .org)' };
    }

    return { valid: true, normalizedUrl: parsed.href };
  } catch {
    return { valid: false, error: 'Invalid URL format. Please include http:// or https://' };
  }
}
