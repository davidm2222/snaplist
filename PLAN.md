# SnapList — Plan

Future work only. Shipped work moves to [CHANGELOG.md](./CHANGELOG.md).

**Theme for this round:** SnapList works well once you're in it, but it's "another place to go." Reduce friction by meeting capture and retrieval where I already am — the Android share menu and Claude — and keep the app UI for browsing.

---

## Now

### Verify capture on device
Share target and smarter URL parsing shipped (see CHANGELOG). Remaining:

- [x] Share target shows up and opens the review flow (confirmed 2026-09-25)
- [ ] Share from Maps → name + location filled; from YouTube → title + channel; Amazon → product name
- [ ] Collect any links that still produce junk titles and add extractors as needed

---

## Next

### 1. Location as a first-class field
Decided: plain `Town ST` text (no commas — the parser splits fields on commas). Coordinates later only if a map view is wanted. Already auto-filled for Maps links and by the classifier when the shared text says where something is.

- [ ] Give `location` special display on cards (like `url`) instead of a generic chip
- [ ] Filter by location in the UI
- [ ] Optional: backfill existing eat/do notes

*Why:* Enables "what's on my list near Needham?" — both in the app and via Claude.

### 2. Claude connector (remote MCP server)
Add and query notes from claude.ai (web, desktop, mobile) without opening the app.

- [ ] `/api/mcp` route on the existing Vercel app
- [ ] Tools: `add_note(text)` (reuses `parseNote`), `search_notes(query, shelf?, hashtag?, location?)`, `list_notes(shelf)`, `mark_done(id)`
- [ ] Auth: start with a long secret token in the connector URL; OAuth later if needed
- [ ] Server-side Firestore access — requires `firebase-admin` + service account (changes the current "no service account" pattern)
- [ ] Register as a custom connector in claude.ai settings

*Why:* Capture by just telling Claude; ask questions across the list conversationally. Cheap pre-test: export notes to a Google Doc and query it via the Drive connector for a week to see if the habit sticks.

---

## Later

- **Natural-language input** — sparkle button to AI-parse free-form text (not just URLs) into the review flow.
- **Consolidate `LEGACY_CATEGORY_MAP`** — currently duplicated in `SnapList.tsx`, `NoteCard.tsx`, `EditModal.tsx`.
- **Pre-existing lint error** — `useNotes.tsx` calls `setNotes([])` synchronously in an effect (`react-hooks/set-state-in-effect`).
- **Edit doesn't update `raw`** — search includes `raw`, so edited notes can still match their old text.
- **Parser tests** — small unit test suite for `parseNote` before it grows further.

## Ideas (unscoped)

- Email-in address for capture
- Richer status for Read/Watch (in progress, abandoned)
- Export of completed items ("books I read this year")
- Shopping: purchased toggle vs. quantity

## Open questions

- NL input: explicit sparkle button, auto-detect unstructured input, or both?
- MCP auth: is a secret-URL token acceptable long-term for a personal app?
- Location: store coordinates, or is a town name enough?
- Sharing with others: any social layer, or does that violate the anti-bloat principle?
