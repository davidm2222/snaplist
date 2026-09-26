# SnapList — Plan

Future work only. Shipped work moves to [CHANGELOG.md](./CHANGELOG.md).

**Theme for this round:** SnapList works well once you're in it, but it's "another place to go." Reduce friction by meeting capture and retrieval where I already am — the Android share menu and Claude — and keep the app UI for browsing.

---

## Now

### 1. Android share target — verify on device
Code shipped (see CHANGELOG). Remaining:

- [ ] Re-install the PWA on the phone to pick up the manifest change; test from Maps, Chrome, YouTube, and a plain-text share

### 2. Smarter URL parsing
Today `/api/parse-url` reads `<title>`/OG tags from a server-side fetch. JS-rendered or bot-blocking sites return junk — Google Maps returns just "Google Maps", so the note is useless.

- [ ] Accept optional shared `title`/`text` in the request and pass it to the classifier (SnapList already captures it from the share)
- [ ] Read the final URL after redirects (`res.url`), not just the original
- [ ] Site extractors for the worst offenders:
  - Google Maps: short links redirect to `/maps/place/<Name>,+<street>,+<town>,+<ST>+<zip>/data=...` — name and full address are in the path (coords not always present); shelf `eat`/`do`. Test link: `https://maps.app.goo.gl/pCwde1bhyiEmYtEn7` (Coco Ramen, Newton Centre)
  - YouTube: oEmbed endpoint for title/channel
  - Amazon: product name from URL slug
- [ ] Detect generic metadata (title equals site name, etc.) and let Claude infer from URL + shared text instead
- [ ] Test with real links collected from actual sharing

*Why:* Garbage titles undermine trust in the AI capture path.

---

## Next

### 3. Location as a first-class field
`location` is currently just a free-form `key:value` with no special meaning.

- [ ] Decide representation: town/neighborhood string, coordinates, or both
- [ ] Auto-fill from Maps extractor (coords → town via reverse geocoding or Claude)
- [ ] Show on cards; make it searchable/filterable
- [ ] Optional: backfill existing eat/do notes

*Why:* Enables "what's on my list near Needham?" — both in the app and via Claude.

### 4. Claude connector (remote MCP server)
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
