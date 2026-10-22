import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import urlRoutes from './routes/urlRoutes.js';
import { storage } from './config/storage.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', urlRoutes);

// Redirect handler for shortened links: GET /:code
app.get('/:code', (req, res, next) => {
  const { code } = req.params;

  // Ignore system requests
  if (code === 'favicon.ico' || code === 'robots.txt' || code === 'api') {
    return next();
  }

  const entry = storage.getByCode(code);

  if (entry && entry.originalUrl) {
    // 302 Found redirect to original URL
    return res.redirect(302, entry.originalUrl);
  }

  // Not found page
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>URL Not Found - URL Shortener</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #f8fafc;
          color: #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 1rem;
          box-sizing: border-box;
        }
        .container {
          background-color: #ffffff;
          padding: 2.5rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          max-width: 440px;
          width: 100%;
          text-align: center;
        }
        h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 0.75rem 0;
        }
        p {
          font-size: 0.95rem;
          color: #64748b;
          line-height: 1.5;
          margin: 0 0 1.5rem 0;
        }
        .code-pill {
          display: inline-block;
          background-color: #f1f5f9;
          color: #475569;
          font-family: monospace;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        a {
          display: inline-block;
          background-color: #2563eb;
          color: #ffffff;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          padding: 0.6rem 1.25rem;
          border-radius: 6px;
        }
        a:hover {
          background-color: #1d4ed8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Link Not Found</h1>
        <div class="code-pill">Code: ${code.replace(/</g, '&lt;')}</div>
        <p>The shortened link you are trying to visit does not exist or has been removed.</p>
        <a href="http://localhost:5173">Go to URL Shortener</a>
      </div>
    </body>
    </html>
  `);
});

// Start listening
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`URL Shortener backend server running on http://localhost:${PORT}`);
  });
}

export default app;
