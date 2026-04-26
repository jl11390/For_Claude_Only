'use strict';

// ── Storage keys ──────────────────────────────────────────────────
const KEY_CONTENT = 'cms_content';

// ── Default content ───────────────────────────────────────────────
const DEFAULTS = {
  site: {
    title: 'Alex Chen'
  },
  about: {
    name: 'Alex Chen',
    role: 'Software Engineer',
    bio:  'I build products that scale. Currently at <strong>Acme Corp</strong>, previously at Stripe and Airbnb. I write about distributed systems, product thinking, and the intersection of AI and software craft.',
    links: [
      { label: 'GitHub',      url: 'https://github.com' },
      { label: 'LinkedIn',    url: 'https://linkedin.com' },
      { label: 'X / Twitter', url: 'https://twitter.com' }
    ]
  },
  blog: {
    subtitle: 'Thoughts on engineering, product, and technology.',
    posts: [
      {
        id: 'li-mock-1', date: 'April 23, 2026', tag: 'LinkedIn',
        title: "Thrilled to share that I've joined a new chapter in my career!",
        excerpt: "Thrilled to share that I've joined a new chapter in my career! Excited to bring my experience in product and engineering to drive meaningful impact. The journey continues — stay tuned for more updates.",
        url: 'https://www.linkedin.com/in/lijunze/recent-activity/all/'
      },
      {
        id: 'li-mock-2', date: 'April 16, 2026', tag: 'LinkedIn',
        title: "Lessons from building 0→1 products: what I wish I knew earlier",
        excerpt: "Lessons from building 0→1 products: what I wish I knew earlier. The hardest part isn't the technology — it's figuring out what to build in the first place. Three things I keep coming back to: talk to users obsessively, ship small and learn fast, and never confuse motion for progress.",
        url: 'https://www.linkedin.com/in/lijunze/recent-activity/all/'
      },
      {
        id: 'li-mock-3', date: 'April 8, 2026', tag: 'LinkedIn',
        title: "AI is reshaping every product team I know — here's what's actually changing",
        excerpt: "AI is reshaping every product team I know — here's what's actually changing. It's not that engineers are being replaced. It's that the feedback loop from idea to working prototype has collapsed from weeks to hours. The teams winning aren't the ones with the most engineers — they're the ones who can learn the fastest.",
        url: 'https://www.linkedin.com/in/lijunze/recent-activity/all/'
      },
      {
        id: 'li-mock-4', date: 'March 30, 2026', tag: 'LinkedIn',
        title: "Attended an incredible summit on product leadership last week",
        excerpt: "Attended an incredible summit on product leadership last week. The single idea that stuck with me: the best product managers aren't advocates for users OR the business — they hold both in tension at once. Easy to say. Surprisingly hard to practice under pressure.",
        url: 'https://www.linkedin.com/in/lijunze/recent-activity/all/'
      },
      {
        id: 'li-mock-5', date: 'March 22, 2026', tag: 'LinkedIn',
        title: "On the topic of career growth: the most underrated skill is taste",
        excerpt: "On the topic of career growth: the most underrated skill is taste. Technical skills get you in the room. Communication gets you a seat at the table. But taste — the ability to recognize what's excellent before anyone else does — is what separates good from great in any craft.",
        url: 'https://www.linkedin.com/in/lijunze/recent-activity/all/'
      }
    ]
  },
  contact: {
    subtitle:  "Have a question or want to work together? I'd love to hear from you.",
    email:     'alex@example.com',
    location:  'San Francisco, CA',
    status:    'Open to opportunities'
  }
};

// ── Utilities ─────────────────────────────────────────────────────
function clone(obj)  { return JSON.parse(JSON.stringify(obj)); }
function uid()       { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function esc(str)    {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Content persistence ───────────────────────────────────────────
function loadContent() {
  try {
    const raw = localStorage.getItem(KEY_CONTENT);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return clone(DEFAULTS);
}

function saveContent(c) { localStorage.setItem(KEY_CONTENT, JSON.stringify(c)); }

// ── Toast ─────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
  setTimeout(() => {
    el.classList.remove('visible');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, 2800);
}

// ── General ───────────────────────────────────────────────────────
function renderGeneral() {
  const c = loadContent();
  document.getElementById('site-title').value = c.site?.title ?? '';
}

function saveGeneral() {
  const c = loadContent();
  if (!c.site) c.site = {};
  c.site.title = document.getElementById('site-title').value.trim();
  saveContent(c);
  toast('General settings saved');
}

// ── Navigation ────────────────────────────────────────────────────
function switchSection(name) {
  ['general', 'about', 'blog', 'contact', 'settings'].forEach(s => {
    document.getElementById(`panel-${s}`).hidden = (s !== name);
  });
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.section === name);
  });
  // Re-render active panel to reflect latest saved state
  if (name === 'general')  renderGeneral();
  if (name === 'about')    renderAbout();
  if (name === 'blog')     renderBlog();
  if (name === 'contact')  renderContact();
}

// ── About ─────────────────────────────────────────────────────────
function renderAbout() {
  const { name, role, bio, links } = loadContent().about;
  document.getElementById('about-name').value = name;
  document.getElementById('about-role').value = role;
  document.getElementById('about-bio').value  = bio;
  renderLinks(links);
}

function renderLinks(links) {
  document.getElementById('links-list').innerHTML = links.map((l, i) => `
    <div class="link-row">
      <input class="link-label" type="text" placeholder="Label"
             value="${esc(l.label)}" data-i="${i}">
      <input class="link-url" type="url" placeholder="https://…"
             value="${esc(l.url)}" data-i="${i}">
      <button class="icon-btn danger delete-link" data-i="${i}" title="Remove">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `).join('');
}

function collectLinks() {
  const labels = [...document.querySelectorAll('.link-label')].map(el => el.value.trim());
  const urls   = [...document.querySelectorAll('.link-url')].map(el => el.value.trim());
  return labels.map((label, i) => ({ label, url: urls[i] })).filter(l => l.label || l.url);
}

function saveAbout() {
  const c = loadContent();
  c.about.name  = document.getElementById('about-name').value.trim();
  c.about.role  = document.getElementById('about-role').value.trim();
  c.about.bio   = document.getElementById('about-bio').value.trim();
  c.about.links = collectLinks();
  saveContent(c);
  toast('About section saved');
}

// ── Blog ──────────────────────────────────────────────────────────
function renderBlog() {
  const posts = loadContent().blog.posts;
  const list  = document.getElementById('posts-list');

  if (!posts.length) {
    list.innerHTML = '<p class="empty-state">No posts yet. Click "+ New post" to add one.</p>';
    return;
  }

  list.innerHTML = posts.map(p => `
    <div class="post-row" data-id="${esc(p.id)}">
      <div class="post-row-info">
        <span class="post-tag">${esc(p.tag)}</span>
        <span class="post-title">${esc(p.title)}</span>
      </div>
      <div class="post-row-meta">
        <time>${esc(p.date)}</time>
        <div class="post-row-actions">
          <button class="icon-btn edit-post" data-id="${esc(p.id)}" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="icon-btn danger delete-post" data-id="${esc(p.id)}" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function openModal(postId = null) {
  const modal = document.getElementById('postModal');
  const c     = loadContent();
  const post  = postId ? c.blog.posts.find(p => p.id === postId) : null;

  modal.querySelector('#modal-heading').textContent      = post ? 'Edit post' : 'New post';
  modal.querySelector('#modal-id').value                 = post?.id      ?? uid();
  modal.querySelector('#modal-post-title').value         = post?.title   ?? '';
  modal.querySelector('#modal-date').value               = post?.date    ?? '';
  modal.querySelector('#modal-tag').value                = post?.tag     ?? '';
  modal.querySelector('#modal-excerpt').value            = post?.excerpt ?? '';
  modal.querySelector('#modal-url').value                = post?.url     ?? '#';
  modal.querySelector('#modal-delete').hidden            = !post;

  modal.hidden = false;
  modal.querySelector('#modal-post-title').focus();
}

function closeModal() { document.getElementById('postModal').hidden = true; }

function savePost() {
  const id   = document.getElementById('modal-id').value;
  const post = {
    id,
    title:   document.getElementById('modal-post-title').value.trim(),
    date:    document.getElementById('modal-date').value.trim(),
    tag:     document.getElementById('modal-tag').value.trim(),
    excerpt: document.getElementById('modal-excerpt').value.trim(),
    url:     document.getElementById('modal-url').value.trim() || '#'
  };
  if (!post.title) { toast('Title is required', 'error'); return; }

  const c   = loadContent();
  const idx = c.blog.posts.findIndex(p => p.id === id);
  if (idx >= 0) c.blog.posts[idx] = post;
  else          c.blog.posts.unshift(post);

  saveContent(c);
  closeModal();
  renderBlog();
  toast(idx >= 0 ? 'Post updated' : 'Post created');
}

function deletePost(id) {
  if (!confirm('Delete this post? This cannot be undone.')) return;
  const c = loadContent();
  c.blog.posts = c.blog.posts.filter(p => p.id !== id);
  saveContent(c);
  renderBlog();
  toast('Post deleted', 'info');
}

// ── Contact ───────────────────────────────────────────────────────
function renderContact() {
  const { subtitle, email, location, status } = loadContent().contact;
  document.getElementById('contact-subtitle').value = subtitle;
  document.getElementById('contact-email').value    = email;
  document.getElementById('contact-location').value = location;
  document.getElementById('contact-status').value   = status;
}

function saveContact() {
  const c = loadContent();
  c.contact.subtitle = document.getElementById('contact-subtitle').value.trim();
  c.contact.email    = document.getElementById('contact-email').value.trim();
  c.contact.location = document.getElementById('contact-location').value.trim();
  c.contact.status   = document.getElementById('contact-status').value.trim();
  saveContent(c);
  toast('Contact section saved');
}

// ── LinkedIn live sync (calls local scraper server) ───────────────
const SCRAPER_URL = 'http://127.0.0.1:3001/api/scrape';

async function syncLinkedin() {
  const btn     = document.getElementById('sync-linkedin-btn');
  const label   = document.getElementById('sync-linkedin-label');
  const spinner = document.getElementById('sync-linkedin-spinner');

  btn.disabled      = true;
  label.textContent = 'Syncing…';
  spinner.hidden    = false;

  try {
    const res = await fetch(SCRAPER_URL, { signal: AbortSignal.timeout(120000) });
    const data = await res.json();

    if (!data.ok) throw new Error(data.error || 'Scraper returned an error');

    importPosts(data.posts);
  } catch (err) {
    let msg = err.message;
    if (err.name === 'TypeError' || msg.includes('fetch')) {
      msg = 'Cannot reach scraper server. Start it with: NODE_PATH=/opt/node22/lib/node_modules node scraper/server.js';
    }
    toast(msg, 'error');
    console.error('[sync]', err);
  } finally {
    btn.disabled      = false;
    label.textContent = 'Sync LinkedIn';
    spinner.hidden    = true;
  }
}

// ── LinkedIn JSON import (shared by file upload and sync button) ──
function importPosts(incoming) {
  if (!Array.isArray(incoming) || !incoming.length) {
    toast('No posts found', 'error'); return;
  }
  const c = loadContent();
  let added = 0, skipped = 0;

  incoming.forEach(p => {
    if (!p.title) { skipped++; return; }
    const post = {
      id:      p.id      || ('li-' + uid()),
      date:    p.date    || '',
      tag:     p.tag     || 'LinkedIn',
      title:   p.title,
      excerpt: p.excerpt || '',
      url:     p.url     || '#',
    };
    const exists = c.blog.posts.some(ep => ep.id === post.id || ep.title === post.title);
    if (exists) { skipped++; return; }
    c.blog.posts.unshift(post);
    added++;
  });

  c.blog.posts = c.blog.posts.slice(0, 10);
  saveContent(c);
  renderBlog();
  toast(`Imported ${added} post(s)${skipped ? `, ${skipped} skipped` : ''}`);
}

function importLinkedinJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    let data;
    try { data = JSON.parse(e.target.result); } catch (_) { toast('Invalid JSON file', 'error'); return; }
    importPosts(data);
  };
  reader.readAsText(file);
}

// ── Settings ──────────────────────────────────────────────────────
function resetDefaults() {
  if (!confirm('Reset all content to defaults? This cannot be undone.')) return;
  localStorage.removeItem(KEY_CONTENT);
  renderGeneral();
  renderAbout();
  renderBlog();
  renderContact();
  toast('Content reset to defaults', 'info');
}

// ── Bootstrap ─────────────────────────────────────────────────────
function bind() {
  // Sidebar navigation
  document.querySelectorAll('.sidebar-nav .nav-item[data-section]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); switchSection(a.dataset.section); });
  });

  // General
  document.getElementById('save-general').addEventListener('click', saveGeneral);

  // About
  document.getElementById('save-about').addEventListener('click', saveAbout);

  document.getElementById('add-link-btn').addEventListener('click', () => {
    const c = loadContent();
    c.about.links.push({ label: '', url: '' });
    saveContent(c);
    renderLinks(c.about.links);
    // Focus the new label input
    const rows = document.querySelectorAll('.link-row');
    rows[rows.length - 1]?.querySelector('.link-label')?.focus();
  });

  document.getElementById('links-list').addEventListener('click', e => {
    const btn = e.target.closest('.delete-link');
    if (!btn) return;
    const c = loadContent();
    c.about.links.splice(Number(btn.dataset.i), 1);
    saveContent(c);
    renderLinks(c.about.links);
  });

  // Blog
  document.getElementById('new-post-btn').addEventListener('click', () => openModal());

  document.getElementById('sync-linkedin-btn').addEventListener('click', syncLinkedin);

  document.getElementById('import-linkedin-btn').addEventListener('click', () => {
    document.getElementById('import-linkedin-file').click();
  });
  document.getElementById('import-linkedin-file').addEventListener('change', e => {
    importLinkedinJson(e.target.files[0]);
    e.target.value = '';
  });

  document.getElementById('posts-list').addEventListener('click', e => {
    const edit = e.target.closest('.edit-post');
    const del  = e.target.closest('.delete-post');
    if (edit) openModal(edit.dataset.id);
    if (del)  deletePost(del.dataset.id);
  });

  // Modal
  document.getElementById('modal-save').addEventListener('click', savePost);
  document.getElementById('modal-delete').addEventListener('click', () => {
    const id = document.getElementById('modal-id').value;
    closeModal();
    deletePost(id);
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('postModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Contact
  document.getElementById('save-contact').addEventListener('click', saveContact);

  // Settings
  document.getElementById('reset-defaults').addEventListener('click', resetDefaults);
}

function init() {
  bind();
  switchSection('general');
}

init();
