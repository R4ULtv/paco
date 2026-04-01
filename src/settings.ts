export type PacoMode = "logs" | "block";

export interface PacoSettings {
  mode: PacoMode;
  blockThreshold: number;
}

const SETTINGS_KEY = "settings";
const MIN_BLOCK_THRESHOLD = 5;
const MAX_BLOCK_THRESHOLD = 20;

export const DEFAULT_SETTINGS: PacoSettings = {
  mode: "logs",
  blockThreshold: 10,
};

function clampBlockThreshold(value: number): number {
  return Math.min(MAX_BLOCK_THRESHOLD, Math.max(MIN_BLOCK_THRESHOLD, value));
}

function normalizeMode(value: unknown): PacoMode {
  return value === "block" ? "block" : "logs";
}

function normalizeBlockThreshold(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? clampBlockThreshold(Math.round(value))
    : DEFAULT_SETTINGS.blockThreshold;
}

export function normalizeSettings(value: unknown): PacoSettings {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_SETTINGS };
  }

  const candidate = value as Partial<PacoSettings>;

  return {
    mode: normalizeMode(candidate.mode),
    blockThreshold: normalizeBlockThreshold(candidate.blockThreshold),
  };
}

export async function getSettings(): Promise<PacoSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return normalizeSettings(result[SETTINGS_KEY]);
}

export async function setSettings(settings: PacoSettings): Promise<void> {
  await chrome.storage.local.set({
    [SETTINGS_KEY]: normalizeSettings(settings),
  });
}

export async function updateSettings(partial: Partial<PacoSettings>): Promise<PacoSettings> {
  const nextSettings = {
    ...(await getSettings()),
    ...partial,
  };

  const normalized = normalizeSettings(nextSettings);
  await setSettings(normalized);
  return normalized;
}

export function getSettingsFromStorageChange(changes: {
  [key: string]: chrome.storage.StorageChange;
}): PacoSettings | null {
  const change = changes[SETTINGS_KEY];
  if (!change) {
    return null;
  }

  return normalizeSettings(change.newValue);
}

export const settingsStorageKey = SETTINGS_KEY;
export const minBlockThreshold = MIN_BLOCK_THRESHOLD;
export const maxBlockThreshold = MAX_BLOCK_THRESHOLD;
