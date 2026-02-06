# SnapList Enhancements

## Planned

### Migrate to Vercel
GitHub Pages limits the app to static export only (no API routes, no SSR, no middleware). Move to Vercel for preview deploys, edge CDN, and the ability to incrementally adopt server features when needed.

### Add category/resource type to edit modal
The edit modal shows title, fields, hashtags, and notes -- but not the category. If something was miscategorized (e.g., a movie tagged as a TV show), there's no way to fix it without deleting and re-creating. Add a category selector to the edit form.

## Bugs

### "Other" tab shows no results
**Root cause:** Notes with empty `tags: []` arrays (e.g., from imports) get counted under "other" via the `note.tags[0] || 'other'` fallback in SnapList, but filtering uses `note.tags.includes('other')` which returns false for empty arrays. Counted but never shown.
**Fix:** Apply the same fallback logic in the filter, or backfill empty tags arrays with `['other']`.

### "Other" cards have mismatched left border
**Root cause:** Every category accent is a saturated color (amber-500, rose-500, sky-500, etc.) but "other" uses `zinc-400 dark:zinc-600`, which is too close to the default card border color and looks like a rendering glitch rather than an intentional accent.
**Fix:** Give "other" a more distinct accent color (e.g., slate-500 or indigo-400).

## Completed

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
