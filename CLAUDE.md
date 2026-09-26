# SnapList — Claude guide

Personal capture app: one text box → structured note on a shelf (read/watch/eat/do/buy/other). Single user (the owner), built as a learning project. Product intent lives in `UX-SPEC.md`; read it before proposing UX changes.

## Commands

```bash
pnpm dev     # local dev at :3000
pnpm build   # type-check + production build — run before committing code changes
pnpm lint
pnpm test    # Vitest unit tests (src/**/*.test.ts)
```

Parser and URL extractors have unit tests — add a test with every parser change.

## Architecture

- **Client-heavy Next.js 16 App Router.** The app is one client component tree (`SnapList.tsx`) that talks to Firestore directly via the Firebase JS SDK. There is no server data layer.
- **Server routes only for secrets.** `src/app/api/*` exists to hold `ANTHROPIC_API_KEY`. Routes authenticate by verifying the client's Firebase ID token (`Authorization: Bearer <idToken>`) against the Firebase REST `accounts:lookup` endpoint — no `firebase-admin`, no service account. After verification, the UID must be in `ALLOWED_UIDS` (any Google account can sign in).
- **Firestore rules** live in `firestore.rules` (owner-only access). Not auto-deployed — paste into the Firebase console after changing.
- **Hosting:** Vercel, auto-deploy on push to `master`.

### Key files

| File | Role |
|------|------|
| `src/lib/parseNote.ts` | Text → note parser (shelf, title, fields, hashtags, `@place`, URL, type). Title ends at the first `,` `#` `@` or URL |
| `src/lib/notes.ts` | Shared shelf/type/search logic (`SHELVES`, `SHELF_TYPES`, `lookupAlias`, `resolveShelf`, `resolveType`, `matchesSearch`, location helpers) — use these, don't re-implement in components |
| `src/types/index.ts` | `Note` type and `CATEGORIES` — shelves, types, and synonyms; add new prefixes here |
| `src/hooks/useNotes.tsx` | Firestore CRUD + realtime subscription, scoped by `userId` |
| `src/hooks/useAuth.tsx` | Google sign-in context |
| `src/lib/firebase.ts` | Firebase init (client only; no-ops if env vars missing) |
| `src/components/SnapList.tsx` | App shell: state, filtering (tab, search, type, place, sort), active/done split, layout |
| `src/components/FilterBar.tsx` | Type / place / sort dropdowns (native `<select>`) |
| `src/components/NoteInput.tsx` | Input with autocomplete (fields, `#tags`, `@places`); bare URL → review flow |
| `src/components/ReviewModal.tsx` | AI-assisted URL capture review |
| `src/components/NoteCard.tsx` | Note display (compact + expanded) |
| `src/components/EditModal.tsx` | Edit shelf / type / text |
| `src/components/Toast.tsx` | `ToastProvider` + `useToast()` — one toast at a time, optional action (Undo) |
| `src/app/api/parse-url/route.ts` | Follow redirects, fetch metadata (regex on `<head>`), run site extractors, Claude Haiku classification |
| `src/lib/urlExtractors.ts` | Site-specific title/location extraction (Maps, Amazon, YouTube) + generic-title detection |
| `src/app/manifest.ts` | PWA manifest |

## Data model

- **One save path.** Every screen builds a `NoteDraft` (`src/types/index.ts`); `useNotes` saves it via `addNote(draft, raw)` / `saveNote(id, draft)` / `setDone`. `toFirestore()` in `useNotes` is the only place a draft becomes Firestore data, and `normalizeDraft()` does all cleanup. Don't write notes any other way. (Exception: `restoreNote` writes a deleted note back verbatim for Undo.)
- **`shelf`** is an explicit field on every note (F3 migration, 2026-09-26). `tags` is legacy — still written as `[shelf]` so a code rollback works; `resolveShelf()` falls back to it. Scheduled for removal (see PLAN).
- **`type`** is the canonical type within the shelf (`book`, `cafe`); synonyms normalize (`film` → `movie`). Optional.
- **`raw`** is the original input at creation (typed text, or the shared URL). Never updated, not searched.
- **`fields`** is a free-form `Record<string,string>`. `fields.url` is special (rendered as a link, hidden from the chip row). `fields.location` is a free-text place name, state only when not the home state (`newton`, `cabot VT`); set by `@place`, `location:`, or URL parsing. `normalizeDraft` drops a trailing `MA`; match/display via `locationKey()` / `formatLocation()` in `notes.ts`, never compare raw strings. Everything else is a free-form user label.
- **Commas:** typed input is split on commas by `parseNote`, so a typed field value can't contain one. Drafts from the review/edit screens are saved directly, so commas there are fine.
- **`done`**: `undefined`/`false` = active. Optional fields are only written when present, so schema additions need no migration.

## Conventions

- Start simple: no new dependencies or infrastructure without a stated reason.
- Tailwind v4, zinc neutrals, amber accent, teal hashtags, Source Serif 4 for titles, SVG line icons in `Icons.tsx`. Every shelf has a color used for the card's left accent bar — keep light and dark variants in sync.
- AI calls use `claude-haiku-4-5-20251001` for cheap classification; keep prompts small and return JSON.
- AI failures must degrade gracefully to manual entry — never block capture.

## Docs workflow

- `PLAN.md` — future work only (Now / Next / Later / Ideas / Open questions).
- `CHANGELOG.md` — newest first; what shipped + one line of *why*.
- When shipping a feature: move its item out of `PLAN.md` and add a `CHANGELOG.md` entry in the same commit.
- Small, focused commits directly on `master`.
