# UI Design Inspiration Reference

Use this document as a design language reference when building user interfaces. It captures a cohesive aesthetic drawn from a polished productivity app. Don't replicate it literally — use it as a foundation to inform visual decisions.

---

## Design Philosophy

**Modern minimalist with glassmorphic accents and typography-driven hierarchy.**

The overall tone is professional yet approachable — sophisticated without being fussy. Information is scannable, interactions are smooth, and color is used purposefully rather than decoratively.

Core principles:
- Generous whitespace; let content breathe
- Neutral base palette with vibrant category/accent colors for personality
- Typography creates hierarchy (serif for headings, sans-serif for body)
- Subtle animations (0.3s ease-out) that feel natural, never flashy
- Rounded corners throughout for a friendly, non-corporate feel
- Frosted glass (backdrop-blur) for layered depth on sticky/overlay elements

---

## Color System

### Base Palette (Zinc neutrals)
- **Light background**: `#fafafa` — near-white, warm
- **Light foreground**: `#171717` — near-black
- **Dark background**: `#0a0a0b` — deep charcoal, not pure black
- **Dark foreground**: `#f0f0f0` — soft off-white

Use a full zinc/neutral gray scale for surfaces, borders, and secondary text. Avoid pure black/white — the slight warmth makes everything feel more refined.

### Accent Color
- **Primary accent**: Amber (`#F59E0B` light / `#FBBF24` dark)
- Used for: focus rings, active states, primary buttons, brand touches, loading spinners
- Amber reads as warm, energetic, and optimistic without the urgency of red or the coldness of blue

### Category/Semantic Colors
Use a curated set of distinct hues for categorization. Each gets a left-border accent on cards and a soft badge treatment:

| Purpose | Hue | Light badge | Dark badge |
|---------|-----|-------------|------------|
| Primary | Amber | `bg-amber-100 text-amber-700` | `bg-amber-900/30 text-amber-400` |
| Urgent/Media | Rose | `bg-rose-100 text-rose-700` | `bg-rose-900/30 text-rose-400` |
| Info/Content | Sky | `bg-sky-100 text-sky-700` | `bg-sky-900/30 text-sky-400` |
| Warm secondary | Orange | `bg-orange-100 text-orange-700` | `bg-orange-900/30 text-orange-400` |
| Tags/Labels | Teal | `bg-teal-100 text-teal-600` | `bg-teal-900/30 text-teal-400` |
| Success/Nature | Emerald | `bg-emerald-100 text-emerald-700` | `bg-emerald-900/30 text-emerald-400` |
| Neutral accent | Indigo | `bg-indigo-100 text-indigo-600` | `bg-indigo-900/30 text-indigo-400` |

**Badge pattern**: Light mode uses `100`-level bg + `600-700` text. Dark mode uses `900/30` (30% opacity) bg + `400` text. This creates soft, readable badges in both themes.

### Dark Mode Strategy
- Every surface/color has a dark counterpart — no afterthought dark mode
- Colors lighten in dark mode (e.g., `amber-500` becomes `amber-400`) to maintain contrast
- Backgrounds shift from white/gray-100 to zinc-900/zinc-800
- Borders shift from zinc-200 to zinc-800
- Use `prefers-color-scheme` or a manual toggle

---

## Typography

### Font Stack
- **Headings**: A quality serif font (e.g., Source Serif 4, Lora, Playfair Display) — weights 400/600/700
- **Body**: A clean geometric sans-serif (e.g., Geist, Inter, Plus Jakarta Sans)
- **Monospace** (optional): For technical content (e.g., Geist Mono, JetBrains Mono)

### Scale & Usage
| Element | Size | Weight | Font | Extras |
|---------|------|--------|------|--------|
| Page title | `text-3xl` (30px) | Bold | Serif | `tracking-tight` |
| Section heading | `text-xl` (20px) | Semibold | Serif | — |
| Modal title | `text-lg` (18px) | Semibold | Serif | — |
| Body text | `text-sm` (14px) | Normal | Sans | `leading-relaxed` |
| Input text | `text-base` (16px) | Normal | Sans | — |
| Labels/meta | `text-xs` (12px) | Medium | Sans | — |
| Tiny badges | `11px` | Medium | Sans | — |

### Typography Character
- Serif headings create elegance and visual variety against sans-serif body
- `tracking-tight` on titles feels confident and modern
- `tabular-nums` on timestamps/counts for consistent alignment
- `leading-relaxed` on body text for comfortable reading

---

## Spacing & Layout

### Container
- Max width: `max-w-3xl` (896px) — content-focused, not sprawling
- Centered: `mx-auto`
- Horizontal padding: `px-4` (16px)
- Full height: `min-h-screen`

### Spacing Scale
- Between sections: `space-y-5` (20px)
- Between related items: `space-y-2` or `space-y-3` (8-12px)
- Between tight items (list rows): `space-y-1` (4px)
- Horizontal gaps: `gap-1` to `gap-3` (4-12px)

### Component Padding
- Cards: `p-4` (16px)
- Modals: `p-6` to `p-8` (24-32px)
- Inputs: `px-4 py-2.5` to `px-4 py-3` (16px x 10-12px)
- Buttons: `py-1.5` to `py-2` (6-8px)

---

## Borders & Corners

### Border Radius
- **Cards/Inputs**: `rounded-lg` (8px) or `rounded-xl` (12px)
- **Modals/Containers**: `rounded-2xl` (16px)
- **Badges/Pills**: `rounded-full` (50%)

The progression from 8px to 16px creates visual hierarchy — larger, more prominent elements get rounder corners.

### Borders
- Standard: 1px solid, `zinc-200` (light) / `zinc-800` (dark)
- Category accent: 3px left border on cards for quick visual scanning
- Dividers: `border-t` with `zinc-100` / `zinc-800`
- Focus: `ring-2` in amber accent color

---

## Visual Effects

### Glassmorphism (key signature effect)
- **Sticky header**: `bg-white/80 backdrop-blur-lg` (80% white + strong blur)
- **Modal overlay**: `bg-black/50 backdrop-blur-sm` (50% black + subtle blur)
- Creates a sense of layered depth without heavy shadows

### Shadows
- Minimal use — shadows are subtle, not dramatic
- `shadow-sm` on active tabs
- `shadow-xl` on modals (only elevated elements)
- No box shadows on cards by default — borders do the work

### Animations
- **Duration**: 0.3s (consistent throughout)
- **Easing**: `ease-out` (fast start, gentle stop)
- **Entry animations**: Fade in + slide up from bottom (16px translateY)
- **Hover transitions**: `transition-colors` for color changes, `transition-all` for more complex states
- **Tactile feedback**: `active:scale-95` on pressable elements (subtle press-in)
- **Loading**: Spinning border animation in accent color

### Opacity
- Semi-transparent surfaces: 80% for headers, 50% for overlays, 30% for dark-mode badge backgrounds
- Disabled state: `opacity-50` + `cursor-not-allowed`

---

## Component Patterns

### Cards
- White/zinc-900 background with 1px border
- 3px colored left border for categorization
- 8-12px border radius
- 16px internal padding
- Header: icon + title (serif, semibold) + badge + timestamp
- Content: field badges, tag pills, body text
- Footer: divider + action buttons (edit/delete)

### Inputs
- Rounded-xl (12px), generous padding
- Background: `zinc-100` (light) / `zinc-900` (dark)
- On focus: background shifts to white/zinc-800 + amber ring appears
- Search: left-aligned icon, right-aligned clear button
- Text input: right-aligned submit button (amber bg, white text)

### Tab/Filter Bar
- Container: `rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1`
- Active tab: `bg-white dark:bg-zinc-800 shadow-sm`
- Inactive: transparent, muted text, hover brightens
- Count badges: amber-tinted when active, gray when inactive
- Horizontally scrollable with hidden scrollbar

### Modals
- Centered overlay with `backdrop-blur-sm` on dark scrim
- `rounded-2xl`, `shadow-xl`, generous padding (24-32px)
- Enter animation: fade + slide up
- Action row: Cancel (bordered/ghost) + Submit (amber solid)
- Form fields match input styling

### Buttons
- Primary: Amber background, white text, hover darkens
- Secondary/Ghost: Transparent/bordered, zinc text
- Destructive hover: Red tones
- All transitions smooth with `transition-colors`
- Disabled: 50% opacity

### Badges/Tags
- Rounded-full (pill shape)
- Small: `text-xs px-2 py-0.5`
- Soft color: low-opacity background + medium-saturation text
- Category badges use their respective hue
- Tags (hashtags) use teal

---

## Iconography

- **Style**: Outlined/stroked, not filled
- **Stroke width**: 1.75px (slightly thicker than hairline, thinner than bold)
- **Line caps**: Round
- **Line joins**: Round
- **Color**: Inherits from parent text (`currentColor`)
- **Sizes**: 12px (tiny), 14px (compact), 16px (standard), 32px (empty states)

This creates icons that feel hand-drawn and friendly while remaining crisp and legible.

---

## Summary of Key Design Signatures

1. **Zinc neutral base + warm amber accent** — gives everything a cohesive, warm feel
2. **Serif headings + sans-serif body** — instant sophistication with minimal effort
3. **Glassmorphic sticky header** — modern depth without heavy shadows
4. **3px colored left borders on cards** — efficient visual categorization
5. **Soft badge pattern** (low-opacity bg + medium text) — readable, non-distracting labels
6. **0.3s ease-out animations** — everything moves but nothing distracts
7. **Rounded-xl inputs and containers** — friendly and modern
8. **Purposeful dark mode** — not inverted, independently designed with adjusted contrast
9. **Minimal shadow use** — borders and background shifts do the heavy lifting
10. **Consistent micro-interactions** — hover brightening, focus rings, active press-in
