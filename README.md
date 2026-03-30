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

## Why Not Sync Across Devices?

Sync is intentionally out of scope for now.

Paco is designed to be fast, local-first, and privacy-first. Adding cross-device sync would mean introducing user accounts, a central database, conflict handling, and additional security work. That would add several layers of complexity and risk that do not fit the current goals of the project.

For now, the product direction is simple: keep data on the device, keep the architecture small, and avoid turning a lightweight extension into a service.
