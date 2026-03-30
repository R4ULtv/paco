# 🦜 Paco

**Paco remembers what YouTube keeps repeating to you.**

A Chrome extension that tracks which videos YouTube shows you on your home feed — and how many times. Every time you load the homepage, Paco quietly logs each video and slaps a badge on the ones you've already been served before. The more YouTube repeats a video, the louder Paco squawks.

---

## Why?

Ever notice your YouTube homepage feels... stuck? The same thumbnails staring back at you, refresh after refresh, hour after hour. Paco gives you hard proof. Instead of a vague feeling of "I've seen this before," you get a little `🦜 5x` badge telling you YouTube has pushed this exact video to you five separate times.

---

## How it works

1. **Scrapes** — On every YouTube homepage load, Paco scans the visible video cards and extracts video IDs, titles, channels, and thumbnails.
2. **Tracks** — Each sighting is recorded into a local IndexedDB database (via [Dexie.js](https://dexie.org)) with a timestamp and session ID. One sighting per video per session, so refreshing doesn't inflate the count.
3. **Badges** — A small overlay badge appears on thumbnails of repeated videos. The color shifts based on how stale the recommendation is:
   - 🟢 **2–3x** — Mild. YouTube is nudging.
   - 🟡 **4–6x** — Warm. Getting stale.
   - 🟠 **7–10x** — Hot. Very stale.
   - 🔴 **11+** — Moldy. The algorithm is broken. Paco is screaming.
4. **Scrolls** — Paco uses a MutationObserver to catch videos as YouTube lazy-loads them on scroll. It doesn't just check the first 13 — it tracks everything.

---

## Tech stack

| Layer             | Tool                                 |
| ----------------- | ------------------------------------ |
| Language          | TypeScript                           |
| Storage           | IndexedDB via Dexie.js               |
| Runtime / Tooling | Bun                                  |
| Build             | Bun.build                            |
| Lint / Format     | Oxlint / Oxfmt                       |
| Extension API     | Chrome Manifest V3                   |
| UI                | Vanilla DOM injection (no framework) |

---

## Project structure

```
paco/
├── manifest.json          # Chrome extension manifest (MV3)
├── package.json
├── tsconfig.json
├── icons/
│   ├── paco-48.png
│   └── paco-128.png
├── src/
│   ├── content.ts         # Main entry — orchestrates scraping, tracking, and rendering
│   ├── db.ts              # Dexie.js database schema and query helpers
│   ├── scraper.ts         # DOM scraper that extracts video metadata from YouTube
│   ├── badge.ts           # Badge rendering and severity logic
│   └── paco.css           # Badge styles and animations
└── dist/                  # Build output (gitignored)
    ├── content.js
    └── paco.css
```

---

## Getting started

### Prerequisites

- Bun

### Install & build

```bash
git clone https://github.com/yourusername/paco.git
cd paco
bun install
bun run build
```

### Load in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `paco/` folder (the root, not `dist/`)
5. Open YouTube — Paco is watching 🦜

### Development

```bash
bun run dev
```

This rebuilds the extension whenever you change a source file. Reload the extension in Chrome to pick up changes.

### Quality checks

```bash
bun run typecheck
bun run lint
bun run format
bun run check
```

---

## GitHub

### Publish the repository

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-user-or-org>/paco.git
git push -u origin main
```

Once the repo is on GitHub, the CI workflow will run on pushes and pull requests to `main`.

### Create a GitHub Release

The release workflow builds the extension, zips the `dist/` folder, and uploads it as a GitHub Release asset.
It also generates custom release notes with:

- the release version
- the release date
- a direct download link to the zip asset
- the commit changelog since the previous tag
- a compare link to the full diff

1. Update `manifest.json` to the version you want to release.
2. Commit that version bump to `main`.
3. Create and push a matching tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The pushed tag must match the version in `manifest.json`. For example, manifest version `0.1.0` must be released with tag `v0.1.0`.

For best release notes, use clear commit messages because the changelog is generated from commits between tags.

---

## Database schema

Paco stores everything locally in IndexedDB. Nothing leaves your browser.

**`videos`** — One row per unique video

| Field          | Type   | Description                    |
| -------------- | ------ | ------------------------------ |
| `videoId`      | string | YouTube video ID (primary key) |
| `title`        | string | Video title                    |
| `channelName`  | string | Channel name                   |
| `thumbnailUrl` | string | Thumbnail image URL            |
| `firstSeenAt`  | Date   | When Paco first spotted it     |

**`sightings`** — One row per video per session

| Field       | Type   | Description                |
| ----------- | ------ | -------------------------- |
| `id`        | number | Auto-increment primary key |
| `videoId`   | string | References a video         |
| `seenAt`    | Date   | Timestamp of this sighting |
| `sessionId` | string | Unique ID per page load    |

---

## Roadmap

- [ ] Popup dashboard with stats (most repeated videos, daily freshness %, timeline)
- [ ] Export data to JSON for external analysis
- [ ] "Hide moldy videos" mode — dim or collapse videos past a threshold
- [ ] Per-channel staleness stats
- [ ] Daily/weekly freshness score notifications
- [ ] Firefox support

---

## Privacy

Paco runs entirely locally. No data is sent anywhere — everything lives in your browser's IndexedDB. There is no analytics, no telemetry, no server. Just a parrot with a good memory.

---

## License

MIT
