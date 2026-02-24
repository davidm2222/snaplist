# SnapList — Build Plan & Progress

## What is SnapList?

A personal capture app for saving things you want to experience, read, buy, or do. Notes are entered as freeform text and auto-parsed into structured records (category, title, fields, hashtags). Backed by Firebase with Google auth.

**Note format:** `category: Title, key:value, key:value #hashtag URL`
- `read: The Hobbit, author:Tolkien #fantasy`
- `eat: Nobu, city:NYC #sushi`
- `watch: Dune #scifi #epic`
- `buy: AirPods Pro, https://amazon.com/... #apple`
- `read: great article, https://theatlantic.com/... #politics`

---

## 📊 Overall Progress

- [x] Phase 1 — Core app end-to-end
- [x] Phase 2 — UI polish & design system
- [x] Phase 3 — Intent-based shelf redesign
- [x] Phase 4 — URL support
- [x] Phase 5 — AI-powered URL parsing
- [x] Phase 6 — Vercel migration
- [ ] Phase 7 — Archive / Done status

---

## ✅ Phase 1 — Core App (Complete)

- [x] Firebase auth (Google sign-in)
- [x] Firestore CRUD (add, update, delete notes)
- [x] Text parser (`parseNote`) — category, title, fields, hashtags
- [x] Category tabs with per-category counts
- [x] Global search across all fields
- [x] Compact / expanded view toggle
- [x] Edit modal with category selector
- [x] Import page (Supabase JSON export → Firebase)
- [x] Dark mode support

**Categories:** Books, Movies, Shows, Restaurants, Drinks, Activities, Other

---

## ✅ Phase 2 — UI Polish (Complete)

- [x] Source Serif 4 font for titles/brand
- [x] Amber accent color (replaced violet/purple)
- [x] SVG line icons replacing emoji category icons
- [x] Color-coded left accent bars on NoteCards per category
- [x] Per-category colored badges
- [x] Teal hashtag color for differentiation
- [x] Improved dark mode text contrast
- [x] Category tabs: wrap to 2 rows on desktop, horizontal scroll on mobile
- [x] `resolveCategory()` helper — safe fallback to 'other' for malformed tags
- [x] Dark mode variants for all category left border accents

---

## ✅ Phase 3 — Intent-Based Shelf Redesign (Complete)

Replaced type-based categories (Books, Movies, Shows, Restaurants, Drinks, Activities) with intent-based shelves (Read, Watch, Eat, Do, Buy, Other). Same two-level model — input aliases just map to new shelf names.

- [x] New `CategoryKey`: `read | watch | eat | do | buy | other`
- [x] Flattened alias lists per shelf in `CATEGORIES` (e.g. `book`, `article` → `read`; `movie`, `show`, `tv` → `watch`)
- [x] Removed subtype system (granularity handled by hashtags instead)
- [x] Legacy mapping in `resolveCategory()` — existing Firestore notes with old tags display in correct shelf without migration
- [x] New shelf colors: read=amber, watch=violet, eat=orange, do=emerald, buy=sky, other=indigo
- [x] New `ShoppingBagIcon` for Buy shelf
- [x] Updated `CATEGORY_ICONS` map and `CategoryTabs` order

---

## ✅ Phase 4 — URL Support (Complete)

URLs are first-class in notes. Include a bare `https://...` anywhere in the input — the parser detects and strips it from the text, stores it in `fields.url`, and the card renders a clickable domain chip.

- [x] `extractUrl()` in parser — detects `https?://` in input, stores in `fields.url`, removes from title/notes text
- [x] NoteCard expanded view — clickable `domain.com ↗` link below the title
- [x] NoteCard compact view — `↗` icon on the right when URL is present
- [x] `url` key excluded from fields chip row (not shown as a raw field)
- [x] Works with any shelf: `buy: AirPods, https://...` or `read: article, https://...`

---

## ✅ Phase 5 — AI-Powered URL Parsing (Complete)

Paste a bare URL → AI fetches page metadata and auto-fills title, category, tags, and fields via a review flow.

- [x] `/api/parse-url` Next.js App Router route — server-side, authenticated via Firebase ID token
- [x] Firebase token verification via REST API (no firebase-admin needed)
- [x] Claude (claude-haiku-4-5) fetches URL content, classifies category, extracts title/fields/hashtags
- [x] `ReviewModal` — shows AI-suggested parsed note, user can edit before saving
- [x] NoteInput detects bare URL paste → triggers ReviewModal instead of direct save
- [x] Graceful fallback if fetch or AI call fails

---

## ✅ Phase 6 — Vercel Migration (Complete)

- [x] Vercel project connected to GitHub repo
- [x] `output: 'export'` removed from `next.config.ts` (now empty)
- [x] Environment variables in Vercel dashboard (`ANTHROPIC_API_KEY`, `FIREBASE_API_KEY` — server-only, no `NEXT_PUBLIC_` prefix)
- [x] Firebase token verification uses Firebase REST API
- [x] GitHub Pages deprecated

---

## 🔲 Phase 7 — Archive / Done Status

**Motivation:** As notes accumulate, completed items (articles read, restaurants visited, things bought) clutter the active list. Mark them done to clear the main view without deleting them.

"Done" applies uniformly across all shelves — it means different things contextually (read it, watched it, ate there, did it, bought it) but is a single concept in the data model.

### 7.1 Data model

- [ ] Add `done?: boolean` to `Note` type in `src/types/index.ts`
  - `undefined` and `false` are both "active" — no Firestore migration needed

### 7.2 Firestore

- [ ] No schema changes needed — `updateNote` in `useNotes.tsx` already handles partial updates
- [ ] `addNote` does not set `done` (defaults to undefined/false)

### 7.3 NoteCard

- [ ] Add a `✓` check button to card actions (alongside edit/delete)
  - Active notes: outlined check icon → click marks done
  - Done notes: filled check icon → click restores to active
- [ ] Done note visual treatment: muted opacity + title strikethrough
- [ ] Accept `onToggleDone: (id: string, done: boolean) => void` prop

### 7.4 SnapList

- [ ] Add `handleToggleDone(id, done)` → calls `updateNote(id, { done })`
- [ ] Split `filteredNotes` into `activeNotes` and `doneNotes`
- [ ] Render `activeNotes` in main list as before
- [ ] Below main list: collapsible "Completed (N)" drawer
  - Collapsed by default; `showCompleted` state (boolean, global — not per shelf)
  - Clicking the header expands/collapses it
  - Done notes render inside with same NoteCard (compact or expanded) + ability to uncheck
- [ ] Category tab counts reflect only active (non-done) notes

---

## 🏗️ Architecture

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Firebase Auth (Google) |
| Database | Firebase Firestore |
| Package manager | pnpm |
| Hosting | Vercel |
| AI | Anthropic Claude (claude-haiku-4-5-20251001) |

**Key files:**
| File | Purpose |
|------|---------|
| `src/lib/parseNote.ts` | Core text parsing logic |
| `src/types/index.ts` | Types + `CATEGORIES` constant |
| `src/hooks/useNotes.tsx` | Firestore CRUD hook |
| `src/hooks/useAuth.tsx` | Auth context/hook |
| `src/components/SnapList.tsx` | Main app shell — state, filtering, layout |
| `src/components/NoteCard.tsx` | Individual note display (compact + expanded) |
| `src/components/NoteInput.tsx` | Text input with parse preview |
| `src/app/api/parse-url/route.ts` | Server-side AI URL parsing endpoint |
| `src/components/ReviewModal.tsx` | AI-parsed note review flow |
| `src/app/import/page.tsx` | Supabase JSON → Firebase import tool |

---

## 🎯 Immediate Next Steps

1. **Phase 7 (Archive / Done)** — mark notes done, collapsible completed drawer
2. **Phase 8 (NL input)** — sparkle button triggers AI parse of free-form text → ReviewModal flow

---

## 🔓 Open Questions

- NL input: explicit sparkle button, auto-detect unstructured input, or both?
- Should completed items be exportable separately from active ones?
- Shopping items: support a "purchased" quantity counter vs. simple done toggle?
