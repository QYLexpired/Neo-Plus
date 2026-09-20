import type { Config } from '../main/data';
import { getThemeMode, getBaseCustomColorKey } from './presets';
export function getBaseCustomColor(config?: Config): string {
  if (config) {
    const mode = getThemeMode();
    const colorKey = getBaseCustomColorKey(mode);
    const color = config[colorKey as keyof Config] as string | undefined;
    if (color) return color;
  }
  const cssColor = getComputedStyle(document.documentElement).getPropertyValue('--neo-base').trim();
  if (cssColor) return cssColor;
  const defaultColor = getComputedStyle(document.documentElement).getPropertyValue('--neo-default-base').trim();
  return defaultColor || '#ffffff';
}
export function createBaseCustomPickerHTML(config?: Config): string {
  const currentColor = getBaseCustomColor(config);
  const id = `neo-basecustom-input-${Date.now()}`;
  return `<svg class="b3-menu__icon"><use xlink:href="#"></use></svg><input type="color" id="${id}" value="${currentColor}">`;
}
export function initBaseCustom(config: Config): void {
  const mode = getThemeMode();
  const colorKey = getBaseCustomColorKey(mode);
  const color = config[colorKey as keyof Config] as string | undefined;
  if (color) {
    document.documentElement.style.setProperty('--neo-base', color);
  }
}
export function destroyBaseCustom(): void {
  document.documentElement.style.removeProperty('--neo-base');
}
