import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const validateInput = (url) => {
    if (!url || !url.trim()) {
      return 'Please enter a URL to shorten';
    }

    const trimmed = url.trim();

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'URL must start with http:// or https://';
      }
      if (!parsed.hostname || !parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
        return 'Please enter a valid domain name (e.g. https://example.com)';
      }
    } catch {
      return 'Please enter a valid URL including http:// or https://';
    }

    return '';
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    setError('');
    setCopied(false);

    const validationError = validateInput(longUrl);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: longUrl.trim() })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      setShortUrl(data.data.shortUrl);
    } catch (err) {
      setError(err.message || 'Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shortUrl) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shortUrl);
      } else {
        // Fallback for older browsers
        const tempInput = document.createElement('input');
        tempInput.value = shortUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  return (
    <div className="app-container">
      <main className="card">
        <header className="card-header">
          <h1 className="title">URL Shortener</h1>
          <p className="subtitle">Enter a long URL to create a simple, compact link</p>
        </header>

        <form onSubmit={handleShorten} className="form" noValidate>
          <div className="input-group">
            <input
              id="url-input"
              type="url"
              className={`url-input ${error ? 'input-error' : ''}`}
              placeholder="https://example.com/very-long-url"
              value={longUrl}
              onChange={(e) => {
                setLongUrl(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Shortening...' : 'Shorten URL'}
            </button>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
        </form>

        {shortUrl && (
          <section className="result-section" aria-label="Shortened URL result">
            <span className="result-label">Shortened URL</span>
            <div className="result-box">
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="short-link"
              >
                {shortUrl}
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className={`copy-btn ${copied ? 'copied' : ''}`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
