# Changelog

What shipped and why, newest first. Future work lives in [PLAN.md](./PLAN.md).

---

## 2026-09-26 — Location, part 1: parsing

- **`@place` shorthand:** `eat: sichuan gourmet @needham`. Matches places you've already used (so `@chestnut hill` works), otherwise one word.
- **`#tag` and `@place` end the title**, like a comma. Before, `sichuan gourmet #spicy food was great` put "food was great" into the title.
- **Locations are standardized:** saves drop a trailing home state ("Needham MA" → "Needham"), matching how most notes were already typed. Helpers treat `newton` / `Newton MA` as one place and capitalize for display.

## 2026-09-26 — F4: small fixes

- **Toasts.** Failures when adding, saving from review, marking done, deleting, or loading notes now show an error toast; before they only reached the browser console, so a failed save on the phone was invisible.
- **Delete with Undo.** Delete happens immediately with a 5-second "Note deleted · Undo" toast, replacing the `window.confirm` popup. Undo writes the note back under its original id, so it returns unchanged.
- Removed the one-time `/import` page (Supabase import is long done) and the unused Geist Mono font.
- Auth and notes loading state is derived instead of reset inside effects (fixes the two lint errors). Notes are tagged with their owner uid, so a previous account's notes can't flash after switching.
- Titles show exactly as typed. Cards used CSS `capitalize`, which turned "iPhone" into "IPhone".

## 2026-09-26 — F3: one save path

- **Every screen now saves the same way.** Typing, the review screen, and editing each build a structured `NoteDraft`; `useNotes` turns it into Firestore data in one function. Before, the review screen rebuilt a text string and re-parsed it (why commas broke fields) and the edit screen wrote raw updates (why `undefined` silently failed).
- `normalizeDraft()` does all cleanup in one tested place: canonical type, lowercase unique hashtags, no empty fields, no orphan commas.
- The app reads the explicit `shelf` field. New notes also write `tags: [shelf]` so reverting the code would still work.
- `raw` is now the original input only (typed text, or the shared URL), never updated after creation, and excluded from search — edited notes no longer match their old wording. Search now matches shelf and type names instead ("movie", "gift").

## 2026-09-26 — F3 data migration: explicit shelf

- Every note now has a `shelf` field, a canonical `type`, and `updatedAt`. Previously the shelf hid in `tags[0]`, and 81 of 119 notes still carried pre-redesign values (`movie`, `restaurant`, …) resolved at read time.
- Done with local admin scripts (`pnpm backup`, `pnpm migrate:shelf`): backup → dry run reviewed → apply → verify zero remaining. `tags` left untouched so the change can be rolled back by reverting code.
- `gift` became a Buy type; the 6 legacy gift notes moved from Other to Buy · Gift.
- Follow-up run: backfilled 1 note saved by a cached old app version, and cleaned orphan commas out of 8 notes' text (", , fabulous falafel").

## 2026-09-25 — Foundations F2: tests, shared notes module, one type list

- **Vitest + 54 unit tests** for the parser, URL extractors, and shelf/type logic. Written first as characterization tests so the refactor couldn't silently change behavior.
- **`src/lib/notes.ts`** now owns shelf/type/search logic. Removed 4 copies of the shelf list, 3 copies of the legacy map, and two unused (one buggy) hook functions — 144 lines gone.
- **One type list.** `CATEGORIES` defines each shelf's types and their synonyms; the parser and the edit picker both read it. Synonyms store the main type (`film:` → movie, `beer:` → drink) so the same thing isn't labeled three ways. Older notes normalize at display time.

## 2026-09-25 — Security: rules in repo + API allowlist

- Reviewed live Firestore rules: already owner-only (not test mode). Tightened updates so a note can't be reassigned to another `userId`, and committed them as `firestore.rules` so they're versioned.
- `/api/parse-url` now requires the caller's UID to be in `ALLOWED_UIDS`. Any Google account could sign in, and the route spends Anthropic credit and fetches arbitrary URLs server-side.

## 2026-09-25 — Fix edit Save doing nothing

- Editing a note with no `type` sent `type: undefined`, which Firestore rejects; the error was only logged, so Save silently did nothing. `updateNote` now turns `undefined` into a field delete, and the edit modal shows an error if a save fails. Saving an edit also cleans orphan commas out of old notes.

## 2026-09-25 — Shelf-aware review fields + notes

- The URL review screen always showed Author and Site — leftovers from when it was built for articles, meaningless for a restaurant. Fields now follow the shelf (Read → author, Watch → channel, Eat/Do → location) plus anything the parser filled in. Dropped Site: the card already shows the domain.
- Added a Notes box to the review screen; it was never there, so shared links couldn't carry a "why I saved this".

## 2026-09-25 — Fix leading comma in notes

- Notes after a `key:value` field started with ", " because removing the field left its comma behind. Parser now drops empty comma segments; cards clean up old saved notes at display time rather than migrating.

## 2026-09-25 — Smarter URL parsing

- **Maps, YouTube, and Amazon links now produce real titles.** These sites return generic metadata ("Google Maps") to a server fetch. `/api/parse-url` now follows redirects and runs site extractors (`src/lib/urlExtractors.ts`): Maps name + address from the place URL path, YouTube title + channel via oEmbed, Amazon product name from the URL slug. Generic titles are detected and ignored.
- **Shared text as context.** Text the Android share sheet sends alongside a link is passed to the classifier, which can now also name the thing and suggest a location.
- **`location` field convention.** Stored as `Town ST` (e.g. `Newton Centre MA`) — comma-free because the parser splits fields on commas. Editable in the review modal. Chose text over coordinates: readable, and enough for Claude to reason about "near X".

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
