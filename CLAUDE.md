# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

宠物机会情报台 (Pet-industry opportunity intelligence dashboard) — a Next.js prototype that aggregates pet-industry signals (抖音/小红书/公众号/Reddit/X/独立站/news) and surfaces AI-filtered opportunities worth validating. Product audience: online pet-brand owners and pet startups.

**Current reality vs. product vision:** Everything rendered is **static mock data**. There is no backend, no data-source integration, no AI pipeline, and no database — despite the design docs describing all of those. A future task is to replace the static data with real sources + AI filtering/scoring. Do not go looking for API routes, fetch logic, or a server layer; they don't exist yet.

## Commands

```bash
npm run dev      # next dev — local dev server (Turbopack)
npm run build    # next build — production build
npm run start    # next start — serve the production build
npm run lint     # next lint
```

There is **no test framework** configured (no test runner, no test files). Don't claim tests pass — verify changes via `npm run build` and by viewing the dev server.

Stack: Next.js 16 (App Router) · React 19 · TypeScript 6 (strict). No CSS framework, no UI library, no state library — only these three runtime deps.

## Architecture

The entire app is three files plus thin route wrappers:

- **`app/data.ts`** — the single source of all content. Typed mock arrays (`featuredStories`, `newsItems`, `reportCards`, `sourceStats`, `topTopics`, `archiveItems`) and the types behind them (`FeaturedStory`, `NewsItem`, `ReportCard`, `Chip`). To change what's on screen, edit data here.
- **`app/components.tsx`** — every React component lives here. The composition pattern: `AppFrame` renders the shell (`Sidebar` + `TopPanel`) and wraps one module component — `FeaturedModule`, `AllNewsModule`, or `DailyModule`. All components are **React Server Components** (no `"use client"` anywhere); search inputs and tab buttons that look interactive are non-functional placeholders.
- **`app/globals.css`** — ~1000 lines of hand-written CSS driven by CSS variables (`:root`), replicating the "AI Hot" light reading layout. No Tailwind/CSS-modules; class names are plain strings shared between `components.tsx` and this file.

Routes (`app/<route>/page.tsx`) are one-liners that pick the `active` module and pass filters into `AppFrame`:

- `/` → redirects to `/featured`
- `/featured` → `?category=` filter (主粮/零食/护理/用品/药品/出海)
- `/all-news` → `?source=` filter (抖音/小红书/公众号/Reddit/X/独立站)
- `/daily` → no filter

### Conventions that matter

- **Filtering is URL-driven and server-side.** Each page reads `searchParams` (a `Promise` in Next 16 — `await` it) and passes the value down; filtering is plain `.filter()` over the static arrays in `components.tsx` (`matchesFeaturedCategory`, `matchesNewsSource`). There is no client-side filter state.
- **Chinese label strings are the de-facto enums.** Filter matching compares against `story.segment` / `item.source` Chinese strings. The tab arrays (`featuredTabs`, `newsTabs`) and sidebar `sourceStats` labels must stay in sync with the values used in `data.ts`, or filtering silently returns empty.
- **Several numbers are cosmetic, not computed.** `storyScores` (the per-card score badges) is a hardcoded array indexed by card position; nav/header counts like `"126"`, `"9"` are literal strings. The real 4-dimension scoring (需求强度/增长信号/竞品空白/可行动性, 25 pts each) described in the design docs is not implemented.
- **Chinese-first.** All UI copy and content is Simplified Chinese; keep it that way unless asked otherwise.

## Design & product references

- `设计/v0.1-宠物机会情报台/需求总结.md` — the v0.1 PRD: scope (and explicit non-goals), the opportunity-scoring model, opportunity-pool states, data-update flow, data-source constraints, and the full list of page states (loading/empty/partial-failure/API-key-expired/…) the design must eventually cover.
- `设计/v0.1-宠物机会情报台/*.html` — static design mockups (设计稿 + 全状态设计参考) that the React app is built to match.

## AGENTS.md

`AGENTS.md` defines the working relationship: respond in Simplified Chinese, report conclusions/changes/reasons/verification concisely, build the smallest verifiable loop first. It also specifies a **project-local memory protocol** — read/write `MEMORY.md` and `memory/YYYY-MM-DD.md` in the repo root (not a global memory dir) for durable context and daily notes.
