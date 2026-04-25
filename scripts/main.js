// ── CMS content loader ────────────────────────────────────────────
// Reads content saved by the admin portal and updates the page.
// Falls back to the hardcoded HTML if no saved content exists.
(function loadCmsContent() {
  let c;
  try {
    const raw = localStorage.getItem('cms_content');
    if (!raw) return;
    c = JSON.parse(raw);
  } catch (_) { return; }

  // About
  if (c.about) {
    const { name, role, bio, links } = c.about;
    if (name) {
      const nameEl   = document.getElementById('cms-name');
      const navEl    = document.getElementById('cms-nav-name');
      const footerEl = document.getElementById('cms-footer-name');
      if (nameEl)   nameEl.textContent   = name;
      if (navEl)    navEl.textContent    = name;
      if (footerEl) footerEl.textContent = name;
    }
    if (role) {
      const el = document.getElementById('cms-role');
      if (el) el.textContent = role;
    }
    if (bio) {
      const el = document.getElementById('cms-bio');
      if (el) el.innerHTML = bio;
    }
    if (links?.length) {
      const el = document.getElementById('cms-contact-links');
      if (el) {
        const email = c.contact?.email || 'alex@example.com';
        el.innerHTML =
          `<a href="mailto:${email}" class="btn btn-dark" id="cms-get-in-touch">Get in touch</a>` +
          links.map(l =>
            `<a href="${l.url}" class="btn btn-outline" target="_blank" rel="noopener">${l.label}</a>`
          ).join('');
      }
    }
  }

  // Blog
  if (c.blog) {
    const subtitleEl = document.getElementById('cms-blog-subtitle');
    const gridEl     = document.getElementById('cms-post-grid');
    if (subtitleEl && c.blog.subtitle) subtitleEl.textContent = c.blog.subtitle;
    if (gridEl && c.blog.posts?.length) {
      gridEl.innerHTML = c.blog.posts.map(p => `
        <article class="post-card">
          <div class="post-meta">
            <time>${p.date}</time>
            <span class="tag">${p.tag}</span>
          </div>
          <h3><a href="${p.url}">${p.title}</a></h3>
          <p>${p.excerpt}</p>
          <a class="post-link" href="${p.url}">Read more →</a>
        </article>
      `).join('');
    }
  }

  // Contact
  if (c.contact) {
    const { subtitle, email, location, status } = c.contact;
    const subtitleEl = document.getElementById('cms-contact-subtitle');
    const emailEl    = document.getElementById('cms-email');
    const locationEl = document.getElementById('cms-location');
    const statusEl   = document.getElementById('cms-status');
    if (subtitleEl && subtitle) subtitleEl.textContent = subtitle;
    if (email) {
      if (emailEl)   { emailEl.textContent = email; emailEl.href = `mailto:${email}`; }
      const getInTouch = document.getElementById('cms-get-in-touch');
      if (getInTouch) getInTouch.href = `mailto:${email}`;
    }
    if (locationEl && location) locationEl.textContent = location;
    if (statusEl   && status)   statusEl.textContent   = status;
  }
})();

// ── Nav scroll state ──────────────────────────────────────────────
const nav       = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });

// ── Mobile menu ───────────────────────────────────────────────────
hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
});

mobileMenu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
  })
);

// ── Smooth scroll (accounts for fixed nav height) ─────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

