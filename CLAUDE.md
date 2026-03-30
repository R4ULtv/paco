# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Paco is a Chrome extension (Manifest V3) that tracks which videos YouTube repeatedly shows on the homepage. It badges repeated videos with severity colors (green → red) based on how many times they've been served.

## Tech stack

- TypeScript (strict mode, ESNext target)
- Bun as runtime, bundler, and package manager
- IndexedDB via Dexie.js for local storage
- oxlint for linting, oxfmt for formatting
- Chrome Extension Manifest V3
- Vanilla DOM injection (no framework)

## Architecture

| File             | Role                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| `manifest.json`  | Chrome MV3 manifest                                                    |
| `src/content.ts` | Main content script — orchestrates scraping, tracking, badge rendering |
| `src/db.ts`      | Dexie.js database schema and query helpers                             |
| `src/scraper.ts` | DOM scraper extracting video metadata from YouTube cards               |
| `src/badge.ts`   | Badge rendering and severity color logic                               |
| `src/paco.css`   | Badge styles and animations                                            |
| `dist/`          | Build output (gitignored)                                              |

## Commands

```bash
bun install          # install dependencies
bun run build        # bundle with bun → dist/
bun run watch        # bun build in watch mode
bun run lint         # oxlint src/
bun run fmt          # format with oxfmt
bun run fmt:check    # check formatting without writing
```

## Key design decisions

- **One sighting per video per session** — refreshing the page does not inflate counts. A unique `sessionId` is generated per page load.
- **MutationObserver** for lazy-loaded content — must catch videos YouTube loads on scroll, not just the initial 13.
- **All data stays local** — IndexedDB only, no network calls, no telemetry.
- **Badge severity tiers:** 2–3x green, 4–6x yellow, 7–10x orange, 11+ red.

## Loading the extension for development

1. `chrome://extensions` → enable Developer mode
2. Load unpacked → select the project root (not `dist/`)
3. After code changes: rebuild, then reload the extension in Chrome
