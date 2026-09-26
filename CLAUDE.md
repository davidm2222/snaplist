# SnapList — Claude guide

Personal capture app: one text box → structured note on a shelf (read/watch/eat/do/buy/other). Single user (the owner), built as a learning project. Product intent lives in `UX-SPEC.md`; read it before proposing UX changes.

## Commands

```bash
pnpm dev     # local dev at :3000
pnpm build   # type-check + production build — run before committing code changes
pnpm lint
```

No test suite yet. Verify parser changes by hand: add a note and check the resulting card.

## Architecture

- **Client-heavy Next.js 16 App Router.** The app is one client component tree (`SnapList.tsx`) that talks to Firestore directly via the Firebase JS SDK. There is no server data layer.
- **Server routes only for secrets.** `src/app/api/*` exists to hold `ANTHROPIC_API_KEY`. Routes authenticate by verifying the client's Firebase ID token (`Authorization: Bearer <idToken>`) against the Firebase REST `accounts:lookup` endpoint — no `firebase-admin`, no service account. After verification, the UID must be in `ALLOWED_UIDS` (any Google account can sign in).
- **Firestore rules** live in `firestore.rules` (owner-only access). Not auto-deployed — paste into the Firebase console after changing.
- **Hosting:** Vercel, auto-deploy on push to `master`.

### Key files

| File | Role |
|------|------|
| `src/lib/parseNote.ts` | Text → note parser (shelf, title, fields, hashtags, URL, type) |
| `src/types/index.ts` | `Note` type and `CATEGORIES` (shelves + aliases) — add aliases here |
| `src/hooks/useNotes.tsx` | Firestore CRUD + realtime subscription, scoped by `userId` |
| `src/hooks/useAuth.tsx` | Google sign-in context |
| `src/lib/firebase.ts` | Firebase init (client only; no-ops if env vars missing) |
| `src/components/SnapList.tsx` | App shell: state, filtering, active/done split, layout |
| `src/components/NoteInput.tsx` | Input with autocomplete from existing notes; bare URL → review flow |
| `src/components/ReviewModal.tsx` | AI-assisted URL capture review |
| `src/components/NoteCard.tsx` | Note display (compact + expanded) |
| `src/components/EditModal.tsx` | Edit shelf / type / text |
| `src/app/api/parse-url/route.ts` | Follow redirects, fetch metadata (regex on `<head>`), run site extractors, Claude Haiku classification |
| `src/lib/urlExtractors.ts` | Site-specific title/location extraction (Maps, Amazon, YouTube) + generic-title detection |
| `src/app/manifest.ts` | PWA manifest |
| `src/app/import/page.tsx` | One-time Supabase JSON → Firestore import |

## Data model gotchas

- **Shelf is stored as `tags[0]`**, not a dedicated field. Old notes have pre-shelf tags (`book`, `movie`, `drink`, …); these are resolved at read time by a `LEGACY_CATEGORY_MAP`. No migration was ever run — keep that working. ⚠ The map is duplicated in `SnapList.tsx`, `NoteCard.tsx`, and `EditModal.tsx`; change all three (or consolidate).
- **`type`** preserves the input alias (`book`, `article`) so cards can say "Book" instead of "Read". Optional; absent on older notes.
- **`fields`** is a free-form `Record<string,string>`. `fields.url` is special (rendered as a link, hidden from the chip row). `fields.location` is `Town ST` text, auto-filled by URL parsing. Everything else is a free-form user label.
- **Field values can't contain commas** — notes are saved as a raw string and re-parsed, and `parseNote` splits fields on commas. `ReviewModal` strips them.
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
