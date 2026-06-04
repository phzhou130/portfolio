# Color Palette

Pure black & white with minimal sage green accent. Bold minimalist — color is used sparingly and intentionally.

---

## Backgrounds

| Token | HEX | Usage |
|-------|-----|-------|
| `--bg-base` | `#ffffff` | Page background (pure white) |
| `--bg-surface` | `#f5f5f5` | Alternate section background (Marketing Cases) |
| `--bg-elevated` | `#eaeaea` | Hover states, subtle elevation |
| `--bg-border` | `#e0e0e0` | Dividers, borders, project grid separators |

---

## Text

| Token | HEX | Usage |
|-------|-----|-------|
| `--text-primary` | `#000000` | Headings, hero title, titles |
| `--text-secondary` | `#616161` | Body paragraphs, descriptions |
| `--text-tertiary` | `#8f8f8f` | Labels, metadata, counters |
| — | `#ffffff` | Text on dark backgrounds (hover overlays) |

---

## Accent

| Token | HEX | Usage |
|-------|-----|-------|
| `--accent` | `#000000` | CTAs, nav CTA background, borders |
| `--accent-light` | `rgba(0,0,0,0.05)` | Subtle accent backgrounds |
| Hover green | `#4a7c59` | Hero title letter hover, skill tag hover, link hover |
| Nav dot | `#ff3b30` | Red dot next to "Penghua Zhou" logo |
| Particle green | `rgba(74,124,89,0.3)` | Hero background particles & connections |

---

## Overlays

| Token | Value | Usage |
|-------|-------|-------|
| Card hover gradient | `linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0) 60%)` | Project card hover — bottom gradient revealing metric + year |
| Nav glass | `rgba(255,255,255,0.9)` + `backdrop-filter: blur(20px)` | Frosted nav bar |

---

## Design Rules

- **Default palette is black on white.** Gray scale only — no blues, purples, yellows.
- **Sage green (`#4a7c59`) is the ONLY brand color.** Used exclusively for hover states as a signature touch.
- **Red dot (`#ff3b30`)** used once as a single-pixel accent in the nav logo.
- **Dark overlays** for project card hovers use black with varying alpha — never colored tints.
- **Section background alternation**: Product Design = white, Marketing Cases = `#f5f5f5`.

---

## Usage Examples

```css
/* Primary text on white */
color: var(--text-primary);
background: var(--bg-base);

/* Project card hover overlay */
background: linear-gradient(to top,
  rgba(0,0,0,0.75) 0%,
  rgba(0,0,0,0.45) 30%,
  rgba(0,0,0,0) 60%);

/* Hero letter hover accent */
.ix-char:hover { color: #4a7c59; }

/* Nav CTA */
.nav-cta { border: 1px solid var(--bg-border); color: var(--text-primary); }
.nav-cta:hover { background: var(--text-primary); color: #fff; }
```
