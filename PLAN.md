# SnapList — Plan

Future work only. Shipped work moves to [CHANGELOG.md](./CHANGELOG.md).

**Theme for this round:** SnapList works well once you're in it, but it's "another place to go." Reduce friction by meeting capture and retrieval where I already am — the Android share menu and Claude — and keep the app UI for browsing.

---

## Now

### Browse-first redesign
Mockup (agreed 2026-09-27): https://claude.ai/artifact/75Jeky6r8doTDjqzj8JDum (the "Dots" phone). The app is mostly for finding things, so the list gets the screen and capture moves behind a button. One commit per step:

- [ ] **R4 Been / Finished:** replace "Done" with a per-shelf label. Eat "Been here", Do "Did it": item stays in the list with a check by the place. Read "Read it", Watch "Watched", Buy "Bought": moves to a collapsed "Finished" section. Eat/Do filter gains Been: All / Not yet / Been. Same `done` field, no migration.
- [ ] **R5 Group by place:** Eat and Do get a "By place" sort that shows place headings with counts.

*Why:* the app felt utilitarian and cramped, the input took prime space, and "Done" made it feel like a task list when for restaurants and activities it's really "been there" metadata.

---

## Verify capture on device
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

- **Skip review for AI notes** — once natural-language capture is usually right, save directly with a "Saved to Read → Book · Edit" toast.
- **Cuisine filter** — cuisine is now a field on Eat; add it as a dropdown next to Type / Place.

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

- NL input trigger: auto-detect (no prefix → AI) shipped; switch to a sparkle button if it surprises.
- MCP auth: is a secret-URL token acceptable long-term for a personal app?
- Sharing with others: any social layer, or does that violate the anti-bloat principle?
