import { Router } from 'express';
import { storage } from '../config/storage.js';
import { validateUrl } from '../utils/urlValidator.js';
import { generateCode } from '../utils/generateCode.js';

const router = Router();

/**
 * Health check endpoint.
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /api/shorten
 * Body: { url: string }
 * Response: { success: boolean, originalUrl: string, shortUrl: string, urlCode: string, createdAt: string }
 */
router.post('/shorten', (req, res) => {
  try {
    const { url } = req.body || {};

    // Validate URL
    const validation = validateUrl(url);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error || 'Please provide a valid URL'
      });
    }

    const normalizedUrl = validation.normalizedUrl;

    // Check if original URL already shortened
    const existing = storage.getByOriginalUrl(normalizedUrl);
    if (existing) {
      return res.status(200).json({
        success: true,
        data: existing,
        isExisting: true
      });
    }

    // Determine Base URL (prefer environment variable or fallback to request host)
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;

    // Generate unique short code
    let code = generateCode(6);
    let attempts = 0;
    while (storage.hasCode(code) && attempts < 10) {
      code = generateCode(6);
      attempts++;
    }

    if (storage.hasCode(code)) {
      code = generateCode(8); // fallback to longer code if collision
    }

    const shortUrl = `${baseUrl.replace(/\/$/, '')}/${code}`;

    // Save entry to local storage
    const newEntry = storage.save({
      originalUrl: normalizedUrl,
      urlCode: code,
      shortUrl
    });

    return res.status(201).json({
      success: true,
      data: newEntry,
      isExisting: false
    });
  } catch (error) {
    console.error('Error shortening URL:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected server error occurred. Please try again later.'
    });
  }
});

export default router;
