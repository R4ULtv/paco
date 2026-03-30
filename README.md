# Paco

**Paco remembers what YouTube keeps repeating to you.**

Paco is a Chrome extension that tracks repeated videos on the YouTube home feed and adds a small badge when a video has already been shown to you before.

## Stack

- TypeScript
- Bun
- Oxlint / Oxfmt
- Dexie + IndexedDB
- Chrome Manifest V3

## Load in Chrome

1. Run `bun run build`
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the `dist/` folder

## Releases

To publish a new GitHub release:

1. Update the version in `manifest.json`
2. Commit and push the change
3. Create and push a matching tag

```bash
git add manifest.json
git commit -m "chore: release v0.1.0"
git push origin main

git tag v0.1.0
git push origin v0.1.0
```

The tag must match the version in `manifest.json`.

## Privacy

Paco runs entirely locally. No analytics, no backend, no telemetry.
