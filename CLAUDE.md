# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static personal website with three sections — intro/hero, blog, and contact — built with plain HTML, CSS, and vanilla JavaScript. No build step, no framework, no dependencies.

## File structure

```
index.html          # Single-page site; all three sections live here
styles/main.css     # All styles; uses CSS custom properties (design tokens at the top)
scripts/main.js     # Nav scroll state, mobile menu, smooth scroll, contact form
```

## Running locally

Open `index.html` directly in a browser, or serve it with any static file server:

```bash
python3 -m http.server 8000
# or
npx serve .
```

No install or build step required.

## Deployment

Drop the repo into Netlify, Vercel (static), GitHub Pages, or any CDN — no configuration needed.

## Design conventions

- **Design tokens** are CSS custom properties at the top of `styles/main.css` (colors, font, border-radius, nav height, max-width). Change values there to retheme the whole site.
- **Color palette**: white bg (`--bg`), light gray alt bg (`--bg-alt`), indigo accent (`--accent: #4F46E5`), dark charcoal text (`--text: #111827`), muted gray (`--muted: #6B7280`).
- **Font**: Inter via Google Fonts, falling back to system-ui.
- **Layout**: `--max-w: 1080px` centered container, `24px` horizontal padding (collapses to `16px` on mobile).
- **Sections**: `.section` for white bg, `.section--alt` for `--bg-alt`. Padding is `100px 0` desktop, `72px 0` mobile.

## Personalizing content

All placeholder content is in `index.html`:
- Name, role, bio, and social links → inside `<section class="hero" id="about">`
- Blog posts → each `<article class="post-card">` inside `#blog`
- Contact details → `.contact-info` inside `#contact`

## Contact form

The form currently shows a success message client-side only. To send real emails:
- **Formspree**: add `action="https://formspree.io/f/<id>" method="POST"` to the `<form>` and remove the JS submit handler.
- **EmailJS**: call `emailjs.sendForm(...)` inside the submit handler in `scripts/main.js`.

## Git configuration

- **Branch convention**: `claude/<description>-<id>` (e.g., `claude/add-claude-documentation-0zuIx`)
- **Commit signing**: SSH key-based signing is enabled
- **Remote**: `jl11390/For_Claude_Only` on GitHub
