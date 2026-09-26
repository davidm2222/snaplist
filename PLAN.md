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

## Foundations (before new features)

From a full code review on 2026-09-25. The app works, but its data model grew by patching and the code works around it: the shelf hides in `tags[0]` with legacy values, there are three different save paths, and logic is duplicated across components. Most recent bugs (orphan commas, silent edit failure, stale `raw`) trace back to this. Do these in order.

### F1. Security
- [ ] **Firestore rules:** review the live rules (Firebase console → Firestore → Rules). If in test mode, anyone with the project ID can read/write every note. Target: a user can only read/write docs where `userId == request.auth.uid`, and can't change `userId`.
- [ ] Commit rules to the repo (`firestore.rules`) so they're versioned and reviewable
- [ ] **API allowlist:** any Google account can sign in and call `/api/parse-url` (spends Anthropic credit, server fetches arbitrary URLs). Add `ALLOWED_UIDS` env var checked after token verification.

### F2. Shared notes module + parser tests
- [ ] `src/lib/notes.ts` — single source for the shelf list, type list per shelf, legacy shelf resolution, search. Replaces ~8 duplicated snippets (shelf set ×4, `LEGACY_CATEGORY_MAP` ×3, resolve functions ×3, search ×2).
- [ ] Unify `TYPE_OPTIONS` (EditModal) with aliases in `CATEGORIES`
- [ ] Delete unused `getNotesByCategory` (also buggy for legacy tags) and `searchNotes` in `useNotes`
- [ ] Add Vitest; unit tests for `parseNote` (fields, commas, URLs, aliases, hashtags) and `urlExtractors`

### F3. Data model migration + single save path
Target model — each layer has one job:

| Layer | Job | Example |
|---|---|---|
| **Shelf** | Why you saved it (the tabs) | Eat |
| **Type** | What it *is* — one per note, small fixed vocabulary per shelf | Cafe |
| **Hashtags** | Free descriptors, any number | #ramen #datenight |
| **Fields** | Structured data the app *uses* (`url`, `location`, `author`, `channel`) + free user labels | location: Newton MA |

- [ ] Add explicit `shelf` field and `updatedAt`; normalize `type`
- [ ] One-time migration script: `tags[0]` → `shelf` + `type`; dry-run preview before writing
- [ ] One write path: `saveNote(draft)` takes a structured note. The parser only converts typed text → draft. ReviewModal builds a draft directly (no rebuild-a-string-and-reparse), EditModal uses the same path.
- [ ] Decide `raw`: keep as "original input" (excluded from search) or drop
- [ ] Remove legacy maps and comma workarounds once migrated

### F4. Error handling & small UX fixes
- [ ] Toast component; surface failures from add / review save / delete / `useNotes.error` (all currently console-only)
- [ ] Delete: replace `window.confirm` with an Undo toast
- [ ] Compact card uses CSS `capitalize` on titles — "iPhone" renders "IPhone"
- [ ] Fix pre-existing lint error: `useNotes.tsx` sets state synchronously in an effect
- [ ] Remove `/import` page (one-time Supabase import, done) and unused Geist Mono font

*Scalability note:* loading all notes via a realtime listener is fine into the thousands; Firestore cost is negligible. Real risk only appears if the app opens to other users — which F1 covers.

---

## Next

### 1. Location as a first-class field
Decided: plain `Town ST` text (no commas — the parser splits fields on commas). Coordinates later only if a map view is wanted. Already auto-filled for Maps links and by the classifier when the shared text says where something is.

- [ ] Give `location` special display on cards (like `url`) instead of a generic chip
- [ ] Filter by location in the UI (alongside type filter within a shelf, and sort options: newest / A–Z)
- [ ] Optional: backfill existing eat/do notes

*Why:* Enables "what's on my list near Needham?" — both in the app and via Claude.

### 2. Claude connector (remote MCP server)
Add and query notes from claude.ai (web, desktop, mobile) without opening the app.

- [ ] `/api/mcp` route on the existing Vercel app
- [ ] Tools: `add_note(text)` (reuses `parseNote`), `search_notes(query, shelf?, hashtag?, location?)`, `list_notes(shelf)`, `mark_done(id)`
- [ ] Auth: start with a long secret token in the connector URL; OAuth later if needed
- [ ] Server-side Firestore access — requires `firebase-admin` + service account (changes the current "no service account" pattern). Easier after F3: `add_note` reuses `saveNote`.
- [ ] Register as a custom connector in claude.ai settings

*Why:* Capture by just telling Claude; ask questions across the list conversationally. Cheap pre-test: export notes to a Google Doc and query it via the Drive connector for a week to see if the habit sticks.

---

## Later

- **Natural-language input** — sparkle button to AI-parse free-form text (not just URLs) into the review flow.

## Ideas (unscoped)

- Email-in address for capture
- Richer status for Read/Watch (in progress, abandoned)
- Export of completed items ("books I read this year")
- Shopping: purchased toggle vs. quantity

## Open questions

- NL input: explicit sparkle button, auto-detect unstructured input, or both?
- MCP auth: is a secret-URL token acceptable long-term for a personal app?
- Location: store coordinates, or is a town name enough?
- `raw`: keep original input for reference, or drop it after F3?
- Sharing with others: any social layer, or does that violate the anti-bloat principle?
