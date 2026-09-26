# SnapList

A personal capture app for things you want to read, watch, eat, do, or buy. Type a quick note in one text box — SnapList parses it into a structured record and files it on the right shelf.

## Note format

```
shelf: Title, key:value, key:value #hashtag https://optional.url
```

```
read: The Hobbit, author:Tolkien #fantasy
eat: Nobu, city:NYC #sushi
watch: Severance #thriller
buy: Aeron chair https://hermanmiller.com
https://www.theatlantic.com/...        ← bare URL: AI fills in the rest
```

- The prefix can be a shelf name or an alias (`book` → Read, `movie` → Watch, `restaurant` → Eat, …). No prefix → Other.
- `key:value` pairs become fields; `#word` becomes a hashtag; a URL is stored as a link.
- Pasting a bare URL opens a review screen pre-filled by AI (title, shelf, hashtags).

## Shelves

| Shelf | Example aliases |
|-------|-----------------|
| Read  | book, article, link |
| Watch | movie, show, tv, video, youtube |
| Eat   | restaurant, cafe, bar, drink, beer, wine |
| Do    | activity, event, hike, concert, museum |
| Buy   | shop, shopping, want |
| Other | (fallback) |

Full alias list: `CATEGORIES` in `src/types/index.ts`.

## Features

- One-box capture with autocomplete from your existing notes
- AI-assisted URL capture (Claude Haiku via a server route)
- Shelf tabs with counts, global search, compact/expanded views
- Mark done → collapsible "Completed" section
- Edit modal (shelf, type, text)
- Installable PWA, dark mode
- `/import` — one-time import from the old Supabase JSON export

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Firebase Auth (Google) + Firestore · Anthropic API · pnpm · hosted on Vercel

## Setup

```bash
pnpm install
cp .env.local.example .env.local   # then fill in values
pnpm dev                           # http://localhost:3000
```

Environment variables:

| Variable | Where used |
|----------|-----------|
| `NEXT_PUBLIC_FIREBASE_*` (6 vars) | Client Firebase config |
| `FIREBASE_API_KEY` | Server — verifies Firebase ID tokens in API routes |
| `ANTHROPIC_API_KEY` | Server — AI URL parsing |
| `ALLOWED_UIDS` | Server — comma-separated Firebase UIDs allowed to call API routes |

Server-only vars have no `NEXT_PUBLIC_` prefix so they never reach the browser.

## Deploy

Pushing to `master` deploys to Vercel. Set the same env vars in the Vercel project settings.

## Docs

- [PLAN.md](./PLAN.md) — what's next
- [CHANGELOG.md](./CHANGELOG.md) — what shipped and why
- [UX-SPEC.md](./UX-SPEC.md) — product problem, goals, flows, decisions
- [CLAUDE.md](./CLAUDE.md) — architecture and conventions for AI-assisted development
