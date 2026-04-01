import { cpSync, mkdirSync, readdirSync, rmSync, watch } from "node:fs";
import { join } from "node:path";

const OUTDIR = "dist";
const ASSETS_OUTDIR = join(OUTDIR, "assets");
const ASSETS_SRCDIR = "src/assets";
const isWatchMode = process.argv.includes("--watch");
const mode = isWatchMode ? "development" : "production";
let rebuildTimer: ReturnType<typeof setTimeout> | null = null;

function copyStaticFiles(): void {
  cpSync("src/paco.css", join(OUTDIR, "paco.css"));
  cpSync("src/popup.html", join(OUTDIR, "popup.html"));
  cpSync("src/popup.css", join(OUTDIR, "popup.css"));
  cpSync("manifest.json", join(OUTDIR, "manifest.json"));

  for (const assetName of readdirSync(ASSETS_SRCDIR)) {
    cpSync(join(ASSETS_SRCDIR, assetName), join(ASSETS_OUTDIR, assetName));
  }
}

async function runBuild(): Promise<void> {
  rmSync(OUTDIR, { force: true, recursive: true });
  mkdirSync(ASSETS_OUTDIR, { recursive: true });

  const result = await Bun.build({
    entrypoints: ["src/content.ts", "src/popup.ts"],
    outdir: OUTDIR,
    naming: "[name].js",
    minify: !isWatchMode,
    sourcemap: isWatchMode ? "inline" : "none",
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
    },
  });

  if (!result.success) {
    console.error(`[${mode}] Build failed`);
    for (const log of result.logs) {
      console.error(log);
    }
    return;
  }

  copyStaticFiles();
  console.log(`[${mode}] Build complete`);
}

function scheduleRebuild(changedPath?: string | null): void {
  if (rebuildTimer) {
    clearTimeout(rebuildTimer);
  }

  rebuildTimer = setTimeout(() => {
    const label = changedPath ? ` after ${changedPath}` : "";
    console.log(`[${mode}] Rebuilding${label}...`);
    runBuild().catch((error: unknown) => {
      console.error(`[${mode}] Rebuild error`, error);
    });
  }, 100);
}

await runBuild();

if (isWatchMode) {
  console.log(`[${mode}] Watching for changes...`);

  watch("src", { recursive: true }, (_eventType, filename) => {
    scheduleRebuild(filename);
  });

  watch(".", (_eventType, filename) => {
    if (filename === "manifest.json") {
      scheduleRebuild(filename);
    }
  });

  await new Promise(() => {});
}
