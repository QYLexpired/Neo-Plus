import type { Config } from '../main/data';
import { getThemeMode, getCustomColorKey } from './presets';
export function getThemeColor(config?: Config): string {
  if (config) {
    const mode = getThemeMode();
    const colorKey = getCustomColorKey(mode);
    const color = config[colorKey as keyof Config] as string | undefined;
    if (color) return color;
  }
  const cssColor = getComputedStyle(document.documentElement).getPropertyValue('--neo-custom-base-color').trim();
  if (cssColor) return cssColor;
  const defaultColor = getComputedStyle(document.documentElement).getPropertyValue('--neo-default-base-color').trim();
  return defaultColor || '#ffffff';
}
export function createColorPickerHTML(config?: Config): string {
  const currentColor = getThemeColor(config);
  const id = `neo-color-input-${Date.now()}`;
  return `<svg class="b3-menu__icon"><use xlink:href="#"></use></svg><input type="color" id="${id}" value="${currentColor}">`;
}
export function initCustomColor(config: Config): void {
  const mode = getThemeMode();
  const colorKey = getCustomColorKey(mode);
  const color = config[colorKey as keyof Config] as string | undefined;
  if (color) {
    document.documentElement.style.setProperty('--neo-custom-base-color', color);
  }
}
export function destroyCustomColor(): void {
  document.documentElement.style.removeProperty('--neo-custom-base-color');
}
