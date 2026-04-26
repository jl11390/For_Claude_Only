'use strict';
const http = require('http');
const path = require('path');
const fs   = require('fs');

// Load .env if present
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const m = line.trim().match(/^([A-Z_]+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}

const { scrapePosts } = require('./linkedin');
const PORT = process.env.SCRAPER_PORT || 3001;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

let scraping = false;

const server = http.createServer(async (req, res) => {
  const url    = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const method = req.method.toUpperCase();

  if (method === 'OPTIONS') {
    res.writeHead(204, CORS); res.end(); return;
  }

  const send = (status, body) => {
    res.writeHead(status, { ...CORS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  if (url.pathname === '/api/status' && method === 'GET') {
    send(200, { ok: true, scraping });
    return;
  }

  if (url.pathname === '/api/scrape' && method === 'GET') {
    if (scraping) {
      send(429, { ok: false, error: 'A scrape is already running. Please wait.' });
      return;
    }
    scraping = true;
    try {
      console.log('[server] /api/scrape — starting');
      const posts = await scrapePosts();
      send(200, { ok: true, posts });
    } catch (err) {
      console.error('[server] scrape error:', err.message);
      send(500, { ok: false, error: err.message });
    } finally {
      scraping = false;
    }
    return;
  }

  send(404, { ok: false, error: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[scraper-server] Ready at http://127.0.0.1:${PORT}`);
  console.log('[scraper-server] GET /api/scrape  — run LinkedIn scrape');
  console.log('[scraper-server] GET /api/status  — health check');
  console.log('[scraper-server] Credentials: set LINKEDIN_EMAIL / LINKEDIN_PASSWORD in scraper/.env');
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[scraper-server] Port ${PORT} already in use. Kill the existing process or set SCRAPER_PORT.`);
  } else {
    console.error('[scraper-server] Fatal error:', err.message);
  }
  process.exit(1);
});
