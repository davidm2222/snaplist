# SnapList — Plan

Future work only. Shipped work moves to [CHANGELOG.md](./CHANGELOG.md).

**Theme for this round:** SnapList works well once you're in it, but it's "another place to go." Reduce friction by meeting capture and retrieval where I already am — the Android share menu and Claude — and keep the app UI for browsing.

---

## Now

### Verify capture on device
Share target and smarter URL parsing shipped (see CHANGELOG). Remaining:

- [x] Share target shows up and opens the review flow (confirmed 2026-09-25)
- [x] Amazon → product name (confirmed 2026-09-26; titles are long but fine)
- [ ] Share from Maps → name + location filled; from YouTube → title + channel
- [ ] Collect any links that still produce junk titles and add extractors as needed

---

## Foundations (before new features)

F1–F4 shipped 2026-09-25/26 (see CHANGELOG). One step left:

- [ ] **Remove legacy `tags`** after a few days of normal use (F3 migration ran 2026-09-26): script to delete the field, drop the `tags[0]` fallback in `resolveShelf`/`resolveType`, stop writing `tags: [shelf]`; then delete the service account key.

*Scalability note:* loading all notes via a realtime listener is fine into the thousands; Firestore cost is negligible. Real risk only appears if the app opens to other users — which F1 covers.

---

## Next

### 1. Claude connector (remote MCP server)
Add and query notes from claude.ai (web, desktop, mobile) without opening the app.

- [ ] `/api/mcp` route on the existing Vercel app
- [ ] Tools: `add_note(text)` (reuses `parseNote`), `search_notes(query, shelf?, hashtag?, location?)` (match location with `locationKey`), `list_notes(shelf)`, `mark_done(id)`
- [ ] Auth: start with a long secret token in the connector URL; OAuth later if needed
- [ ] Server-side Firestore access — requires `firebase-admin` + service account (changes the current "no service account" pattern). Easier after F3: `add_note` reuses `saveNote`.
- [ ] Register as a custom connector in claude.ai settings

*Why:* Capture by just telling Claude; ask questions across the list conversationally. Cheap pre-test: export notes to a Google Doc and query it via the Drive connector for a week to see if the habit sticks.

---

## Later

- **Natural-language input** — sparkle button to AI-parse free-form text (not just URLs) into the review flow.

## Ideas (unscoped)

- **In-app "nearby" filter** — needs coordinates: a per-place lookup table (~30 places) filled once by a free geocoder. Claude can already answer "near Needham" from town names.
- **Location cleanup** — only 2 notes still say `… MA`; display and filters already treat them as the same place, so skipped for now.
- **Shorter Amazon titles** — trim after the first comma/dash if long product names start to bother.

- **Commas in typed titles** — `parseNote` ends the title at the first comma, so "Is It Aging, or Is It ADHD?" splits into title + notes. Options: quoted titles (`read: "Is It Aging, or Is It ADHD?"`), or only split on commas followed by `key:` / known structure. Decide, then add tests first.

- **Reader view (Instapaper-style)** — save the article text for Read → Article notes and show it clean (no ads, no nav) in the app for mobile reading. Would need the full page, not just `<head>`; Mozilla's Readability library does the extraction. Blocked or paywalled sites (The Atlantic) may only give a partial body; gift links might help. Also raises storage questions (Firestore 1 MB/doc limit).
- Email-in address for capture
- Richer status for Read/Watch (in progress, abandoned)
- Export of completed items ("books I read this year")
- Shopping: purchased toggle vs. quantity

## Open questions

- NL input: explicit sparkle button, auto-detect unstructured input, or both?
- MCP auth: is a secret-URL token acceptable long-term for a personal app?
- Sharing with others: any social layer, or does that violate the anti-bloat principle?
