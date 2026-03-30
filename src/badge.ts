type Severity = "new" | "mild" | "warm" | "hot" | "moldy";

function getSeverity(count: number): Severity {
  if (count >= 11) return "moldy";
  if (count >= 7) return "hot";
  if (count >= 4) return "warm";
  if (count >= 2) return "mild";
  return "new";
}

const BADGE_CLASS = "paco-badge";

export function renderBadge(thumbnailLink: HTMLAnchorElement, count: number): void {
  const severity = getSeverity(count);

  // Remove existing badge if present
  const existing = thumbnailLink.querySelector(`.${BADGE_CLASS}`);
  if (existing) existing.remove();

  const badge = document.createElement("span");
  badge.className = `${BADGE_CLASS} paco-${severity}`;
  badge.textContent = severity === "new" ? `🦜 NEW` : `🦜 ${count}x`;
  badge.title =
    severity === "new"
      ? "First time Paco sees this video on your feed"
      : `Paco has seen YouTube push this video to you ${count} times`;

  thumbnailLink.style.position = "relative";
  thumbnailLink.appendChild(badge);
}
