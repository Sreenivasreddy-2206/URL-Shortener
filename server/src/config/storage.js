import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server root is two levels up from src/config
const SERVER_ROOT = path.resolve(__dirname, '../../');

class JsonStorage {
  constructor() {
    const configuredPath = process.env.DATA_PATH || './data/urls.json';
    this.filePath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(SERVER_ROOT, configuredPath);

    this.cache = null;
    this.init();
  }

  /**
   * Initializes data directory and storage file if not present.
   */
  init() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
      this.cache = [];
    } else {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.cache = JSON.parse(raw);
        if (!Array.isArray(this.cache)) {
          this.cache = [];
          this.persist();
        }
      } catch (err) {
        console.error('Error reading storage file, initializing empty array:', err.message);
        this.cache = [];
        this.persist();
      }
    }
  }

  /**
   * Safely writes the current cache to disk atomically.
   */
  persist() {
    const tempPath = `${this.filePath}.tmp.${Date.now()}`;
    const data = JSON.stringify(this.cache, null, 2);
    fs.writeFileSync(tempPath, data, 'utf-8');
    fs.renameSync(tempPath, this.filePath);
  }

  /**
   * Get all stored URLs.
   */
  getAll() {
    return [...this.cache];
  }

  /**
   * Find URL record by short code.
   * @param {string} code 
   */
  getByCode(code) {
    if (!code) return null;
    return this.cache.find(item => item.urlCode.toLowerCase() === code.toLowerCase()) || null;
  }

  /**
   * Find URL record by original URL.
   * @param {string} originalUrl 
   */
  getByOriginalUrl(originalUrl) {
    if (!originalUrl) return null;
    return this.cache.find(item => item.originalUrl === originalUrl) || null;
  }

  /**
   * Saves a new shortened URL entry.
   * @param {{ originalUrl: string, urlCode: string, shortUrl: string }} param0 
   */
  save({ originalUrl, urlCode, shortUrl }) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      urlCode,
      originalUrl,
      shortUrl,
      createdAt: new Date().toISOString()
    };

    this.cache.push(entry);
    this.persist();
    return entry;
  }

  /**
   * Check if a code already exists.
   * @param {string} code 
   */
  hasCode(code) {
    return this.cache.some(item => item.urlCode.toLowerCase() === code.toLowerCase());
  }
}

export const storage = new JsonStorage();
