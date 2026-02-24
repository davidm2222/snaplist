# UX Spec: SnapList

> A personal capture app for saving things you want to read, watch, eat, do, or buy — organized automatically from a single text input.

---

## Problem

Keeping track of things you want to experience is scattered by default. A restaurant someone mentions, a book you hear about, an article you want to read later — they end up in different apps, different tabs, different notes, and eventually get lost or ignored.

Google Keep worked as a workaround but added its own friction: separate notes per category meant you had to find the right note before you could add to it. And as lists grew, they became hard to scan and organize. Pocket handled articles well until it shut down — and even then, it was yet another tool to maintain.

The root problem isn't storage — it's capture friction. If adding something takes more than a few seconds of thought, you don't bother.

---

## Users

**Primary user: the builder himself (solo personal tool)**

- Tech-comfortable; willing to learn a lightweight syntax
- Captures across contexts: desktop when browsing, mobile when out and about
- Adds things reactively (heard about a restaurant, saw a book recommended) not proactively
- Reviews and browses occasionally, not daily
- Thinks of this as long-term memory, not a to-do list

**Potential future users:** friends or small groups who want the same thing. No commercialization planned, but the design should be clean enough to hand to someone else.

---

## Current Alternatives (and what's wrong with them)

| Tool | Use case | Problem |
|------|----------|---------|
| Google Keep | Books, restaurants | Separate note per category; friction finding the right note; hard to scan as lists grow |
| Pocket | Articles | Worked well for articles specifically, but shut down; siloed from everything else anyway |
| Bookmarks | Links | Unstructured, hard to search, no context |
| Memory | Everything | Doesn't scale |

**The pattern:** each tool solves one category well but none unify them. Switching between tools is the real cost.

---

## Unique Value

One place, one input, zero setup per item. Type the way you'd jot something on paper — the app figures out the structure. No dropdowns, no category selection, no fields to fill in. Just write it down and move on.

---

## User Goals

### Primary Goals
- Capture a new item in under 10 seconds without thinking about the tool
- Browse saved items by category to decide what to read/watch/eat/do next
- Mark something done to clear it without losing it

### Secondary Goals
- Search across everything when you can't remember which shelf something is on
- Add context (author, location, URL, notes) without it feeling like a form
- Paste a URL and have the app figure out the rest

### Anti-Goals — What SnapList Does NOT Do
- **Not a task manager.** No due dates, priorities, or daily workflows. This is long-term memory, not "what do I need to do today?"
- **Not a read-later app.** Articles can be saved here, but SnapList won't replace a full reading environment.
- **Not a social or sharing tool.** No feeds, recommendations, or public lists.
- **Not a second brain.** No nested tags, folders, wikis, or linking between notes. Simplicity is load-bearing — adding organizational complexity defeats the purpose.
- **Not bloated.** Every feature must justify itself against the core "jot it down" experience.

---

## User Flows

### Quick Capture (Core Flow)
1. Open app → input box is prominent at the top, ready to type
2. Type a note in shorthand: `eat: Nobu, city:NYC #sushi` or just `eat: Nobu`
3. Parser preview shows how it will be interpreted (category, title, fields, tags)
4. Submit → note appears at the top of the list, filed under the right shelf
5. Input clears and is ready for the next capture

### URL Capture (AI-Assisted Flow)
1. Copy a URL elsewhere → open app → paste into input
2. App detects bare URL → triggers AI review instead of direct save
3. ReviewModal shows: AI-suggested category, title, fields, and hashtags
4. User edits if needed, then saves
5. Note saved with full metadata — effectively replaces Pocket for articles

### Browse and Act
1. Open app → scan the list on the active shelf, or switch tabs
2. Search if you can't remember which shelf something is on (search is global)
3. Expand a note to see URL, fields, hashtags, and actions
4. Act: click the URL, mark done, edit, or delete

### Triage (Mark Done)
1. Finished something (read the article, visited the restaurant)
2. Tap ✓ on the note card → moves to collapsed "Completed" drawer below the active list
3. Done items stay accessible but don't clutter the active view
4. Can restore if marked done by mistake

---

## Pages / Screens

| Screen | Purpose | Key Elements |
|--------|---------|--------------|
| Main app | Capture and browse | Text input with parse preview, category tabs with counts, note list, search bar, compact/expanded toggle |
| Review modal | Confirm AI-parsed URL before saving | Editable parsed note preview, save / cancel |
| Edit modal | Edit an existing note | Raw text input, category selector |
| Import page | One-time Supabase → Firebase migration | File upload, import action (internal tooling) |

---

## Note Format

The structured text input is central to the product's identity. The format is designed to be learnable in one example, not require memorization.

```
category: Title, key:value, key:value #hashtag https://url
```

**Examples:**
```
eat: Nobu, city:NYC #sushi #datenight
read: The Pragmatic Programmer, author:Hunt #engineering
watch: Severance #thriller #apple
buy: Aeron chair https://herman-miller.com
read: https://www.theatlantic.com/...        ← AI fills in the rest
```

**Parsing rules:**
- First token before `:` is the category (or alias — `book` → read, `movie` → watch, etc.)
- Everything after `:` up to the first `,` or `#` or URL is the title
- `key:value` pairs separated by commas become structured fields
- `#word` tokens become hashtags
- A bare `https://` URL is extracted into `fields.url` and stripped from the title
- Anything that doesn't fit a field or hashtag pattern becomes freeform `notes`
- If a bare URL is the entire input, AI parsing is triggered instead

**Category aliases** (input → shelf):
| Input | Shelf |
|-------|-------|
| book, article, link | Read |
| movie, film, show, tv, video, youtube | Watch |
| restaurant, cafe, bar, drink, beer | Eat |
| activity, hike, concert, museum, event | Do |
| shop, want | Buy |

---

## Key Decisions

**Single text input over a form**
A form with dropdowns and fields feels like work. The point is to *jot* — the same instinct as grabbing a sticky note. One text box is inviting; a form is a commitment.

**Structured syntax over plain text**
Plain text (just typing a title) gives nothing to work with for organization. A lightweight syntax (`category: Title`) adds just enough structure to auto-file and auto-display notes without requiring any UI interaction beyond typing.

**Intent-based shelves (read/watch/eat/do/buy) over type-based (books/movies/restaurants)**
Originally the app had type-based tabs: Books, Movies, Restaurants, etc. As usage expanded, more types accumulated and the tab bar became unwieldy. Collapsing by intent (both books and articles → Read; movies and shows → Watch) keeps the tab count small and the model extensible. New types of things fit naturally without adding tabs.

**Hashtags for granularity, not subtypes**
Rather than `read > books > fiction`, hashtags like `#fiction` handle granularity without nesting or proliferating tabs. The user decides what metadata matters.

**AI parsing for URLs, not all input**
Running AI on every note would add latency and cost to the core capture flow. Structured input is instant and free. AI is reserved for URLs where the value is clear: you pasted a link, the AI fetches the page and saves you the typing. Best of both worlds.

**Done/archive over delete**
Deleting feels permanent and discourages capturing anything time-sensitive. A "done" state lets you clear the active list while keeping a record — true long-term memory behavior.

**Firebase + Google Auth**
Single sign-in with no password to manage. Firestore gives real-time sync across devices without building a backend.

---

## Open Questions

- **NL input:** Should a "sparkle" button allow free-form text (not just URLs) to be AI-parsed? Keeps the structured path fast while offering an escape hatch.
- **Completed export:** Should done items be separately exportable (e.g., "books I've read this year")?
- **Progress states:** Should Read/Watch items support richer status (in progress, abandoned) beyond binary done/not-done?
- **Sharing:** If opened to others, does any social layer (shared lists, recommendations) make sense, or does that violate the anti-bloat principle?
