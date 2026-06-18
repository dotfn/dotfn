---
version: beta
name: Gruvbox-design-analysis
description: An organic, retro-groove portfolio interface anchored on a warm earthy canvas, where Gruvbox's iconic yellow (#FABD2F) and orange (#FE8019) carry primary actions and branding. Typography couples 'Bricolage Grotesque' for bold headings with 'DM Sans' for legible running text. Dark theme defaults to a dark-charcoal background (#1D2021) with cream text; Light theme flips to a refined warm stone-white background (#FBFAF5) with charcoal text.

colors:
  dark:
    bg: "#1d2021"
    card: "#282828"
    card-mid: "#3c3836"
    line: "#3c3836"
    text-light: "#fbf1c7"
    text-muted: "#a89984"
    ink: "#ebdbb2"
    ink-soft: "#bdae93"
    accent: "#fabd2f"
    accent-soft: "#352f1b"
    accent-hot: "#fe8019"
  light:
    bg: "#fbfaf5"
    card: "#ffffff"
    card-mid: "#f5f3e9"
    line: "#e5e1d3"
    text-light: "#282828"
    text-muted: "#7c6f64"
    ink: "#3c3836"
    ink-soft: "#504945"
    accent: "#b57614"
    accent-soft: "#f5ede0"
    accent-hot: "#af3a03"

typography:
  headings:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'DM Sans', sans-serif"
    fontWeight: 400
  monospace:
    fontFamily: "'JetBrains Mono', monospace"

rounded:
  card: 28px
  btn: 16px
  pill: 999px

spacing:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  section: 80px
---

## Overview

The design system is built around the **Gruvbox** color scheme, evoking a retro-warm, organic feel. It moves away from cold, highly contrasted interfaces into a harmonious, warm atmosphere with optimal readability (WCAG AA compliant). 

The dark mode anchors the canvas on a warm charcoal base (`#1D2021`), while the light mode offers a refined warm stone floor (`#FBFAF5`). Action elements utilize Gruvbox yellow and orange accents to guide user interactions without visual noise.

Typography relies on a dual-font stack:
- **Bricolage Grotesque:** Used for displays, section headings, and primary labels to lend a playful, confident structural geometry.
- **DM Sans:** Used for all body text, ensuring high legibility and comfort across viewport scales.
- **JetBrains Mono:** Reserved for tags, dates, code snippets, and metadata blocks.

## Color System

### Dark Mode (Default)
- **Canvas BG:** `#1D2021` (dark0_hard). The primary canvas floor.
- **Card BG:** `#282828` (dark0). Elevates content panels, cards, and headers.
- **Card Mid / Lines:** `#3C3836` (dark1). Used for interactive elements in resting states and subtle borders.
- **Ink / Main Text:** `#EBDBB2` (light1). Soft cream tone for standard readability.
- **Ink Soft:** `#BDAE93` (light3). Secondary hierarchy for descriptions and meta text.
- **Accent:** `#FABD2F` (bright_yellow). Used for key icons, active tags, and highlights.
- **Accent Hot:** `#FE8019` (bright_orange). Used for hover states, critical highlights, and live tags.

### Light Mode
- **Canvas BG:** `#FBFAF5` (soft warm stone). Modern off-white stone floor.
- **Card BG:** `#FFFFFF` (white). Crisp white panels elevating content.
- **Card Mid:** `#F5F3E9` (soft warm gray/cream). Secondary interactive elements.
- **Line:** `#E5E1D3` (thin warm line). Subtle separations and hairline borders.
- **Ink / Main Text:** `#3C3836` (dark1). Dark charcoal tone for high-contrast reading.
- **Ink Soft:** `#504945` (dark2). Muted text hierarchy.
- **Accent:** `#B57614` (neutral_yellow/gold). Anchors active elements.
- **Accent Hot:** `#AF3A03` (neutral_orange). Hover focus and state highlights.

### GitHub Activity contributions
Contribution cells map directly to the theme's colors via dynamic variables:
- **Level 0:** `var(--contrib-0)` (quiet off-state: `#32302f` in dark, `#f0ede1` in light)
- **Level 1:** `var(--contrib-1)` (low activity: `#3a4d2e` in dark, `#c1cc8a` in light)
- **Level 2:** `var(--contrib-2)` (medium-low activity: `#597a3a` in dark, `#9baf69` in light)
- **Level 3:** `var(--contrib-3)` (medium-high activity: `#87b04f` in dark, `#728f46` in light)
- **Level 4:** `var(--contrib-4)` (high activity: `#b8bb26` in dark, `#496b24` in light)

## Layout & Space

Spacing operates on a strict geometric scale to maintain consistency:
- **xs (8px) / sm (12px):** Internal element spacing (e.g., tag padding, icons).
- **md (16px) / lg (24px):** Card margins, list gap sizes, and grid offsets.
- **xl (32px) / xxl (48px):** Section padding, large column offsets.
- **section (80px - 120px):** Vertical space separating major functional sections.

### Breakpoints
- **Mobile (< 768px):** Navigation transitions to a full-screen sheet overlay using CSS Grid and transitions. Grids collapse to 1-column layouts, and horizontal paddings shrink to `16px`.
- **Tablet (768px - 1024px):** 2-column grids for content displays.
- **Desktop (> 1024px):** Multi-column structured layouts with horizontal spacing capping content width at `1280px` for optimal reading spans.

## Elevation & Depth

No harsh shadows are used. Depth is established through flat, structured layers:
- **Base Canvas:** The deepest layer (`var(--bg)`).
- **Elevated Cards:** Resting container panels (`var(--card)`).
- **Interactive Surfaces:** Elements that react on hover (`var(--card-mid)`), transitioning smoothly on cursor entry.

## Do's and Don'ts

### Do
- Use semantic variables (`var(--accent)`, `var(--card)`) for styling, ensuring seamless light/dark toggles.
- Keep the ambient blurred background blobs subtle (`opacity: 0.08` equivalent) using translucent variations of yellow and aqua.
- Maintain `@media print` targets in strict black (`#000000`) and white (`#ffffff`) for crisp paper compilation.

### Don't
- Never hardcode hexadecimal colors inside individual Astro templates.
- Don't use raw emojis for UI decoration; instead, implement clean Lucide SVG icons.
- Avoid aggressive drop-shadow effects; depth must rely on flat color blocks and hairline borders.
