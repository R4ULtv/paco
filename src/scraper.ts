export interface ScrapedVideo {
  videoId: string;
  link: HTMLAnchorElement;
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

    const match = href.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (!match) continue;

    const videoId = match[1]!;
    if (seen.has(videoId)) continue;
    seen.add(videoId);

    videos.push({ videoId, link });
  }

  return videos;
}
