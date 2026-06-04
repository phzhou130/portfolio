# Components

Reusable UI patterns used across the portfolio.

---

## Navigation

Fixed top nav with frosted-glass backdrop, logo left, links + CTA right.

```html
<nav id="nav">
  <a href="#" class="nav-logo">Penghua Zhou</a>
  <ul class="nav-links">
    <li><a href="#product-design">Product Design</a></li>
    <li><a href="#marketing-cases">Marketing Cases</a></li>
    <li><a href="#about">About</a></li>
    <li><a href="resume.pdf" target="_blank" class="nav-cta">Resume</a></li>
  </ul>
</nav>
```

```css
nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: 60px;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s;
}
nav.scrolled { border-bottom-color: var(--bg-border); }
```

**States**: Transparent border → subtle border on scroll (toggled via JS `scrolled` class).

---

## Nav CTA (Resume button)

```css
.nav-cta {
  border: 1px solid var(--bg-border);
  padding: 6px 18px;
  border-radius: 0;
  transition: background 0.2s, color 0.2s;
}
.nav-cta:hover {
  background: var(--text-primary);
  color: #fff;
}
```

---

## Hero Section

Full-viewport height with particle text canvas, floating skill labels, and staggered reveal animations.

**Structure:**
- Eyebrow label (`"Product Designer & Marketing Strategist"`)
- Hero title (particle-rendered, center)
- Tagline (`"Scaling EdTech startups from 0 to 30K+ users."`)
- CTA pair: primary black button + ghost button
- Stats row: 3 stat cards (30K+, 6+, Carnegie Mellon)
- 8 floating skill labels in sage green

---

## Buttons

### Primary
```css
.btn-primary {
  background: var(--text-primary);
  color: #fff;
  padding: 14px 28px;
  font-weight: 500;
  border: none;
  transition: opacity 0.2s;
}
.btn-primary:hover { opacity: 0.85; }
```

### Ghost
```css
.btn-ghost {
  background: transparent;
  color: var(--text-primary);
  padding: 14px 28px;
  border: 1px solid var(--bg-border);
  font-weight: 500;
  transition: border-color 0.2s;
}
.btn-ghost:hover { border-color: var(--text-primary); }
```

---

## Stat Card

```html
<div class="hero-stat">
  <div class="hero-stat-num">30K+</div>
  <div class="hero-stat-label">Users Grown</div>
</div>
```

```css
.hero-stat { display: flex; flex-direction: column; gap: 8px; }
.hero-stat-num {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.04em;
}
.hero-stat-label {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}
```

---

## Project Card (Modio-style)

Two-column grid card with image + title + description. Hover reveals a gradient overlay with metric text and year.

```html
<a href="cases/kidco-design.html" class="project-card">
  <div class="project-card-visual">
    <img src="..." alt="...">
    <div class="project-card-overlay">
      <span class="project-card-metric">AI-powered EdTech platform...</span>
      <span class="project-card-year">2024</span>
    </div>
  </div>
  <div>
    <div class="project-card-title">KIDCO AI-KID</div>
    <div class="project-card-desc">Product design and growth...</div>
  </div>
</a>
```

**Hover behavior:**
- Image scales to `1.04`
- Bottom gradient overlay fades in
- White metric text (left) + year (right) slide up 6px
- Staggered motion (0.05s / 0.1s delays)

---

## Project Counter Header

Above each project grid:

```html
<div class="project-counter">
  <span>(001)</span>
  <span class="project-counter-right">Explore the stories behind my work</span>
</div>
```

```css
.project-counter {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-tertiary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

---

## Section Header

```html
<div class="section-header">
  <div class="section-header-left">
    <div class="section-header-title">Product Design</div>
    <div class="section-header-sub">2022 – 2025</div>
  </div>
  <div class="section-header-right">
    <a href="#marketing-cases" class="section-header-link">Marketing Cases →</a>
    <a href="mailto:..." class="section-header-link">Contact Me →</a>
  </div>
</div>
```

Flex layout: title+subtitle on left, link list on right.

---

## Floating Skill Labels (Hero)

Small sage-green labels scattered around the hero title. Subtle hover enlargement.

```css
.hero-status {
  position: absolute;
  font-size: 11px;
  color: rgba(74,124,89,0.3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: font-size 0.4s ease, color 0.3s ease, letter-spacing 0.4s ease;
}
.hero-status:hover {
  font-size: 14px;
  color: rgba(74,124,89,0.9);
  letter-spacing: 0.1em;
}
```

---

## Footer

Three-column: brand name left, 2 link columns right, copyright full width.

```css
footer { background: var(--text-primary); color: #fff; padding: 64px 0 32px; }
.footer-inner { display: flex; gap: 64px; justify-content: space-between; }
.social-links { display: flex; gap: 20px; }
.footer-copy { margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); }
```
