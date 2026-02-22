# SnapList

A personal capture app for saving things you want to experience, read, buy, or do. Type a quick note in natural text — SnapList parses it into a structured record automatically.

## Note Format

```
category: Title, key:value, key:value #hashtag
```

**Examples:**
```
book: The Hobbit, author:Tolkien #fantasy
restaurant: Nobu, city:NYC #sushi
movie: Dune #scifi
drink: Negroni, bar:Attaboy #cocktail
activity: Natural History Museum #museum
show: Severance #thriller #apple
```

If no category prefix is given, the note is saved as **Other**.

## Categories

| Category | Aliases |
|----------|---------|
| Books | book, books |
| Movies | movie, movies, film, films |
| Shows | show, shows, tv, series |
| Restaurants | restaurant, restaurants |
| Drinks | drink, drinks (subtypes: beer, wine, cocktail) |
| Activities | activity, activities, event (subtypes: hike, concert, museum, theater) |
| Other | (fallback) |

## Features

- **Fast capture** — single text input, no forms
- **Auto-parsing** — extracts category, title, key:value fields, and #hashtags
- **Category tabs** — filter by type with per-tab counts
- **Global search** — searches across title, notes, fields, and hashtags
- **Compact / expanded view** — toggle between dense list and card view
- **Edit modal** — fix category or text after saving
- **Dark mode** — full system dark mode support
- **Import** — upload a Supabase JSON export at `/import`

## Stack

- **Next.js 16** (App Router)
- **Firebase** — Auth (Google) + Firestore
- **Tailwind CSS v4**
- **TypeScript**
- **pnpm**

## Setup

1. Clone the repo and install dependencies:
   ```bash
   pnpm install
   ```

2. Create `.env.local` with your Firebase config:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   ```

3. Start the dev server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Build & Deploy

```bash
pnpm build   # production build
pnpm start   # run production server
```

Currently hosted on GitHub Pages. Planned migration to Vercel to enable API routes (required for upcoming AI-powered URL parsing).

## Roadmap

See [PLAN.md](./PLAN.md) for the full feature roadmap including:
- URL & article support (read-later, shopping links)
- AI-powered URL parsing (paste a link → auto-categorize)
- Vercel migration
