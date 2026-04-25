const nav        = document.getElementById('nav');
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const form       = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

// ── Nav: add .scrolled class on scroll ──────────────────────────
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });

// ── Mobile menu toggle ──────────────────────────────────────────
hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
});

// Close mobile menu when a link is tapped
mobileMenu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
  })
);

// ── Smooth-scroll for anchor links (accounts for fixed nav) ──────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ── Contact form ────────────────────────────────────────────────
// To actually send emails, replace this handler with Formspree:
//   action="https://formspree.io/f/<your-id>" method="POST"
// or wire up EmailJS / your own API.
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    form.hidden = true;
    formSuccess.hidden = false;
  });
}
