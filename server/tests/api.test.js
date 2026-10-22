import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from '../src/server.js';
import { storage } from '../src/config/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = 5099;
let serverInstance;

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting URL Shortener Test Suite ---');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  // Start test server
  await new Promise((resolve) => {
    serverInstance = app.listen(TEST_PORT, () => {
      console.log(`Test server running on port ${TEST_PORT}`);
      resolve();
    });
  });

  try {
    // 1. Health check
    const healthRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/health',
      method: 'GET'
    });
    assert(healthRes.status === 200 && healthRes.json?.status === 'ok', 'GET /api/health returns 200 OK');

    // 2. Reject empty URL
    const emptyRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/shorten',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { url: '' });
    assert(emptyRes.status === 400 && !emptyRes.json.success, 'POST /api/shorten rejects empty URL (400)');

    // 3. Reject invalid URL format
    const invalidRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/shorten',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { url: 'not-a-valid-domain' });
    assert(invalidRes.status === 400 && !invalidRes.json.success, 'POST /api/shorten rejects invalid string (400)');

    // 4. Reject non-http/https protocol
    const ftpRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/shorten',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { url: 'ftp://ftp.example.com/file.zip' });
    assert(ftpRes.status === 400, 'POST /api/shorten rejects FTP URL (400)');

    // 5. Shorten a valid URL
    const targetUrl = 'https://developer.mozilla.org/en-US/docs/Web/JavaScript';
    const shortenRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/shorten',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { url: targetUrl });
    
    assert(shortenRes.status === 201 || shortenRes.status === 200, 'POST /api/shorten succeeds for valid URL');
    assert(shortenRes.json?.data?.originalUrl === targetUrl, 'Returned originalUrl matches');
    assert(typeof shortenRes.json?.data?.urlCode === 'string' && shortenRes.json.data.urlCode.length >= 6, 'Generated valid urlCode');
    const createdCode = shortenRes.json?.data?.urlCode;

    // 6. Test duplicate submission returns existing code
    const dupRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/shorten',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { url: targetUrl });
    assert(dupRes.status === 200 && dupRes.json?.isExisting === true, 'Duplicate URL returns existing entry');
    assert(dupRes.json?.data?.urlCode === createdCode, 'Duplicate URL preserves same code');

    // 7. Verify persistent storage in urls.json
    const storageFile = path.resolve(storage.filePath);
    const fileExists = fs.existsSync(storageFile);
    assert(fileExists, 'Persistent storage file urls.json exists on disk');
    const content = JSON.parse(fs.readFileSync(storageFile, 'utf-8'));
    const entryInFile = content.find(i => i.urlCode === createdCode);
    assert(Boolean(entryInFile), 'New shortened link is saved persistently in urls.json');

    // 8. Test redirect to original URL
    const redirectRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/${createdCode}`,
      method: 'GET'
    });
    assert(redirectRes.status === 302, 'GET /:code responds with 302 Redirect');
    assert(redirectRes.headers.location === targetUrl, 'Location header points to original URL');

    // 9. Test nonexistent code returns 404
    const notFoundRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/nonexistentxyz123',
      method: 'GET'
    });
    assert(notFoundRes.status === 404, 'GET /unknown responds with 404 Not Found');

    console.log(`\nResults: ${passed}/${total} tests passed.`);

    if (passed === total) {
      console.log('✅ ALL TESTS PASSED SUCCESSFULLY!\n');
      process.exit(0);
    } else {
      console.error(`❌ SOME TESTS FAILED (${total - passed} failures)\n`);
      process.exit(1);
    }
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  if (serverInstance) serverInstance.close();
  process.exit(1);
});
