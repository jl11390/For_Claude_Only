// ── Built-in default posts (synced from LinkedIn, updated via admin) ─
const DEFAULT_POSTS = [
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
