# SnapList Enhancements

## Planned

### Migrate to Vercel
GitHub Pages limits the app to static export only (no API routes, no SSR, no middleware). Move to Vercel for preview deploys, edge CDN, and the ability to incrementally adopt server features when needed.

## Completed

### Add category selector to edit modal
The edit modal now shows a row of category buttons (with icons) at the top. Selecting a different category updates `tags` on save, so miscategorized notes can be fixed without deleting and re-creating.

### Fix "Other" tab showing no results
Added `resolveCategory()` helper that safely handles undefined, empty, or unrecognized `tags` values — all map to 'other'. Both counting and filtering use the same function, so the tab count and list always agree.

### Fix "Other" cards visual identity
Gave "other" a real indigo color identity (border + badge) instead of neutral zinc/gray, so it looks intentional alongside the other vivid category colors (amber, rose, sky, etc.).

### Compact view
Single-line note entries with toggle button. Shows icon, title, category badge, first hashtag, and timestamp. Click row to edit. Tighter spacing (space-y-1) in compact mode.

### Fix category tabs overflow
Desktop: tabs wrap to 2 rows so nothing gets cut off. Mobile: horizontal scroll preserved (single row) to avoid too many rows on narrow screens.

### UI design refresh
- Source Serif 4 serif font for titles/brand
- Amber accent color replacing violet/purple (better dark mode contrast)
- Consistent SVG line icons replacing emoji category icons
- Color-coded left accent bars on NoteCards per category
- Per-category colored badges
- Teal hashtag color for differentiation
- Improved dark mode text contrast
- Tighter card spacing for info density
