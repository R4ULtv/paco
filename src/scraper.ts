export interface ScrapedVideo {
  videoId: string;
  link: HTMLAnchorElement;
  renderer: Element;
}

const THUMBNAIL_LINK_SELECTORS = [
  "a.ytLockupViewModelContentImage",
  "a.yt-lockup-view-model__content-image",
  "a#thumbnail",
  "a[aria-hidden='true'][href^='/watch']",
];

function extractVideoId(href: string): string | null {
  try {
    const url = new URL(href, window.location.origin);

    if (url.pathname === "/watch") {
      const queryVideoId = url.searchParams.get("v");
      if (queryVideoId && /^[a-zA-Z0-9_-]{11}$/.test(queryVideoId)) {
        return queryVideoId;
      }
    }

    const pathMatch = url.pathname.match(/\/watch\/([a-zA-Z0-9_-]{11})(?:\/|$)/);
    if (pathMatch) {
      return pathMatch[1]!;
    }
  } catch {
    return null;
  }

  return null;
}

export function isPlaylistCard(renderer: Element, link: HTMLAnchorElement, href: string): boolean {
  if (
    renderer.querySelector(
      [
        "yt-collections-stack",
        "yt-collection-thumbnail-view-model",
        "ytd-rich-grid-playlist-renderer",
        "ytd-playlist-thumbnail",
        "[class*='collection-stack']",
        "a[href*='/playlist?list=']",
      ].join(", "),
    )
  ) {
    return true;
  }

  return href.includes("/playlist") || href.includes("list=") || link.matches("[is-playlist]");
}

function findThumbnailLink(renderer: Element): HTMLAnchorElement | null {
  for (const selector of THUMBNAIL_LINK_SELECTORS) {
    const link = renderer.querySelector<HTMLAnchorElement>(selector);
    if (!link) continue;

    const href = link.getAttribute("href");
    if (href?.includes("/watch")) {
      return link;
    }
  }

  return null;
}

export function scrapeVideoIds(): ScrapedVideo[] {
  const videos: ScrapedVideo[] = [];

  const renderers = document.querySelectorAll("ytd-rich-item-renderer");

  for (const renderer of renderers) {
    const link = findThumbnailLink(renderer);
    if (!link) continue;

    const href = link.getAttribute("href");
    if (!href) continue;
    if (isPlaylistCard(renderer, link, href)) continue;

    const videoId = extractVideoId(href);
    if (!videoId) continue;

    videos.push({ videoId, link, renderer });
  }

  return videos;
}
