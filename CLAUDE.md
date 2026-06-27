# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

宠物机会情报台 (Pet-industry opportunity intelligence dashboard) — a Next.js app that aggregates pet-industry signals from multiple platforms and uses AI to surface validated product/category opportunities. Audience: online pet-brand owners and pet startups. Pages: 「精选」(featured opportunities) / 「全部宠业动态」(all news) / 「AI 日报」(daily report).

**It is no longer a static mock.** A real data pipeline is wired end-to-end: `npm run update` fetches from live sources, normalizes, runs DeepSeek analysis, and writes `data/snapshot.json`; pages read that snapshot. (Earlier versions of this file said "all static mock, no backend" — that is now obsolete.)

## Commands

```bash
npm run dev      # next dev (Turbopack)
npm run build    # next build
npm run start    # serve production build
npm run lint     # next lint
npm run update   # ★ the pipeline: fetch all sources → normalize → DeepSeek analysis → write data/snapshot.json
```

`npm run update` runs `scripts/update.ts` via **tsx** (devDep, with **dotenv**). There is **no test framework** — verify via `npm run build`, `npx tsc --noEmit`, and by running the dev server / `npm run update`.

## Architecture

### The data loop (the core thing to understand)

`scripts/update.ts` orchestrates one update:
1. **Fetch** from each source (`lib/sources/*`) → `RawItem[]`
2. **Normalize** (`lib/pipeline/normalize.ts`) → `NewsItem[]` view for 全部宠业动态
3. **Analyze** (`lib/pipeline/analyze.ts` → DeepSeek) → `Opportunity[]` (4-dimension scores + reason + evidence), AI daily report; topics / source counts / daily stats are **derived in code, not by the LLM**
4. **Write** `data/snapshot.json` (+ `raw-<runId>.json` archive of原始 RawItem)

Pages read via `lib/store.ts`, which loads `data/snapshot.json` and **shallow-merges over the seed** (`lib/seed.ts`): any field the pipeline didn't produce falls back to seed. So a partial run (e.g. AI failed → only `news` written) still renders — 精选/日报 just stay on seed. **Any source or the AI failing never aborts the others** (部分可用).

### Key files

- `lib/types.ts` — unified data structures: view models (`FeaturedStory`/`NewsItem`/`ReportCard`/`TopTopic`/`DailySection`) + canonical structures (`RawItem`/`Opportunity` with `ScoreBreakdown`, `OpportunityStatus`, `EvidenceRef`) + `UpdateRun` log.
- `lib/store.ts` — sole data-access layer for pages; `React.cache`-wrapped; snapshot-over-seed merge.
- `lib/seed.ts` — factory seed (the original static mock), fallback when snapshot missing/partial.
- `lib/sources/*` — one file per source, each returns `{ items: RawItem[]; result: SourceRunResult }`.
- `lib/pipeline/{normalize,analyze}.ts` — view mapping; AI analysis.
- `lib/ai/deepseek.ts` — DeepSeek (OpenAI-compatible) call wrapper, `response_format: json_object`.
- `app/` — thin route files (`*/page.tsx`, all `force-dynamic`) + `components.tsx` holding every component (RSC, async, reading from `lib/store`).

### Sources & credentials (all in `.env`, gitignored)

| Source | via | env | notes |
|---|---|---|---|
| 抖音 (Douyin) | RedFox API | `REDFOX_API_KEY` | `POST https://redfox.hk/story/api/dyData/searchArticle`, header auth; ~160/run. 小红书/公众号 are other RedFox endpoints — **not yet added**. |
| 新闻/独立站 | Tavily | `TAVILY_API_KEYS` | comma-separated multi-key failover; `topic=general` + pet-keyword filter. |
| X | Grok proxy | `GROK_BASE_URL`,`GROK_API_KEY` | model `grok-4.20-multi-agent-high`; real X posts, high quality but ~1M tokens/call & occasional 429. |
| AI analysis | DeepSeek | `DEEPSEEK_API_KEY` | model `deepseek-v4-flash` (full name; also `deepseek-v4-pro`). |
| Reddit | OAuth | `REDDIT_CLIENT_*` | code ready (`lib/sources/reddit.ts`) but **not wired into update** — supplied secret was invalid; needs real client_secret. |

### Conventions that matter

- **Chinese label strings are de-facto enums.** Filtering compares `item.source` / `story.segment` against Chinese strings; the tab arrays in `components.tsx` (`featuredTabs`/`newsTabs`) and `normalize.ts`'s `viewSource` must stay in sync with the values the sources emit, or filtering silently returns empty.
- **Partial snapshot writes**: `update.ts` only writes the fields it produced; `store.ts` merges the rest from seed. Don't assume `snapshot.json` is a full `Snapshot`.
- **Evidence is traceable**: `Opportunity.evidence` references back to `RawItem.url`; keep raw sources, don't let analysis discard them (per AGENTS.md).
- Pages are `force-dynamic` — editing `snapshot.json` and refreshing shows new data immediately.
- `data/snapshot.json` and `data/raw-*.json` are run artifacts, gitignored.

## Reference

- `设计/v0.1-宠物机会情报台/需求总结.md` — the PRD: 4-dimension scoring model (需求强度/增长信号/竞品空白/可行动性, 25 each), opportunity-pool states, full page-state checklist.
- `MEMORY.md` + `memory/YYYY-MM-DD.md` — project memory (per `AGENTS.md` protocol): decisions, source-integration details, todos. **Read these at session start.** Credentials are referenced by env-var name only; values live in `.env`.
- `AGENTS.md` — working style (Simplified Chinese, concise) + the project-local memory protocol.
