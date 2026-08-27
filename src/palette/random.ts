import { getCurrentThemeMode, getPresetsByMode } from './presets';
import type { Preset } from './presets';
interface LastRandomState {
  type: 'preset' | 'custom';
  presetKey?: string;
  color?: string;
  saturation?: number;
  brightness?: number;
  inverted?: boolean;
  highContrast?: boolean;
}
let lastState: LastRandomState | null = null;
function randomHexColor(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
function randomHexColorDifferentFrom(previous: string): string {
  let color: string;
  let attempts = 0;
  do {
    color = randomHexColor();
    attempts++;
  } while (color === previous && attempts < 20);
  return color;
}
function randomSaturation(): number {
  const r = Math.random();
  if (r < 0.45) {
    return Math.round((Math.random() * 1.5) * 100) / 100;
  } else if (r < 0.9) {
    return Math.round((1.5 + Math.random() * 1.5) * 100) / 100;
  } else {
    return Math.round((3 + Math.random() * 2) * 100) / 100;
  }
}
function randomSaturationDifferentFrom(previous: number): number {
  let saturation: number;
  let attempts = 0;
  do {
    saturation = randomSaturation();
    attempts++;
  } while (saturation === previous && attempts < 20);
  return saturation;
}
function randomBrightness(): number {
  const r = Math.random();
  if (r < 0.6) {
    return Math.round((Math.random() * 0.6 - 0.3) * 100) / 100;
  } else if (r < 0.9) {
    const sign = Math.random() < 0.5 ? -1 : 1;
    return Math.round((sign * (0.3 + Math.random() * 0.3)) * 100) / 100;
  } else {
    const sign = Math.random() < 0.5 ? -1 : 1;
    return Math.round((sign * (0.6 + Math.random() * 0.4)) * 100) / 100;
  }
}
function randomBrightnessDifferentFrom(previous: number): number {
  let brightness: number;
  let attempts = 0;
  do {
    brightness = randomBrightness();
    attempts++;
  } while (brightness === previous && attempts < 20);
  return brightness;
}
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomPickDifferentPreset(arr: Preset[], previousKey: string): Preset {
  const filtered = arr.filter(p => p.key !== previousKey);
  if (filtered.length === 0) return randomPick(arr);
  return randomPick(filtered);
}
export function destroyRandom(): void {
  const html = document.documentElement;
  html.style.removeProperty('--neo-custom-base-color');
  html.style.removeProperty('--neo-saturation');
  html.style.removeProperty('--neo-brightness');
  html.classList.remove('neo-palette-invert', 'neo-palette-highcontrast');
}
export function initRandom(): void {
  const html = document.documentElement;
  const mode = getCurrentThemeMode();
  html.classList.remove(
    ...Array.from(html.classList).filter(cls => cls.startsWith('neo-palette-') && cls !== 'neo-palette-random')
  );
  html.style.removeProperty('--neo-custom-base-color');
  html.style.removeProperty('--neo-saturation');
  html.style.removeProperty('--neo-brightness');
  html.classList.remove('neo-palette-invert', 'neo-palette-highcontrast');
  const choosePreset = Math.random() < 0.3;
  if (choosePreset) {
    const available = getPresetsByMode(mode);
    if (available.length > 0) {
      const preset = lastState?.type === 'preset' && lastState.presetKey
        ? randomPickDifferentPreset(available, lastState.presetKey)
        : randomPick(available);
      html.classList.add(`neo-palette-${preset.key}`);
      lastState = { type: 'preset', presetKey: preset.key };
    }
  } else {
    html.classList.add('neo-palette-custom');
    const color = lastState?.type === 'custom' && lastState.color
      ? randomHexColorDifferentFrom(lastState.color)
      : randomHexColor();
    const saturation = lastState?.type === 'custom' && lastState.saturation !== undefined
      ? randomSaturationDifferentFrom(lastState.saturation)
      : randomSaturation();
    const brightness = lastState?.type === 'custom' && lastState.brightness !== undefined
      ? randomBrightnessDifferentFrom(lastState.brightness)
      : randomBrightness();
    const inverted = Math.random() < 0.5;
    const finalInverted = lastState?.type === 'custom'
      && color === lastState.color
      && saturation === lastState.saturation
      && brightness === lastState.brightness
      && inverted === lastState.inverted
      ? !inverted
      : inverted;
    const highContrast = Math.random() < 0.15;
    const finalHighContrast = lastState?.type === 'custom'
      && color === lastState.color
      && saturation === lastState.saturation
      && brightness === lastState.brightness
      && highContrast === lastState.highContrast
      ? !highContrast
      : highContrast;
    html.style.setProperty('--neo-custom-base-color', color);
    html.style.setProperty('--neo-saturation', String(saturation));
    html.style.setProperty('--neo-brightness', String(brightness));
    if (finalInverted) {
      html.classList.add('neo-palette-invert');
    }
    if (finalHighContrast) {
      html.classList.add('neo-palette-highcontrast');
    }
    lastState = { type: 'custom', color, saturation, brightness, inverted: finalInverted, highContrast: finalHighContrast };
  }
}