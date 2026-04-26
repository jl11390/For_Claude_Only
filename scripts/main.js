// ── Built-in default posts (used when no CMS content is saved) ────
const DEFAULT_POSTS = [
  {
    id: 'post-1',
    date: 'April 15, 2025', tag: 'Engineering',
    title: 'Building Scalable Systems: Lessons from 10 Years in Tech',
    excerpt: "Distributed systems are notoriously hard to get right. Here's what I've learned building infrastructure that serves millions of users without waking you up at 3 am.",
    url: '#'
  },
  {
    id: 'post-2',
    date: 'March 28, 2025', tag: 'Product',
    title: 'The Art of Saying No: Prioritization in a Fast-Moving Startup',
    excerpt: "Every product team faces the eternal tension between building what users ask for and what they actually need. A framework that's helped me stay honest.",
    url: '#'
  },
  {
    id: 'post-3',
    date: 'February 10, 2025', tag: 'AI',
    title: "Why AI Won't Replace Engineers — But Will Change Everything",
    excerpt: "The rise of LLMs and coding assistants has sparked plenty of hyperbole. Here's a grounded take on what genuinely shifts and what stays the same.",
    url: '#'
  }
];

// ── CMS content loader ────────────────────────────────────────────
function loadCmsContent() {
  let c = null;
  try {
    const raw = localStorage.getItem('cms_content');
    if (raw) c = JSON.parse(raw);
  } catch (_) {}

  // Site title
  if (c?.site?.title) {
    document.title = c.site.title;
  }

  // About
  if (c?.about) {
    const { name, role, bio, links } = c.about;
    if (name) {
      const nameEl   = document.getElementById('cms-name');
      const navEl    = document.getElementById('cms-nav-name');
      const footerEl = document.getElementById('cms-footer-name');
      if (nameEl)   nameEl.textContent   = name;
      if (navEl)    navEl.textContent    = name;
      if (footerEl) footerEl.textContent = name;
    }
    const roleEl = document.getElementById('cms-role');
    if (role && roleEl) roleEl.textContent = role;
    const bioEl = document.getElementById('cms-bio');
    if (bio && bioEl) bioEl.innerHTML = bio;

    if (links?.length) {
      const el    = document.getElementById('cms-contact-links');
      const email = c.contact?.email || 'alex@example.com';
      if (el) {
        el.innerHTML =
          `<a href="mailto:${email}" class="btn btn-dark" id="cms-get-in-touch">Get in touch</a>` +
          links.map(l =>
            `<a href="${l.url}" class="btn btn-outline" target="_blank" rel="noopener">${l.label}</a>`
          ).join('');
      }
    }
  }

  // Blog — always render slider (CMS posts or built-in defaults)
  const posts = (c?.blog?.posts?.length ? c.blog.posts : DEFAULT_POSTS).slice(0, 10);
  const subtitleEl = document.getElementById('cms-blog-subtitle');
  if (subtitleEl && c?.blog?.subtitle) subtitleEl.textContent = c.blog.subtitle;
  renderSlider(posts);

  // Contact
  if (c?.contact) {
    const { subtitle, email, location, status } = c.contact;
    const subtitleEl = document.getElementById('cms-contact-subtitle');
    const emailEl    = document.getElementById('cms-email');
    const locationEl = document.getElementById('cms-location');
    const statusEl   = document.getElementById('cms-status');
    if (subtitleEl && subtitle) subtitleEl.textContent = subtitle;
    if (email) {
      if (emailEl) { emailEl.textContent = email; emailEl.href = `mailto:${email}`; }
      const btn = document.getElementById('cms-get-in-touch');
      if (btn) btn.href = `mailto:${email}`;
    }
    if (locationEl && location) locationEl.textContent = location;
    if (statusEl   && status)   statusEl.textContent   = status;
  }
}

// ── Blog slider ───────────────────────────────────────────────────
let sliderPage  = 0;
let sliderPosts = [];
const CPP = () => window.innerWidth < 640 ? 1 : 3;   // cards per page

function renderSlider(posts) {
  sliderPosts = posts;
  sliderPage  = 0;
  const container = document.getElementById('cms-blog-container');
  if (!container) return;

  const cards = posts.map(p => `
    <article class="post-card">
      <div class="post-meta">
        <time>${p.date}</time>
        <span class="tag">${p.tag}</span>
      </div>
      <h3><a href="${p.url}">${p.title}</a></h3>
      <p>${p.excerpt}</p>
      <a class="post-link" href="${p.url}">Read more →</a>
    </article>`).join('');

  container.innerHTML = `
    <div class="blog-slider">
      <button class="slider-arrow" id="sliderPrev" aria-label="Previous posts">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div class="slider-viewport" id="sliderViewport">
        <div class="slider-track" id="sliderTrack">${cards}</div>
      </div>
      <button class="slider-arrow" id="sliderNext" aria-label="Next posts">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
    <div class="slider-dots" id="sliderDots"></div>`;

  applySlider();

  document.getElementById('sliderPrev').addEventListener('click', () => {
    if (sliderPage > 0) { sliderPage--; applySlider(); }
  });
  document.getElementById('sliderNext').addEventListener('click', () => {
    if (sliderPage < totalPages() - 1) { sliderPage++; applySlider(); }
  });

  window.addEventListener('resize', () => {
    sliderPage = Math.min(sliderPage, totalPages() - 1);
    applySlider();
  }, { passive: true });
}

function totalPages() { return Math.ceil(sliderPosts.length / CPP()); }

function applySlider() {
  const track    = document.getElementById('sliderTrack');
  const viewport = document.getElementById('sliderViewport');
  const dots     = document.getElementById('sliderDots');
  if (!track) return;

  const cpp     = CPP();
  const gap     = 20;
  const vpW     = viewport.offsetWidth;
  const cardW   = (vpW - (cpp - 1) * gap) / cpp;
  const slideBy = cpp * (cardW + gap);

  // Set each card width explicitly
  track.querySelectorAll('.post-card').forEach(c => {
    c.style.flexShrink = '0';
    c.style.width      = `${cardW}px`;
  });

  track.style.transform = `translateX(-${sliderPage * slideBy}px)`;

  const pages = totalPages();
  document.getElementById('sliderPrev').disabled = sliderPage === 0;
  document.getElementById('sliderNext').disabled = sliderPage >= pages - 1;

  // Dots
  if (pages > 1) {
    dots.innerHTML = Array.from({ length: pages }, (_, i) =>
      `<button class="dot${i === sliderPage ? ' dot--active' : ''}"
               data-page="${i}" aria-label="Page ${i + 1}"></button>`
    ).join('');
    dots.querySelectorAll('.dot').forEach(d =>
      d.addEventListener('click', () => { sliderPage = +d.dataset.page; applySlider(); })
    );
  } else {
    dots.innerHTML = '';
  }
}

// ── Nav scroll state ──────────────────────────────────────────────
const nav        = document.getElementById('nav');
const hamburger  = document.getElementById('hamburger');
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

// ── Smooth scroll ─────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight, behavior: 'smooth' });
  });
});

// ── Boot ──────────────────────────────────────────────────────────
loadCmsContent();
