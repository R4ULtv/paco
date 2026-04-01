import {
  getSettings,
  maxBlockThreshold,
  minBlockThreshold,
  updateSettings,
  type PacoMode,
} from "./settings";

const modeInputs = document.querySelectorAll<HTMLInputElement>('input[name="mode"]');
const thresholdInput = document.querySelector<HTMLInputElement>("#block-threshold");
const thresholdValue = document.querySelector<HTMLElement>("#block-threshold-value");
const thresholdSection = document.querySelector<HTMLElement>("#block-threshold-section");
const modeDescription = document.querySelector<HTMLElement>("#mode-description");

if (
  !thresholdInput ||
  !thresholdValue ||
  !thresholdSection ||
  !modeDescription ||
  modeInputs.length === 0
) {
  throw new Error("Popup UI is missing required elements");
}

const blockThresholdInput = thresholdInput;
const blockThresholdValue = thresholdValue;
const blockThresholdSection = thresholdSection;
const popupModeDescription = modeDescription;

blockThresholdInput.min = String(minBlockThreshold);
blockThresholdInput.max = String(maxBlockThreshold);

function renderThresholdValue(value: number): void {
  blockThresholdValue.textContent = `${value} videos`;
}

function renderMode(mode: PacoMode): void {
  for (const input of modeInputs) {
    input.checked = input.value === mode;
  }

  blockThresholdSection.hidden = mode !== "block";
  popupModeDescription.textContent =
    mode === "block" ? "Hide repeats once they cross the limit." : "Track repeated videos only.";
}

async function renderSettings(): Promise<void> {
  const settings = await getSettings();
  blockThresholdInput.value = String(settings.blockThreshold);
  renderThresholdValue(settings.blockThreshold);
  renderMode(settings.mode);
}

for (const input of modeInputs) {
  input.addEventListener("change", () => {
    if (!input.checked) {
      return;
    }

    const mode = input.value === "block" ? "block" : "logs";
    renderMode(mode);
    void updateSettings({ mode });
  });
}

blockThresholdInput.addEventListener("input", () => {
  const value = Number.parseInt(blockThresholdInput.value, 10);
  renderThresholdValue(value);
  void updateSettings({ blockThreshold: value });
});

void renderSettings();
