# Portfolio Design System

Design tokens and guidelines extracted from `index.html` of Penghua Zhou's portfolio. Bold minimalist style inspired by [Portez](https://portez.framer.website/) and [Modio](https://modio.framer.media/).

---

## Files

| File | Purpose |
|------|---------|
| `tokens.json` | All design tokens in JSON (colors, type, spacing, motion, etc.) |
| `palette.md` | Color palette with usage rules & examples |
| `typography.md` | Type scale, weights, semantic styles |
| `components.md` | Reusable UI components (nav, buttons, cards, stats) |
| `motion.md` | Interactions, easing, durations, animations |
| `layout.md` | Grid, spacing scale, containers, breakpoints |

---

## Core Design Principles

1. **Bold minimalism** — confident typography, generous whitespace, zero decorative noise.
2. **Black & white, one accent** — grayscale only, with sage green (`#4a7c59`) as the sole brand color used for hover states.
3. **Inter everywhere** — no font mixing. Hierarchy from weight + size + letter-spacing.
4. **Sharp corners** — no border-radius on cards, buttons, or containers. Only cursor dots and logos are round.
5. **Motion with purpose** — every animation earns its place. Cubic-bezier eased, reduced-motion respected.
6. **96px vertical rhythm** — sections share consistent padding for visual breathing.

---

## Quick Reference

### Primary Tokens

```css
:root {
  /* Colors */
  --bg-base: #ffffff;
  --bg-surface: #f5f5f5;
  --bg-border: #e0e0e0;
  --text-primary: #000000;
  --text-secondary: #616161;
  --text-tertiary: #8f8f8f;
  --accent: #000000;

  /* Font */
  --font-sans: 'Inter', -apple-system, sans-serif;
  --text-hero: clamp(3.5rem, 8vw, 6rem);

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 20px rgba(0,0,0,0.08);
  --shadow-lg: 0 16px 48px rgba(0,0,0,0.1);
}
```

### Standard Easing

```css
transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
```

### Standard Section

```css
section { padding: 96px 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 40px; }
```

---

## Inspiration Sources

- **Portez** — typography weight, ghost-button styling, minimalist nav
- **Modio** — project grid with hover gradient overlays (metric + year)
- **Pixend** — staggered line-reveal animations (used in other versions)

---

## Version

- **v1.0.0** — Initial extraction from `index.html` (2026)
