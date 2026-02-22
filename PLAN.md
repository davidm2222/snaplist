# SnapList — Build Plan & Progress

## What is SnapList?

A personal capture app for saving things you want to experience, read, buy, or do. Notes are entered as freeform text and auto-parsed into structured records (category, title, fields, hashtags). Backed by Firebase with Google auth.

**Note format:** `category: Title, key:value, key:value #hashtag`
- `book: The Hobbit, author:Tolkien #fantasy`
- `restaurant: Nobu, city:NYC #sushi`
- `movie: Dune #scifi #epic`

---

## 📊 Overall Progress

- [x] Phase 1 — Core app end-to-end
- [x] Phase 2 — UI polish & design system
- [x] Phase 3 — Intent-based shelf redesign
- [ ] Phase 4 — URL & article support
- [ ] Phase 5 — AI-powered parsing
- [ ] Phase 6 — Infrastructure (Vercel migration)

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

## 🔲 Phase 4 — URL & Article Support

**Motivation:** Replace Pocket (shut down) for read-later articles. Also useful for tracking shopping items with links.

### 3.1 New categories
- [ ] Add `article` category (aliases: article, articles, read, link)
- [ ] Add `buy` / `shopping` category (aliases: buy, shop, shopping, want)

### 3.2 URL storage in notes
- [ ] Allow URLs in note text — store in `fields.url`
- [ ] Parser: detect bare URLs in input and auto-store as `fields.url`
- [ ] NoteCard: render clickable link when `fields.url` is present
- [ ] NoteCard: show favicon or domain badge for URL notes

### 3.3 UI for URL notes
- [ ] Compact view: show domain name next to title for URL notes
- [ ] NoteInput: accept raw URL paste (detect and prompt for category)

---

## 🔲 Phase 5 — AI-Powered Parsing

**Motivation:** Paste a URL → AI fetches page metadata and auto-fills title, category, tags, and notes. Zero friction capture.

> ⚠️ **Requires Phase 6 (Vercel)** — AI parsing needs a server-side API route to safely call an AI provider and fetch URLs. Not possible on GitHub Pages static export.

### 4.1 Infrastructure
- [ ] Create `/api/parse-url` route (Next.js API route, server-side)
- [ ] Choose AI provider — Anthropic Claude recommended (claude-haiku-4-5-20251001 for speed/cost)
- [ ] Add `ANTHROPIC_API_KEY` to Vercel environment variables

### 4.2 Core AI parsing
- [ ] Fetch URL server-side (avoid CORS), extract page title + meta description + OG tags
- [ ] Send page content to Claude: classify category, suggest title, extract key fields, suggest hashtags
- [ ] Return structured `ParsedNote`-compatible object

### 4.3 UX flow
- [ ] NoteInput: detect when user pastes a URL
- [ ] Show "Analyzing URL..." loading state
- [ ] Pre-fill input with AI-suggested text (user can edit before saving)
- [ ] Fallback gracefully if fetch or AI call fails (let user type manually)

### 4.4 Article-specific enhancements
- [ ] Store `fields.url`, `fields.author`, `fields.site` for articles
- [ ] Add `read` / `unread` status toggle on article cards
- [ ] Filter: show only unread articles in Articles tab

---

## 🔲 Phase 6 — Infrastructure: Vercel Migration

**Motivation:** GitHub Pages limits the app to static export only — no API routes, no SSR, no middleware. Required for Phase 4 (AI parsing). Also unlocks preview deploys and edge CDN.

- [ ] Create Vercel project, connect GitHub repo
- [ ] Migrate environment variables from `.env.local` to Vercel dashboard
- [ ] Remove `output: 'export'` from `next.config.ts` if present
- [ ] Verify Firebase auth domains include new Vercel URLs
- [ ] Test build and deploy
- [ ] Update GitHub Pages → redirect to new Vercel URL (or just deprecate)
- [ ] Set up preview deploys for feature branches

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
| Hosting | GitHub Pages → Vercel (planned) |
| AI (planned) | Anthropic Claude (claude-haiku-4-5 for parsing) |

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
| `src/app/import/page.tsx` | Supabase JSON → Firebase import tool |

---

## 🎯 Immediate Next Steps

1. **Phase 5 first** — Migrate to Vercel before building AI features
2. Add `article` and `buy` categories to `src/types/index.ts` and design colors
3. Build URL detection + storage in the parser
4. Set up `/api/parse-url` route with Claude integration
5. Update NoteCard to render clickable URLs and article read-status

---

## 🔓 Open Questions

- Should `article` and `buy` be top-level tabs, or nested under "Other"?
- For AI parsing: stream the response for faster perceived UX, or wait for full result?
- Read-later status (read/unread): stored in Firestore or local state only?
- Should shopping items support a "purchased" status toggle?
