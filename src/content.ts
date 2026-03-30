import { recordSighting, getSightingCount } from "./db";
import { scrapeVideoIds } from "./scraper";
import { renderBadge } from "./badge";

const sessionId = crypto.randomUUID();
let isProcessing = false;
let needsAnotherPass = false;

function isPacoMutationNode(node: Node): boolean {
  return (
    node instanceof Element &&
    (node.classList.contains("paco-badge-host") || node.closest(".paco-badge-host") !== null)
  );
}

function shouldIgnoreMutations(mutations: MutationRecord[]): boolean {
  return mutations.every(
    (mutation) =>
      [...mutation.addedNodes, ...mutation.removedNodes].length > 0 &&
      [...mutation.addedNodes, ...mutation.removedNodes].every((node) => isPacoMutationNode(node)),
  );
}

async function processVideos(): Promise<void> {
  if (isProcessing) {
    needsAnotherPass = true;
    return;
  }

  isProcessing = true;

  const videos = scrapeVideoIds();

  try {
    for (const { videoId, link } of videos) {
      await recordSighting(videoId, sessionId);

      const count = await getSightingCount(videoId);
      renderBadge(link, count);
    }
  } finally {
    isProcessing = false;
  }

  if (needsAnotherPass) {
    needsAnotherPass = false;
    await processVideos();
  }
}

// Initial scan
processVideos().catch((e) => console.error("[Paco] Error:", e));

// Watch for lazy-loaded videos
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const observer = new MutationObserver((mutations) => {
  if (shouldIgnoreMutations(mutations)) return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    processVideos().catch((e) => console.error("[Paco] Error:", e));
  }, 500);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
