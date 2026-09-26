# Changelog

What shipped and why, newest first. Future work lives in [PLAN.md](./PLAN.md).

---

## 2026-09-25 — Android share target

- **SnapList in the Android share sheet.** The app was "another place to go"; now any app's Share → SnapList opens it with the link. The manifest registers a GET `share_target` on `/`; `SnapList` reads `title`/`text`/`url` once at mount (apps often put the link inside `text`), opens the URL review flow, or pre-fills the input for plain-text shares. Params survive the sign-in screen and are cleared from the address bar afterward.

## 2026-09-25 — Repo cleanup & docs restructure

After a few months of light use, reorganized the project docs to make the next round of work easier to pick up.

- Added `CLAUDE.md` (architecture, data-model gotchas, conventions) so AI sessions start with context instead of rediscovering it.
- Rewrote `README.md` — it still described type-based categories and GitHub Pages hosting.
- Split history out of `PLAN.md` into this changelog; PLAN is now forward-looking only.
- Committed `.env.local.example` (was gitignored) and added the server-only env vars.
- Removed the dead GitHub Pages workflow, default Next.js SVGs, and the old standalone import script.

## 2026-02-25 — Type labels & PWA

- **Type labels on notes.** The shelf redesign had discarded the input alias, so a book showed as "Read". Now `parseNote` keeps it as `type` and cards show "Book", "Article", "Movie". Legacy notes fall back to their old `tags[0]`. Edit modal gained a per-shelf Type picker.
- **Installable PWA.** Manifest + app icon so SnapList can live on the phone home screen. Icon went through a binder-clip draft before settling on an "S" with motion lines.

## 2026-02-23 — Done status & UX spec

- **Mark as done.** Completed items were cluttering the list, but deleting felt too permanent for a "long-term memory" app. Added a `done` flag, a check button on cards, and a collapsed "Completed (N)" section. Tab counts only include active notes. No migration: missing `done` means active.
- **UX-SPEC.md.** Wrote down the problem, goals, anti-goals, flows, and key decisions so future changes can be checked against intent.

## 2026-02-22 — Vercel & AI URL parsing

- **Moved hosting from GitHub Pages to Vercel.** Static export couldn't run server code, and AI parsing needed a server to hold the Anthropic key.
- **`/api/parse-url`.** Paste a bare URL → the server fetches the page's `<head>`, extracts title/description/author with regex, and asks Claude Haiku only for shelf + hashtags. Kept AI to classification to stay fast and cheap.
- **Review flow.** AI suggestions open in `ReviewModal` for editing before saving; any failure falls back to manual entry.
- **Auth without a service account.** API routes verify the Firebase ID token via the Firebase REST API rather than `firebase-admin`.

## 2026-02-21 — Intent-based shelves & URLs

- **Shelves replace categories.** Books / Movies / Shows / Restaurants / Drinks / Activities became Read / Watch / Eat / Do / Buy / Other. The tab bar kept growing with each new type of thing; grouping by *intent* keeps it small. Old aliases still work as input, and existing notes are mapped at read time — no data migration.
- **Subtypes dropped** in favor of hashtags for granularity.
- **URLs as first-class.** A URL anywhere in the input is pulled into `fields.url` and rendered as a `domain.com ↗` link.

## 2026-02-06 — Design pass

- Serif titles (Source Serif 4), amber accent, SVG line icons instead of emoji, teal hashtags.
- Color-coded left accent bar per category, with dark-mode variants.
- Compact / expanded view toggle; tabs wrap on desktop and scroll on mobile.
- Category picker in the edit modal; fixed the "Other" tab filter.

## 2026-01-27 — SnapList v2

Rebuilt the earlier Supabase-backed app on Next.js + Firebase.

- Single text input parsed into category, title, `key:value` fields, and hashtags.
- Google sign-in, Firestore sync, category tabs with counts, global search, edit modal, dark mode.
- `/import` page to bring over the Supabase JSON export.
- Tappable autocomplete chip so suggestions work on mobile.
- Deployed to GitHub Pages as a static export (later replaced by Vercel).
