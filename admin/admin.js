'use strict';

// ── Storage keys ──────────────────────────────────────────────────
const KEY_CONTENT  = 'cms_content';
const KEY_SESSION  = 'cms_session';
const KEY_PASSWORD = 'cms_password_hash';

// SHA-256 of "admin"
const DEFAULT_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

// ── Default content ───────────────────────────────────────────────
const DEFAULTS = {
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
        id: 'post-1',
        date:    'April 15, 2025',
        tag:     'Engineering',
        title:   'Building Scalable Systems: Lessons from 10 Years in Tech',
        excerpt: "Distributed systems are notoriously hard to get right. Here's what I've learned from building infrastructure that serves millions of users without waking you up at 3 am.",
        url:     '#'
      },
      {
        id: 'post-2',
        date:    'March 28, 2025',
        tag:     'Product',
        title:   'The Art of Saying No: Prioritization in a Fast-Moving Startup',
        excerpt: "Every product team faces the eternal tension between building what users ask for and building what they actually need. A framework that's helped me stay honest.",
        url:     '#'
      },
      {
        id: 'post-3',
        date:    'February 10, 2025',
        tag:     'AI',
        title:   "Why AI Won't Replace Engineers — But Will Change Everything",
        excerpt: "The rise of LLMs and coding assistants has sparked plenty of hyperbole. Here's a grounded take on what genuinely shifts and what stays the same.",
        url:     '#'
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

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Auth ──────────────────────────────────────────────────────────
async function tryLogin(password) {
  const expected = localStorage.getItem(KEY_PASSWORD) || DEFAULT_HASH;
  if (await sha256(password) !== expected) return false;
  sessionStorage.setItem(KEY_SESSION, '1');
  return true;
}

function logout() {
  sessionStorage.removeItem(KEY_SESSION);
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').hidden = true;
  document.getElementById('dashboard').hidden    = true;
  document.getElementById('login-screen').hidden = false;
}

function isAuthed() { return sessionStorage.getItem(KEY_SESSION) === '1'; }

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

// ── Navigation ────────────────────────────────────────────────────
function switchSection(name) {
  ['about', 'blog', 'contact', 'settings'].forEach(s => {
    document.getElementById(`panel-${s}`).hidden = (s !== name);
  });
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.section === name);
  });
  // Re-render active panel to reflect latest saved state
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

// ── Settings ──────────────────────────────────────────────────────
async function savePassword() {
  const current  = document.getElementById('pwd-current').value;
  const next     = document.getElementById('pwd-new').value;
  const confirm  = document.getElementById('pwd-confirm').value;

  if (!current || !next || !confirm) { toast('Fill in all three fields', 'error'); return; }
  if (next !== confirm)              { toast("New passwords don't match", 'error'); return; }

  const expected = localStorage.getItem(KEY_PASSWORD) || DEFAULT_HASH;
  if (await sha256(current) !== expected) { toast('Current password is incorrect', 'error'); return; }

  localStorage.setItem(KEY_PASSWORD, await sha256(next));
  ['pwd-current', 'pwd-new', 'pwd-confirm'].forEach(id =>
    (document.getElementById(id).value = ''));
  toast('Password updated');
}

function resetDefaults() {
  if (!confirm('Reset all content to defaults? This cannot be undone.')) return;
  localStorage.removeItem(KEY_CONTENT);
  renderAbout();
  renderBlog();
  renderContact();
  toast('Content reset to defaults', 'info');
}

// ── Bootstrap ─────────────────────────────────────────────────────
function bind() {
  // Login
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const ok = await tryLogin(document.getElementById('login-password').value);
    if (ok) {
      document.getElementById('login-screen').hidden = true;
      document.getElementById('dashboard').hidden    = false;
      switchSection('about');
    } else {
      document.getElementById('login-error').hidden = false;
      document.getElementById('login-password').select();
    }
  });

  // Clear login error on typing
  document.getElementById('login-password').addEventListener('input', () => {
    document.getElementById('login-error').hidden = true;
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', logout);

  // Sidebar navigation
  document.querySelectorAll('.sidebar-nav .nav-item[data-section]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); switchSection(a.dataset.section); });
  });

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
  document.getElementById('save-password').addEventListener('click', savePassword);
  document.getElementById('reset-defaults').addEventListener('click', resetDefaults);
}

function init() {
  bind();
  if (isAuthed()) {
    document.getElementById('login-screen').hidden = true;
    document.getElementById('dashboard').hidden    = false;
    switchSection('about');
  }
}

init();
