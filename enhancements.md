# SnapList Enhancements

## Planned

### Migrate to Vercel
GitHub Pages limits the app to static export only (no API routes, no SSR, no middleware). Move to Vercel for preview deploys, edge CDN, and the ability to incrementally adopt server features when needed.

### Add category/resource type to edit modal
The edit modal shows title, fields, hashtags, and notes -- but not the category. If something was miscategorized (e.g., a movie tagged as a TV show), there's no way to fix it without deleting and re-creating. Add a category selector to the edit form.

## Completed

### Fix "Other" tab showing no results
Filter now uses `tags[0] || 'other'` fallback (matching counting logic) so notes with empty tags arrays appear under the Other tab.

### Fix "Other" cards mismatched left border
Changed accent from zinc-400 (too close to default border) to violet-400/500 for a distinct, intentional look.

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
