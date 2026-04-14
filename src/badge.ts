type Severity = "new" | "mild" | "warm" | "hot" | "moldy";

function getSeverity(count: number): Severity {
  if (count >= 11) return "moldy";
  if (count >= 7) return "hot";
  if (count >= 4) return "warm";
  if (count >= 2) return "mild";
  return "new";
}

const BADGE_CLASS = "paco-badge";
const BADGE_HOST_CLASS = "paco-badge-host";
const BADGE_TEXT_CLASS = "paco-badge__text";
const DURATION_BADGE_HOST_SELECTOR = `yt-thumbnail-badge-view-model.ytThumbnailBottomOverlayViewModelBadge:not(.${BADGE_HOST_CLASS})`;
const LEGACY_DURATION_BADGE_SELECTOR =
  "ytd-thumbnail-overlay-time-status-renderer, badge-shape.yt-badge-shape--thumbnail-badge";
const DEFAULT_BADGE_SHAPE_CLASSES = [
  "yt-badge-shape",
  "yt-badge-shape--thumbnail-default",
  "yt-badge-shape--thumbnail-badge",
  "yt-badge-shape--typography",
  "ytBadgeShapeHost",
  "ytBadgeShapeThumbnailDefault",
  "ytBadgeShapeThumbnailBadge",
  "ytBadgeShapeTypography",
].join(" ");
const DEFAULT_BADGE_TEXT_CLASSES = ["yt-badge-shape__text", "ytBadgeShapeText"].join(" ");

function getDurationBadge(thumbnailLink: HTMLAnchorElement): HTMLElement | null {
  const hostBadge = thumbnailLink.querySelector<HTMLElement>(DURATION_BADGE_HOST_SELECTOR);
  if (hostBadge) {
    return hostBadge;
  }

  const legacyBadges = thumbnailLink.querySelectorAll<HTMLElement>(LEGACY_DURATION_BADGE_SELECTOR);
  for (const candidate of legacyBadges) {
    if (candidate.closest(`.${BADGE_HOST_CLASS}`)) continue;
    return candidate;
  }

  return null;
}

function applyInlineTheme(badge: HTMLElement, text: HTMLDivElement, severity: Severity): void {
  if (severity === "new") {
    badge.style.setProperty("background", "#ff0033", "important");
    badge.style.setProperty("color", "#ffffff", "important");
    text.style.setProperty("color", "#ffffff", "important");
    badge.style.removeProperty("box-shadow");
    return;
  }

  badge.style.removeProperty("background");
  badge.style.removeProperty("color");
  badge.style.removeProperty("box-shadow");
  text.style.removeProperty("color");
}

function mergeClassNames(...classNames: Array<string | null | undefined>): string {
  const tokens = new Set<string>();

  for (const className of classNames) {
    if (!className) continue;

    for (const token of className.split(/\s+/)) {
      if (!token) continue;
      tokens.add(token);
    }
  }

  return [...tokens].join(" ");
}

function getBadgeShapeTemplate(thumbnailLink: HTMLAnchorElement): HTMLElement | null {
  const durationBadge = getDurationBadge(thumbnailLink);
  if (!durationBadge) {
    return null;
  }

  if (durationBadge.matches("badge-shape")) {
    return durationBadge;
  }

  return durationBadge.querySelector<HTMLElement>("badge-shape");
}

function getBadgeCopy(count: number, severity: Severity): { label: string; title: string } {
  return {
    label: severity === "new" ? "NEW" : `${count}x`,
    title:
      severity === "new"
        ? "First time Paco sees this video on your feed"
        : `Paco has seen YouTube push this video to you ${count} times`,
  };
}

function getOrCreateBadgeHost(thumbnailLink: HTMLAnchorElement): HTMLElement {
  const host =
    thumbnailLink.querySelector<HTMLElement>(`.${BADGE_HOST_CLASS}`) ??
    document.createElement("yt-thumbnail-badge-view-model");
  host.className = `${BADGE_HOST_CLASS} ytThumbnailBadgeViewModelHost ytThumbnailBottomOverlayViewModelBadge`;

  return host;
}

function updateBadgeContent(
  thumbnailLink: HTMLAnchorElement,
  host: HTMLElement,
  label: string,
  title: string,
  severity: Severity,
): void {
  const template = getBadgeShapeTemplate(thumbnailLink);
  const badge =
    host.querySelector<HTMLElement>("badge-shape") ?? document.createElement("badge-shape");
  badge.className = mergeClassNames(
    BADGE_CLASS,
    `paco-${severity}`,
    template?.className,
    DEFAULT_BADGE_SHAPE_CLASSES,
  );

  const text =
    badge.querySelector<HTMLDivElement>(`.${BADGE_TEXT_CLASS}`) ?? document.createElement("div");
  text.className = mergeClassNames(
    BADGE_TEXT_CLASS,
    template?.querySelector<HTMLElement>("div")?.className,
    DEFAULT_BADGE_TEXT_CLASSES,
  );

  if (text.textContent !== label) {
    text.textContent = label;
  }
  if (badge.title !== title) {
    badge.title = title;
    badge.setAttribute("aria-label", title);
  }
  if (text.parentElement !== badge) {
    badge.appendChild(text);
  }
  if (badge.parentElement !== host) {
    host.appendChild(badge);
  }

  applyInlineTheme(badge, text, severity);
}

function placeBadgeHost(thumbnailLink: HTMLAnchorElement, host: HTMLElement): void {
  const durationBadge = getDurationBadge(thumbnailLink);
  if (durationBadge?.parentElement) {
    const targetParent = durationBadge.parentElement;
    host.classList.remove("paco-badge--floating");

    if (durationBadge === host || durationBadge.contains(host)) {
      return;
    }
    if (host.parentElement !== targetParent || host.nextElementSibling !== durationBadge) {
      targetParent.insertBefore(host, durationBadge);
    }
    return;
  }

  const fallbackContainer =
    thumbnailLink.querySelector<HTMLElement>(
      "#overlays, ytd-thumbnail-overlay-toggle-button-renderer",
    ) ?? thumbnailLink;

  thumbnailLink.style.position = "relative";
  if (!host.classList.contains("paco-badge--floating")) {
    host.classList.add("paco-badge--floating");
  }
  if (host.parentElement !== fallbackContainer) {
    fallbackContainer.appendChild(host);
  }
}

export function renderBadge(thumbnailLink: HTMLAnchorElement, count: number): void {
  const severity = getSeverity(count);
  const { label, title } = getBadgeCopy(count, severity);
  const host = getOrCreateBadgeHost(thumbnailLink);

  updateBadgeContent(thumbnailLink, host, label, title, severity);
  placeBadgeHost(thumbnailLink, host);
}

export function removeBadge(thumbnailLink: HTMLAnchorElement): void {
  thumbnailLink.querySelector<HTMLElement>(`.${BADGE_HOST_CLASS}`)?.remove();
}
