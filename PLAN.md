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
- [x] **Firestore rules:** review the live rules (Firebase console → Firestore → Rules). If in test mode, anyone with the project ID can read/write every note. Target: a user can only read/write docs where `userId == request.auth.uid`, and can't change `userId`.
- [x] Commit rules to the repo (`firestore.rules`) so they're versioned and reviewable
- [x] **API allowlist:** any Google account can sign in and call `/api/parse-url` (spends Anthropic credit, server fetches arbitrary URLs). Add `ALLOWED_UIDS` env var checked after token verification.
- [x] Publish tightened rules in Firebase console; set `ALLOWED_UIDS` in Vercel + `.env.local`

### F2. Shared notes module + parser tests
- [x] `src/lib/notes.ts` — single source for the shelf list, type list per shelf, legacy shelf resolution, search. Replaces ~8 duplicated snippets (shelf set ×4, `LEGACY_CATEGORY_MAP` ×3, resolve functions ×3, search ×2).
- [x] Unify `TYPE_OPTIONS` (EditModal) with aliases in `CATEGORIES`
- [x] Delete unused `getNotesByCategory` (also buggy for legacy tags) and `searchNotes` in `useNotes`
- [x] Add Vitest; unit tests for `parseNote` (fields, commas, URLs, aliases, hashtags) and `urlExtractors`

### F3. Data model migration + single save path
Target model — each layer has one job:

| Layer | Job | Example |
|---|---|---|
| **Shelf** | Why you saved it (the tabs) | Eat |
| **Type** | What it *is* — one per note, small fixed vocabulary per shelf | Cafe |
| **Hashtags** | Free descriptors, any number | #ramen #datenight |
| **Fields** | Structured data the app *uses* (`url`, `location`, `author`, `channel`) + free user labels | location: Newton MA |

- [x] Add explicit `shelf` field and `updatedAt`; normalize `type`
- [x] One-time migration script: `tags[0]` → `shelf` + `type`; dry-run preview before writing (applied 2026-09-26 to all 119 notes; `tags` left in place)
- [x] App reads `shelf`; new notes write `shelf` + `updatedAt`
- [x] One write path: `saveNote(draft)` takes a structured note. The parser only converts typed text → draft. ReviewModal builds a draft directly (no rebuild-a-string-and-reparse), EditModal uses the same path.
- [x] `raw`: decided keep as "original input" — never updated after create, excluded from search
- [ ] After a few days of normal use: remove `tags` field (script) and legacy resolution; then delete the service account key

### F4. Error handling & small UX fixes
- [x] Toast component; surface failures from add / review save / delete / `useNotes.error` (all currently console-only)
- [x] Delete: replace `window.confirm` with an Undo toast
- [x] Compact card uses CSS `capitalize` on titles — "iPhone" renders "IPhone"
- [x] Fix pre-existing lint errors: `useNotes.tsx` and `useAuth.tsx` set state synchronously in an effect
- [x] Remove `/import` page (one-time Supabase import, done) and unused Geist Mono font

*Scalability note:* loading all notes via a realtime listener is fine into the thousands; Firestore cost is negligible. Real risk only appears if the app opens to other users — which F1 covers.

---

## Next

### 1. Location as a first-class field
`location` stays a regular field (fields are free-form `key:value`), but the app treats it specially. Decided 2026-09-26, based on the 57 of 121 notes that already have one:

- **A place name, state optional.** Real habit: local towns lowercase, no state (`newton`, `chestnut hill`); state only when far away (`cabot VT`); regions ok (`cape cod`). Drops the old "Town ST" rule.
- **Standardize for matching:** case-insensitive, and a trailing home state (`MA`) is ignored — `newton` = `Newton MA`. Display capitalizes ("Chestnut Hill").
- **Auto-fill omits the home state** so shared notes match typed ones.
- **`@place` shorthand:** `eat: sichuan gourmet @needham`. `@` first matches known locations (longest match, so `@chestnut hill` works); otherwise takes one word. A new multi-word place is entered once as `location:west newton`; after that `@west newton` matches. Autocomplete suggests known places after `@`.
- **`#` and `@` end the title**, like a comma: `eat: sichuan gourmet #spicy @needham food was great` → title "sichuan gourmet", notes "food was great". Tags placed before the title still work.
- **Coordinates deferred.** Claude already knows which towns are near each other; the app only needs coordinates for an in-app "nearby" filter, and would store them per place (~30 places), not per note. Standardized names make that easy later.

Build:
- [x] Parser: `#`/`@` end the title; `@place` with known-place matching (tests first)
- [x] Location helpers: standardize key, display name (tests)
- [x] Location display on cards (like `url`) instead of a generic chip
- [x] `@` autocomplete from known places
- [x] Auto-fill drops home state
- [x] Filter by location in the UI (alongside type filter within a shelf, and sort options: newest / A–Z)
- [ ] Optional: backfill / clean existing locations (`Newton MA` → `newton`)

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

- **Commas in typed titles** — `parseNote` ends the title at the first comma, so "Is It Aging, or Is It ADHD?" splits into title + notes. Options: quoted titles (`read: "Is It Aging, or Is It ADHD?"`), or only split on commas followed by `key:` / known structure. Decide, then add tests first.

- Email-in address for capture
- Richer status for Read/Watch (in progress, abandoned)
- Export of completed items ("books I read this year")
- Shopping: purchased toggle vs. quantity

## Open questions

- NL input: explicit sparkle button, auto-detect unstructured input, or both?
- MCP auth: is a secret-URL token acceptable long-term for a personal app?
- Location: coordinates only if an in-app "nearby" filter is wanted (per-place lookup table).
- Sharing with others: any social layer, or does that violate the anti-bloat principle?
