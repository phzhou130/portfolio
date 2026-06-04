# Layout & Spacing

Grid system, container widths, section rhythm, and responsive rules.

---

## Container

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}
@media (max-width: 768px) {
  .container { padding: 0 20px; }
}
```

Every content section lives inside `.container`. Max width `1200px` keeps line lengths readable on ultrawide displays.

---

## Section Rhythm

```css
section {
  padding: 96px 0;
  position: relative;
  z-index: 1;
}
@media (max-width: 768px) {
  section { padding: 64px 0; }
}
```

**All sections share the same top/bottom padding** — creating consistent vertical rhythm. Desktop: `96px`, Mobile: `64px`.

**Alternating backgrounds:**
- `#product-design` → white (`--bg-base`)
- `#marketing-cases` → light gray (`--bg-surface`)
- `#about` → white
- Footer → black (`--text-primary`)

---

## Spacing Scale

Based on a 4px grid:

| Token | Value | Usage |
|-------|-------|-------|
| `1` | 4px | Tight gaps (adjacent icons) |
| `2` | 8px | Label-to-value spacing |
| `3` | 12px | Small gaps |
| `4` | 16px | Card internal padding |
| `5` | 20px | Grid gaps (mobile), padding |
| `6` | 24px | Heading-to-body |
| `8` | 32px | Section-internal gaps |
| `10` | 40px | Container padding, overlay padding |
| `12` | 48px | Between major blocks |
| `16` | 64px | Section padding (mobile), hero-stats margin |
| `20` | 80px | Large block separation |
| `24` | 96px | Section padding (desktop) |

---

## Project Grid

```css
.project-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40px 32px;  /* vertical, horizontal */
}
@media (max-width: 768px) {
  .project-grid { grid-template-columns: 1fr; gap: 32px; }
}
```

- Desktop: **2 columns**, 40px row gap, 32px column gap
- Mobile: **1 column**, 32px gap

Inside each card:
- Gap between image and text block: `14px`
- Gap between title and description: `6px`

---

## Hero Layout

Full viewport width, content constrained to `.container`.
- Vertical: centered with `min-height: 100vh`
- Horizontal: title centered, tagline + CTA left-aligned
- Stats row: flex with `gap: 48px`, wraps to column on mobile
- Floating skill labels: `position: absolute` scattered around hero

---

## Nav Layout

```css
nav {
  position: fixed;
  height: 60px;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

Not constrained to `.container` — full viewport width. Logo on left, links on right.

---

## Z-Index Layers

| z | Component |
|---|-----------|
| 0 | Background particles canvas (`#ix-bg`) |
| 1 | Normal section content |
| 10 | Hero skill labels |
| 100 | Nav bar |
| 9998 | Cursor ring |
| 9999 | Cursor dot |

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|-----------|----------|
| **Default** | Mobile-first (assumes ≤480px) |
| `≥ 480px` | Small tablet — spacing increases slightly |
| `≥ 768px` | Tablet — container padding grows to 40px, section padding to 96px |
| `≥ 900px` | Project grid gets larger overlay padding |
| `≥ 1200px` | Desktop max — container caps at 1200px |

Media queries in CSS:
```css
@media (max-width: 768px) { /* mobile/tablet */ }
@media (max-width: 900px) { /* project grid compact */ }
```

---

## Layout Rules

- **Content max-width never exceeds `1200px`** — keeps line lengths comfortable.
- **Everything aligns to the 40px horizontal gutter** on desktop, 20px on mobile.
- **Vertical rhythm is 96px** between sections — sacred spacing.
- **No decorative whitespace.** If there's space, it's doing something (e.g. emphasizing hierarchy, separating ideas).
- **Nav overlay is always visible** — fixed `60px` height, never hides.
