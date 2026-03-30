![Paco](./src/assets/og-image.webp)

**Paco remembers what YouTube keeps repeating to you.**

Paco is a Chrome extension that tracks repeated videos on the YouTube home feed and adds a small badge when a video has already been shown to you before.

## Install (Release)

Paco is installed from the latest release package: [Download the latest release](../../releases/latest).

1. Go to the project's **Releases** page on GitHub.
2. Download the latest `.zip` release asset.
3. Unzip it on your computer.
4. Open `chrome://extensions` in Chrome.
5. Enable **Developer mode**.
6. Click **Load unpacked**.
7. Select the unzipped release folder.

After install, open YouTube and Paco will start marking repeated videos on your home feed.

## Privacy

Paco runs entirely locally. No analytics, no backend, no telemetry.

## Why Not Sync Across Devices?

Sync is intentionally out of scope for now.

Paco is designed to be fast, local-first, and privacy-first. Adding cross-device sync would mean introducing user accounts, a central database, conflict handling, and additional security work. That would add several layers of complexity and risk that do not fit the current goals of the project.

For now, the product direction is simple: keep data on the device, keep the architecture small, and avoid turning a lightweight extension into a service.
