/**
 * LinkedIn Post Scraper — browser console script
 *
 * HOW TO USE
 * ----------
 * 1. Open Chrome / Edge / Firefox and log in to LinkedIn.
 * 2. Navigate to: https://www.linkedin.com/in/lijunze/recent-activity/all/
 * 3. Scroll down until the posts you want are visible (LinkedIn loads lazily).
 * 4. Open DevTools → Console (F12 / Cmd+Option+J).
 * 5. Paste the entire contents of this file and press Enter.
 * 6. A file named "linkedin-posts.json" will download automatically.
 * 7. In the site's Admin panel → Blog → click "Import from JSON" and select that file.
 *
 * The script scrapes up to 10 visible posts and formats them as CMS blog entries.
 */
(function () {
  'use strict';

  // ── Helpers ─────────────────────────────────────────────────────
  function formatDate(raw) {
    if (!raw) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const d = new Date(raw);
    if (!isNaN(d)) return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return raw;
  }

  function firstLine(text, maxLen) {
    const line = text.split(/\n/)[0].trim();
    return line.length > maxLen ? line.slice(0, maxLen - 1) + '…' : line;
  }

  function excerpt(text, maxLen) {
    const clean = text.replace(/\n{3,}/g, '\n\n').trim();
    return clean.length > maxLen ? clean.slice(0, maxLen - 1) + '…' : clean;
  }

  // ── Selectors (LinkedIn's class names change; try multiple) ─────
  const CARD_SELECTORS = [
    '.feed-shared-update-v2',
    '[data-urn*="activity"]',
    '.occludable-update',
  ];

  const TEXT_SELECTORS = [
    '.feed-shared-text .break-words',
    '.feed-shared-text',
    '.update-components-text',
    '.break-words',
  ];

  const TIME_SELECTORS = [
    'time[datetime]',
    '.feed-shared-actor__sub-description time',
    '.update-components-actor__sub-description time',
    '.feed-shared-actor__sub-description',
  ];

  const LINK_SELECTORS = [
    'a[href*="/feed/update/"]',
    'a[href*="activity"]',
    '.feed-shared-actor__meta > a',
  ];

  function first(el, selectors) {
    for (const s of selectors) {
      const found = el.querySelector(s);
      if (found) return found;
    }
    return null;
  }

  // ── Find post cards ─────────────────────────────────────────────
  let cards = [];
  for (const sel of CARD_SELECTORS) {
    cards = [...document.querySelectorAll(sel)];
    if (cards.length) break;
  }

  if (!cards.length) {
    console.error(
      '[linkedin-scraper] No post cards found.\n' +
      'Make sure you are on: https://www.linkedin.com/in/lijunze/recent-activity/all/\n' +
      'Scroll down to load posts, then re-run this script.'
    );
    return;
  }

  // ── Extract posts ───────────────────────────────────────────────
  const posts = [];

  for (let i = 0; i < Math.min(cards.length, 10); i++) {
    const card = cards[i];

    const textEl = first(card, TEXT_SELECTORS);
    const rawText = textEl ? textEl.innerText.trim() : '';
    if (!rawText) continue;

    const timeEl = first(card, TIME_SELECTORS);
    const rawDate =
      timeEl?.getAttribute('datetime') ||
      timeEl?.innerText?.trim() ||
      '';

    const linkEl = first(card, LINK_SELECTORS);
    const postUrl = linkEl?.href || window.location.href;

    posts.push({
      id:      'li-' + Date.now() + '-' + i,
      date:    formatDate(rawDate),
      tag:     'LinkedIn',
      title:   firstLine(rawText, 100),
      excerpt: excerpt(rawText, 300),
      url:     postUrl,
    });
  }

  if (!posts.length) {
    console.error('[linkedin-scraper] Cards were found but no readable text could be extracted. Try scrolling to fully load the posts.');
    return;
  }

  // ── Output ──────────────────────────────────────────────────────
  const json = JSON.stringify(posts, null, 2);

  console.log('%c[linkedin-scraper] Done!', 'color: #4F46E5; font-weight: bold;');
  console.log(`Extracted ${posts.length} post(s). Downloading linkedin-posts.json…`);
  console.log(json);

  try {
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'linkedin-posts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    console.log('File download started. Import linkedin-posts.json via Admin → Blog → Import from JSON.');
  } catch (e) {
    console.warn('Auto-download failed. Copy the JSON above manually and save it as linkedin-posts.json.');
  }
}());
