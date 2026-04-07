import { deleteExpiredSightings, recordSighting, getSightingCount } from "./db";
import { scrapeVideoIds } from "./scraper";
import { renderBadge, removeBadge } from "./badge";
import {
  DEFAULT_SETTINGS,
  getSettings,
  getSettingsFromStorageChange,
  type PacoSettings,
} from "./settings";

interface ObservedVideo {
  videoId: string;
  link: HTMLAnchorElement;
  count?: number;
  countPromise?: Promise<number>;
  hasBeenHandled?: boolean;
  sessionId?: string;
}

const PROCESS_VIDEOS_DEBOUNCE_MS = 120;
const HIDDEN_VIDEO_CLASS = "paco-hidden-video";
let sessionId = crypto.randomUUID();
let isProcessing = false;
let needsAnotherPass = false;
let lastKnownUrl = window.location.href;
let currentSettings: PacoSettings = { ...DEFAULT_SETTINGS };
const rendererVideoMap = new Map<Element, ObservedVideo>();

function isYouTubeHomePage(): boolean {
  return window.location.pathname === "/";
}

function shouldHideVideo(count: number, settings: PacoSettings): boolean {
  return settings.mode === "block" && count > settings.blockThreshold;
}

function setRendererHidden(renderer: Element, hidden: boolean): void {
  renderer.classList.toggle(HIDDEN_VIDEO_CLASS, hidden);
}

function preloadCount(renderer: Element, video: ObservedVideo): Promise<number> {
  if (video.count !== undefined) {
    return Promise.resolve(video.count);
  }

  if (video.countPromise) {
    return video.countPromise;
  }

  video.countPromise = getSightingCount(video.videoId).then((count) => {
    video.count = count;
    video.countPromise = undefined;
    return count;
  });

  return video.countPromise;
}

async function applyVisibility(renderer: Element, video: ObservedVideo): Promise<number | null> {
  if (!isYouTubeHomePage() || !renderer.isConnected || !video.link.isConnected) {
    return null;
  }

  const count = await preloadCount(renderer, video);
  if (!isYouTubeHomePage()) {
    return null;
  }

  const hidden = shouldHideVideo(count, currentSettings);
  setRendererHidden(renderer, hidden);

  if (!hidden) {
    renderBadge(video.link, count);
  }

  return count;
}

async function handleVisibleVideo(renderer: Element, video: ObservedVideo): Promise<void> {
  if (
    !isYouTubeHomePage() ||
    !renderer.isConnected ||
    !video.link.isConnected ||
    (video.hasBeenHandled && video.sessionId === sessionId)
  ) {
    return;
  }

  video.hasBeenHandled = true;
  video.sessionId = sessionId;

  let countBefore = video.count;
  if (countBefore === undefined) {
    countBefore = await preloadCount(renderer, video);
  }
  if (!isYouTubeHomePage()) {
    return;
  }

  const wasInserted = await recordSighting(video.videoId, sessionId);
  if (!isYouTubeHomePage()) {
    return;
  }

  const nextCount = wasInserted ? countBefore + 1 : countBefore;

  video.count = nextCount;
  setRendererHidden(renderer, shouldHideVideo(nextCount, currentSettings));

  if (!renderer.classList.contains(HIDDEN_VIDEO_CLASS)) {
    renderBadge(video.link, nextCount);
  }
}

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

const preloadObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const video = rendererVideoMap.get(entry.target);
      if (!video) continue;

      void applyVisibility(entry.target, video);
      preloadObserver.unobserve(entry.target);
    }
  },
  {
    rootMargin: "300px 0px",
    threshold: 0,
  },
);

const visibilityObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const video = rendererVideoMap.get(entry.target);
      if (!video) continue;

      visibilityObserver.unobserve(entry.target);
      void handleVisibleVideo(entry.target, video).catch((e) => console.error("[Paco] Error:", e));
    }
  },
  {
    threshold: 0.5,
  },
);

function observeRenderer(renderer: Element, videoId: string, link: HTMLAnchorElement): void {
  const currentVideo = rendererVideoMap.get(renderer);
  if (currentVideo?.videoId === videoId && currentVideo.link === link) {
    void applyVisibility(renderer, currentVideo);
    return;
  }

  rendererVideoMap.set(renderer, { videoId, link });
  preloadObserver.unobserve(renderer);
  visibilityObserver.unobserve(renderer);
  setRendererHidden(renderer, false);
  preloadObserver.observe(renderer);
  visibilityObserver.observe(renderer);
  void applyVisibility(renderer, rendererVideoMap.get(renderer)!).catch((e) =>
    console.error("[Paco] Error:", e),
  );
}

function clearObservedRenderers(): void {
  for (const [renderer, video] of rendererVideoMap) {
    preloadObserver.unobserve(renderer);
    visibilityObserver.unobserve(renderer);
    setRendererHidden(renderer, false);
    removeBadge(video.link);
  }

  rendererVideoMap.clear();
}

async function reapplySettings(): Promise<void> {
  if (!isYouTubeHomePage()) {
    clearObservedRenderers();
    return;
  }

  const tasks: Promise<unknown>[] = [];

  for (const [renderer, video] of rendererVideoMap) {
    if (!renderer.isConnected || !video.link.isConnected) {
      rendererVideoMap.delete(renderer);
      continue;
    }

    tasks.push(applyVisibility(renderer, video));
  }

  await Promise.all(tasks);
}

function pruneObservedRenderers(): void {
  for (const [renderer, video] of rendererVideoMap) {
    if (!renderer.isConnected || !video.link.isConnected) {
      preloadObserver.unobserve(renderer);
      visibilityObserver.unobserve(renderer);
      rendererVideoMap.delete(renderer);
    }
  }
}

async function processVideos(): Promise<void> {
  if (!isYouTubeHomePage()) {
    clearObservedRenderers();
    return;
  }

  if (isProcessing) {
    needsAnotherPass = true;
    return;
  }

  isProcessing = true;

  try {
    pruneObservedRenderers();

    const videos = scrapeVideoIds();
    for (const { videoId, link, renderer } of videos) {
      observeRenderer(renderer, videoId, link);
    }
  } finally {
    isProcessing = false;
  }

  if (needsAnotherPass) {
    needsAnotherPass = false;
    await processVideos();
  }
}

async function initializePaco(): Promise<void> {
  currentSettings = await getSettings();
  await deleteExpiredSightings();
  await processVideos();
}

// Initial scan
initializePaco().catch((e) => console.error("[Paco] Error:", e));

// Watch for lazy-loaded videos
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleProcessVideos(delayMs = 500): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    processVideos().catch((e) => console.error("[Paco] Error:", e));
  }, delayMs);
}

function refreshSessionIfNeeded(): void {
  const currentUrl = window.location.href;
  if (currentUrl === lastKnownUrl) {
    return;
  }

  lastKnownUrl = currentUrl;
  sessionId = crypto.randomUUID();
}

const observer = new MutationObserver((mutations) => {
  if (shouldIgnoreMutations(mutations)) return;

  scheduleProcessVideos(PROCESS_VIDEOS_DEBOUNCE_MS);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

window.addEventListener("yt-navigate-finish", () => {
  refreshSessionIfNeeded();
  scheduleProcessVideos(0);
});

window.addEventListener("yt-page-data-updated", () => {
  refreshSessionIfNeeded();
  scheduleProcessVideos(0);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  const nextSettings = getSettingsFromStorageChange(changes);
  if (!nextSettings) {
    return;
  }

  currentSettings = nextSettings;
  void reapplySettings().catch((e) => console.error("[Paco] Error:", e));
});
