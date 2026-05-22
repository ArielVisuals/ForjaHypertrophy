# Design System — FORJA

## Theme

**Dark.** Always. The user is in a gym or coming from one. The ambient is low light. The dark background (#0A0A0B, near-black with a trace of blue) is not an aesthetic choice — it's the correct answer for the physical context. It also communicates: this is a precision instrument, not a consumer app.

## Color Palette

### Base Surfaces

| Token | Value | Usage |
|---|---|---|
| `bg-void` | `oklch(7% 0.008 260)` | Page background — the absolute base |
| `bg-surface` | `oklch(10% 0.008 260)` | Cards, panels, raised surfaces |
| `bg-elevated` | `oklch(13% 0.009 260)` | Inputs, hover states, secondary surfaces |
| `bg-overlay` | `oklch(16% 0.01 260)` | Modals, dropdowns, toasts |

### Accent System

| Token | Value | Usage |
|---|---|---|
| `accent-blue` | `oklch(58% 0.2 265)` | Primary CTA, active states, data highlights |
| `accent-blue-dim` | `oklch(58% 0.2 265 / 0.15)` | Subtle blue tints, hover states |
| `accent-emerald` | `oklch(65% 0.18 165)` | Success, PRs, positive delta, protein |
| `accent-orange` | `oklch(70% 0.18 55)` | Warnings, carbs, energy metrics |
| `accent-purple` | `oklch(62% 0.2 300)` | Biofeedback, recovery, sleep data |
| `accent-red` | `oklch(58% 0.22 25)` | Destructive actions, high stress, alerts |

### Text Scale

| Token | Value | Usage |
|---|---|---|
| `text-primary` | `oklch(95% 0.005 260)` | Headings, key numbers |
| `text-secondary` | `oklch(70% 0.01 260)` | Body, supporting info |
| `text-muted` | `oklch(45% 0.01 260)` | Labels, timestamps, tertiary |
| `text-ghost` | `oklch(30% 0.008 260)` | Placeholders, decorative text |

### Color Strategy: Restrained

One accent (blue) carries all primary actions and states. Secondary accents (emerald, orange, purple) are assigned semantically to data categories — they never appear decoratively. The dark base uses near-zero chroma to keep all accent colors vivid by contrast.

## Typography

**Single typeface.** The system uses whatever sans-serif is in the stack, pushed through extreme weight and tracking contrast to create hierarchy.

```css
/* Scale — not a fluid scale, deliberate jumps */
--text-xs: 0.625rem;    /* 10px — labels, badges, tracking-widest */
--text-sm: 0.75rem;     /* 12px — supporting text */
--text-base: 0.875rem;  /* 14px — body */
--text-lg: 1.25rem;     /* 20px — section headings */
--text-xl: 1.5rem;      /* 24px — card titles */
--text-2xl: 2rem;       /* 32px — page headings */
--text-hero: 4.5rem;    /* 72px — primary metrics */
--text-display: 7rem;   /* 112px — splash numbers */
```

**Weight system:**
- `font-black` (900): Primary numbers, hero metrics, CTAs
- `font-bold` (700): Section labels, card titles
- `font-medium` (500): Body text, descriptions

**Tracking system:**
- `.tracking-tighter` (`-0.04em`): Hero numbers, display sizes
- `.tracking-widest` (`0.2em+`): ALL CAPS labels, category tags
- Default: standard tracking for body text

**Casing rule:** Labels and category tags are always `text-[9-11px] font-black uppercase tracking-[0.25em+]`. Numbers are never uppercase-transformed.

## Spacing & Layout

**Base unit:** 4px. Everything is a multiple of 4.

**Card padding scale:**
- Compact: `p-6` (24px) — dense data tables, log entries
- Standard: `p-8` (32px) — secondary cards
- Generous: `p-10` (40px) — primary cards
- Expansive: `p-12` (48px) — feature cards, hero sections

**Border radius:**
- Small: `rounded-xl` (12px) — inputs, badges, buttons
- Medium: `rounded-2xl` (16px) — secondary cards, pills
- Large: `rounded-3xl` (24px) — primary cards
- Feature: `rounded-[3rem]` (48px) — hero cards, main panels
- Full: `rounded-full` — avatars, indicators

**Grid rhythm:**
- Dashboard: 4-col, gap-6
- Content: 3-col max, gap-8
- Feature sections: 2-col, gap-12

## Elevation & Depth

FORJA uses border + subtle glow for elevation, not shadows:

```css
/* Resting state */
border: 1px solid oklch(100% 0 0 / 0.08);

/* Active / focused */
border: 1px solid oklch(58% 0.2 265 / 0.4);
box-shadow: 0 0 40px -8px oklch(58% 0.2 265 / 0.25);

/* PR / achievement state */
border: 1px solid oklch(65% 0.18 165 / 0.4);
box-shadow: 0 0 50px -12px oklch(65% 0.18 165 / 0.2);
```

## Motion

**Principle:** Motion communicates state, not decoration. Every animation has a purpose.

```ts
// Page transitions
{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }

// Tab switches
{ initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } }

// Entry animations (list items)
{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: index * 0.05 } }

// PR celebration
{ scale: [1, 1.08, 1], transition: { duration: 0.5, ease: "easeOut" } }
```

**Always respect:** `prefers-reduced-motion` — wrap all Framer Motion variants with a motion value check.

## Components

### Stat Card
Primary data display. Uses `NumberTicker` for values. Never uses hero-metric template (big number + small label + gradient). Adds a serial index `(01)`, semantic label, number, and one-line context description.

### Tab Switcher
`p-1 bg-white/5 border border-white/10 rounded-2xl` container. Active tab: `bg-blue-600 text-white`. Inactive: `text-white/40 hover:text-white`. Text: `text-[10px] font-black tracking-[0.2em]`.

### Input Field
`bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white`. On focus: `border-blue-500/50`. Never a visible label inside the field — always above, `text-[10px] font-black text-white/40 uppercase tracking-widest`.

### Progress Bar
`h-1.5 bg-white/5 rounded-full`. Fill with semantic color + glow: `shadow-[0_0_15px_rgba(color,0.5)]`. Never taller than 2px for inline use.

### Badge
`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest`. Color matches the semantic category (blue for active/info, emerald for success, orange for warning).

### Ghost Button (Add Item)
`border-2 border-dashed border-white/10 rounded-[3rem]`. On hover: `border-blue-500/30`. Always uses `text-[10px] font-black text-white/20 uppercase tracking-[0.4em]`.

### Primary CTA Button
`bg-blue-600 text-white rounded-[2rem] py-5 font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/20`. Hover: `bg-blue-500`. Active: `scale-[0.98]`.
