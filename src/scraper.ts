export interface ScrapedVideo {
  videoId: string;
  link: HTMLAnchorElement;
}

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

export function scrapeVideoIds(): ScrapedVideo[] {
  const seen = new Set<string>();
  const videos: ScrapedVideo[] = [];

  const renderers = document.querySelectorAll("ytd-rich-item-renderer");

  for (const renderer of renderers) {
    const link = renderer.querySelector<HTMLAnchorElement>(
      "a.yt-lockup-view-model__content-image, a#thumbnail",
    );
    if (!link) continue;

    const href = link.getAttribute("href");
    if (!href) continue;
    if (isPlaylistCard(renderer, link, href)) continue;

    const videoId = extractVideoId(href);
    if (!videoId) continue;
    if (seen.has(videoId)) continue;
    seen.add(videoId);

    videos.push({ videoId, link });
  }

  return videos;
}
