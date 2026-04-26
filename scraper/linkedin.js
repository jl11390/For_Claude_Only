'use strict';
const path = require('path');
const fs   = require('fs');

const ACTIVITY_URL  = 'https://www.linkedin.com/in/lijunze/recent-activity/all/';
const SESSION_FILE  = path.join(__dirname, '.session.json');
const CACHE_FILE    = path.join(__dirname, 'linkedin-posts.json');

// Optional credentials — set in scraper/.env or environment
const EMAIL    = process.env.LINKEDIN_EMAIL    || '';
const PASSWORD = process.env.LINKEDIN_PASSWORD || '';

// Set LINKEDIN_MOCK=1 to use sample data without a live network request
const isMock = () => process.env.LINKEDIN_MOCK === '1';

// ── Helpers ─────────────────────────────────────────────────────────
function formatDate(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  if (!isNaN(d)) {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  // Relative dates like "2w", "3d"
  const m = String(raw).match(/^(\d+)([smhdw])/);
  if (m) {
    const n = +m[1], unit = m[2];
    const ms = { s: 1e3, m: 6e4, h: 36e5, d: 864e5, w: 6048e5 }[unit] || 864e5;
    return new Date(Date.now() - n * ms).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  return raw;
}

function firstLine(text, maxLen) {
  const line = (text.split(/\n/)[0] || '').replace(/\s+/g, ' ').trim();
  return line.length > maxLen ? line.slice(0, maxLen - 1) + '…' : line;
}

function makeExcerpt(text, maxLen) {
  const clean = text.replace(/\n{3,}/g, '\n\n').replace(/\s+/g, ' ').trim();
  return clean.length > maxLen ? clean.slice(0, maxLen - 1) + '…' : clean;
}

// ── Mock posts (used when LINKEDIN_MOCK=1 or network is unavailable) ─
function mockPosts() {
  const now = Date.now();
  const daysAgo = n => new Date(now - n * 864e5).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  return [
    {
      id: 'li-mock-1',
      date: daysAgo(3),
      tag: 'LinkedIn',
      title: 'Thrilled to share that I\'ve joined a new chapter in my career!',
      excerpt: 'Thrilled to share that I\'ve joined a new chapter in my career! Excited to bring my experience in product and engineering to drive meaningful impact. The journey continues — stay tuned for more updates.',
      url: ACTIVITY_URL,
    },
    {
      id: 'li-mock-2',
      date: daysAgo(10),
      tag: 'LinkedIn',
      title: 'Lessons from building 0→1 products: what I wish I knew earlier',
      excerpt: 'Lessons from building 0→1 products: what I wish I knew earlier. The hardest part isn\'t the technology — it\'s figuring out what to build in the first place. Three things I keep coming back to: talk to users obsessively, ship small and learn fast, and never confuse motion for progress.',
      url: ACTIVITY_URL,
    },
    {
      id: 'li-mock-3',
      date: daysAgo(18),
      tag: 'LinkedIn',
      title: 'AI is reshaping every product team I know — here\'s what\'s actually changing',
      excerpt: 'AI is reshaping every product team I know — here\'s what\'s actually changing. It\'s not that engineers are being replaced. It\'s that the feedback loop from idea to working prototype has collapsed from weeks to hours. The teams winning aren\'t the ones with the most engineers — they\'re the ones who can learn the fastest.',
      url: ACTIVITY_URL,
    },
    {
      id: 'li-mock-4',
      date: daysAgo(27),
      tag: 'LinkedIn',
      title: 'Attended an incredible summit on product leadership last week',
      excerpt: 'Attended an incredible summit on product leadership last week. The single idea that stuck with me: the best product managers aren\'t advocates for users OR the business — they hold both in tension at once. Easy to say. Surprisingly hard to practice under pressure.',
      url: ACTIVITY_URL,
    },
    {
      id: 'li-mock-5',
      date: daysAgo(35),
      tag: 'LinkedIn',
      title: 'On the topic of career growth: the most underrated skill is taste',
      excerpt: 'On the topic of career growth: the most underrated skill is taste. Technical skills get you in the room. Communication gets you a seat at the table. But taste — the ability to recognize what\'s excellent before anyone else does — is what separates good from great in any craft.',
      url: ACTIVITY_URL,
    },
  ];
}

// ── DOM extraction (runs inside the Playwright browser page) ────────
function extractPostsFromPage() {
  const CARD_SELECTORS = [
    '.feed-shared-update-v2',
    '[data-urn*="urn:li:activity"]',
    '.occludable-update',
  ];
  const TEXT_SELECTORS = [
    '.feed-shared-text .break-words',
    '.update-components-text .break-words',
    '.feed-shared-text',
    '.update-components-text',
    '.break-words',
  ];
  const TIME_SELECTORS = [
    'time[datetime]',
    '.update-components-actor__sub-description time',
    '.feed-shared-actor__sub-description time',
    '.update-components-actor__sub-description span',
    '.feed-shared-actor__sub-description span',
  ];
  const LINK_SELECTORS = [
    'a[href*="/feed/update/"]',
    'a.app-aware-link[href*="activity"]',
    'a[href*="linkedin.com/feed/update"]',
  ];

  function first(el, sels) {
    for (const s of sels) { const f = el.querySelector(s); if (f) return f; }
    return null;
  }

  let cards = [];
  for (const sel of CARD_SELECTORS) {
    cards = [...document.querySelectorAll(sel)];
    if (cards.length >= 2) break;
  }

  return cards.slice(0, 10).map((card) => {
    const textEl  = first(card, TEXT_SELECTORS);
    const rawText = textEl ? textEl.innerText.trim() : '';
    const timeEl  = first(card, TIME_SELECTORS);
    const rawDate = timeEl?.getAttribute('datetime') || timeEl?.innerText?.trim() || '';
    const linkEl  = first(card, LINK_SELECTORS);
    const postUrl = linkEl?.href || '';
    return { rawText, rawDate, postUrl };
  }).filter(p => p.rawText.length > 10);
}

// ── Live Playwright scrape ───────────────────────────────────────────
async function liveScrape() {
  const { chromium } = require('playwright');

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ||
                    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', '--ignore-certificate-errors',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const ctxOpts = {
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
               '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  };

  let context;
  if (fs.existsSync(SESSION_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
      context = await browser.newContext({ storageState: saved, ...ctxOpts });
      console.log('[linkedin] Restored saved session');
    } catch (_) {
      context = await browser.newContext(ctxOpts);
    }
  } else {
    context = await browser.newContext(ctxOpts);
  }

  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    console.log('[linkedin] Navigating to activity page...');
    await page.goto(ACTIVITY_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes('/login') || url.includes('/checkpoint') || url.includes('/authwall')) {
      if (!EMAIL || !PASSWORD) {
        throw new Error(
          'LinkedIn requires login. Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD in scraper/.env'
        );
      }
      console.log('[linkedin] Logging in...');
      await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await page.fill('#username', EMAIL);
      await page.fill('#password', PASSWORD);
      await page.click('[type="submit"]', { delay: 50 });
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);

      if (page.url().includes('/checkpoint') || page.url().includes('/challenge')) {
        throw new Error('LinkedIn security challenge. Log in manually, export cookies to scraper/.session.json, then retry.');
      }
      const state = await context.storageState();
      fs.writeFileSync(SESSION_FILE, JSON.stringify(state));
      console.log('[linkedin] Session saved');

      await page.goto(ACTIVITY_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
    }

    // Check for proxy / network block
    const bodySnippet = await page.evaluate(() => document.body?.innerText?.slice(0, 200) || '');
    if (bodySnippet.includes('not in allowlist') || bodySnippet.includes('blocked')) {
      throw new Error('Network proxy is blocking LinkedIn. Cannot scrape in this environment.');
    }

    try {
      await page.waitForSelector(
        '.feed-shared-update-v2, [data-urn*="activity"], .occludable-update',
        { timeout: 10000 }
      );
    } catch (_) {
      console.warn('[linkedin] Feed selector timed out — extracting whatever is on page');
    }

    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
      await page.waitForTimeout(1200);
    }

    console.log('[linkedin] Extracting posts...');
    const raw = await page.evaluate(extractPostsFromPage);

    if (!raw.length) {
      throw new Error('No posts found. LinkedIn may have changed its layout or blocked headless access.');
    }

    return raw.map((p, i) => ({
      id:      'li-' + Date.now() + '-' + i,
      date:    formatDate(p.rawDate),
      tag:     'LinkedIn',
      title:   firstLine(p.rawText, 100),
      excerpt: makeExcerpt(p.rawText, 300),
      url:     p.postUrl || ACTIVITY_URL,
    }));

  } finally {
    await browser.close();
  }
}

// ── Main export ──────────────────────────────────────────────────────
async function scrapePosts() {
  if (isMock()) {
    console.log('[linkedin] Mock mode — returning sample posts');
    return mockPosts();
  }

  try {
    const posts = await liveScrape();
    // Cache successful results
    fs.writeFileSync(CACHE_FILE, JSON.stringify(posts, null, 2));
    console.log(`[linkedin] Cached ${posts.length} posts to linkedin-posts.json`);
    return posts;
  } catch (err) {
    // Fall back to cached data if network scrape fails
    if (fs.existsSync(CACHE_FILE)) {
      console.warn('[linkedin] Live scrape failed, serving cached data:', err.message);
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
    throw err;
  }
}

module.exports = { scrapePosts };

// Standalone: node linkedin.js [--mock]
if (require.main === module) {
  if (process.argv.includes('--mock')) process.env.LINKEDIN_MOCK = '1';  // must come before scrapePosts()
  scrapePosts()
    .then(posts => {
      const json = JSON.stringify(posts, null, 2);
      fs.writeFileSync(CACHE_FILE, json);
      console.log(json);
      console.log(`\nWrote ${posts.length} posts to scraper/linkedin-posts.json`);
      process.exit(0);
    })
    .catch(err => { console.error('Error:', err.message); process.exit(1); });
}
