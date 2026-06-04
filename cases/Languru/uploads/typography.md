# Typography

Single font family (Inter), used across every element. Hierarchy is built through **weight + size + letter-spacing**, not multiple typefaces.

---

## Font Family

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

Loaded from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

Weights used: **300, 400, 500, 600, 700**

---

## Type Scale

| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | `0.75rem` (12px) | Tags, tiny labels |
| `--text-sm` | `0.875rem` (14px) | Small text, meta, nav links |
| `--text-base` | `1rem` (16px) | Body default |
| `--text-lg` | `1.125rem` (18px) | Larger body, subtitles |
| `--text-xl` | `1.25rem` (20px) | Small headings |
| `--text-2xl` | `1.5rem` (24px) | Section subtitles |
| `--text-3xl` | `1.875rem` (30px) | Secondary headings |
| `--text-4xl` | `2.25rem` (36px) | Stat numbers |
| `--text-hero` | `clamp(3.5rem, 8vw, 6rem)` | Hero display |

---

## Semantic Styles

### Hero Title
```css
font-size: clamp(3.5rem, 8vw, 6rem);
font-weight: 700;
letter-spacing: -0.04em;
line-height: 1;
```

### Nav Logo
```css
font-size: clamp(24px, 3vw, 32px);
font-weight: 700;
letter-spacing: -0.04em;
```

### Section Title (e.g. "Product Design")
```css
font-size: clamp(1.5rem, 3vw, 2.25rem);
font-weight: 700;
letter-spacing: -0.03em;
```

### Hero Tagline
```css
font-size: clamp(1.25rem, 2.8vw, 2rem);
font-weight: 400;
letter-spacing: -0.02em;
line-height: 1.35;
color: var(--text-tertiary);
```

### Stat Number (30K+, CMU '24)
```css
font-size: clamp(2rem, 4vw, 3rem);
font-weight: 700;
letter-spacing: -0.04em;
```

### Stat Label
```css
font-size: 0.875rem;
font-weight: 400;
color: var(--text-tertiary);
```

### Project Card Title (LUMINOR style)
```css
font-size: 15px;
font-weight: 700;
letter-spacing: 0.03em;
text-transform: uppercase;
```

### Project Card Description
```css
font-size: 14px;
font-weight: 400;
color: var(--text-secondary);
line-height: 1.5;
margin-top: 6px;
```

### Nav Links
```css
font-size: 1rem;
font-weight: 400;
color: var(--text-secondary);
```

### Body Paragraph
```css
font-size: 16px;
font-weight: 400;
line-height: 1.6;
color: var(--text-primary);
```

---

## Weight Hierarchy

| Weight | When to use |
|--------|------------|
| **300** (Light) | Not used — reserved for future use |
| **400** (Regular) | Body text, nav links, descriptions, hero tagline |
| **500** (Medium) | Metric overlays on project cards, stat labels |
| **600** (Semibold) | Buttons, section links, stat labels (heavy) |
| **700** (Bold) | All titles, stat numbers, hero heading, card titles |

---

## Letter-Spacing Rules

| Rule | Value | Context |
|------|-------|---------|
| Headings get **tight** spacing | `-0.03em` to `-0.04em` | All bold display text |
| Body stays **neutral** | `0` | Paragraphs, nav links |
| Small uppercase gets **wide** spacing | `+0.03em` to `+0.08em` | Card titles (UPPERCASE), counter labels |

---

## Design Rules

- **Never mix font families.** Inter only.
- **Never use italic** except in hover particle scattering (not visible).
- **Bold minimalism = weight contrast.** Use 400 vs 700 for maximum readability contrast instead of sizes alone.
- **Tight letter-spacing on big type** — scales down visually as text grows.
- **UPPERCASE only for small labels** (card titles, nav CTA) — never for body or large text.
