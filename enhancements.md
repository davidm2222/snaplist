# SnapList Enhancements

## Planned

### Migrate to Vercel
GitHub Pages limits the app to static export only (no API routes, no SSR, no middleware). Move to Vercel for preview deploys, edge CDN, and the ability to incrementally adopt server features when needed.

## Completed

### Add category selector to edit modal
The edit modal now shows a row of category buttons (with icons) at the top. Selecting a different category updates `tags` on save, so miscategorized notes can be fixed without deleting and re-creating.

### Fix "Other" tab showing no results
Filter now uses `tags[0] || 'other'` fallback (matching counting logic) so notes with empty tags arrays appear under the Other tab.

### Uniform left border accent
Replaced per-category color-coded left borders with a single amber accent for all cards. Eliminates the visual inconsistency where "other" cards looked different (went through zinc → violet → slate before settling on one uniform color).

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
