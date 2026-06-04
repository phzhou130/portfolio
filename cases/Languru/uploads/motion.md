# Motion & Interactions

The site uses purposeful, restrained motion — everything cubic-bezier eased, never linear or bouncy-jerky.

---

## Easing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `standard` | `cubic-bezier(0.16, 1, 0.3, 1)` | Scroll reveals, card hovers, overlay fades |
| `spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Cursor scale, letter bounce on hover |
| `smooth` | `ease` | Small property transitions (opacity, color) |

---

## Durations

| Token | Value | Usage |
|-------|-------|-------|
| `fast` | `200–300ms` | Hover states, buttons, links |
| `normal` | `400ms` | Letter hover lift, particle color shift |
| `slow` | `500–600ms` | Image scale on hover, overlay fade |
| `reveal` | `700ms` | Scroll-triggered section reveals |

---

## Key Interactions

### 1. Custom Cursor
Black 10×10 dot + 36×36 gray ring that lerps smoothly behind it.
- Uses `mix-blend-mode: difference` to invert over dark backgrounds
- `position: fixed` with JS updating `left/top` each frame
- Ring lerps at 0.13 towards cursor for a trailing feel

### 2. Hero Particle Text
`Data-Driven Design, Growth Delivered` rendered as thousands of small particles.
- Particles assemble from random positions into text form on load
- Mouse push displaces particles within radius, they snap back with spring-ease
- Displaced particles briefly turn sage green

### 3. Floating Skill Labels
Eight skill tags scattered around hero with subtle floating animation.
- Default: `color: rgba(74,124,89,0.3)`, `font-size: 11px`
- Hover: scale to `14px`, opacity jumps to `0.9`, letter-spacing widens
- Each label has independent `animation-delay` for organic drift

### 4. Hero Title Letter Hover (Penghua Zhou)
Each character is wrapped in `.ix-char` span.
- Hover: `translateY(-8px) rotate(-4deg)` + color becomes `#4a7c59`
- Spring easing for bouncy lift

### 5. Scroll Reveal
Section content fades in with upward drift when 10% visible.
- `opacity: 0 → 1`, `transform: translateY(24px) → translateY(0)`
- 700ms `cubic-bezier(0.16,1,0.3,1)`
- Stagger via `:nth-child(2)` / `:nth-child(3)` delays (80ms / 160ms)
- Disabled via `@media (prefers-reduced-motion: reduce)`

### 6. Project Card Hover
Image zooms and gradient overlay reveals text.
- Image: `transform: scale(1.04)` over 600ms
- Overlay: `opacity 0 → 1` + gradient fade-in over 500ms
- Metric text slides up 6px with 0.05s delay
- Year slides up 6px with 0.1s delay (sequential)

### 7. Nav Scroll Border
Nav bar gets a subtle bottom border after 10px scroll.
- JS toggles `.scrolled` class
- `border-color` transitions over 300ms

### 8. Audio Toggle
Floating speaker icon bottom-right. Click toggles ambient music-box audio on the hero.

---

## Motion Rules

- **Nothing bounces sharply.** All springs are gentle (low overshoot).
- **Stagger everything in pairs or triples** for rhythm (0.05s, 0.1s, 0.16s).
- **Hover states always have a clear "off" state** — no permanent highlights.
- **Reduced motion is respected** — `prefers-reduced-motion: reduce` disables all animations.
- **Performance**: prefer `transform` and `opacity` over `top/left/width`. Canvas runs on `requestAnimationFrame`.
