import type { Config } from '../main/data';
import { getCurrentThemeMode, getFollowTimeBaseColorKey } from './presets';
export function initFollowTime(config: Config): void {
  const mode = getCurrentThemeMode();
  const followtimeColorKey = getFollowTimeBaseColorKey(mode);
  const followtimeColor = config[followtimeColorKey];
  if (followtimeColor) {
    document.documentElement.style.setProperty('--neo-followtime-base-color', followtimeColor);
  }
}
export function destroyFollowTime(): void {
  document.documentElement.style.removeProperty('--neo-followtime-base-color');
}
export function getFollowTimeColor(config?: Config): string {
  let currentColor = '';
  if (config) {
    const mode = getCurrentThemeMode();
    const colorKey = getFollowTimeBaseColorKey(mode);
    currentColor = config[colorKey] || '';
  }
  if (!currentColor) {
    currentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--neo-followtime-base-color').trim() ||
      getComputedStyle(document.documentElement)
        .getPropertyValue('--neo-default-base-color').trim() ||
      '#ffffff';
  }
  return currentColor;
}
export function createFollowTimeColorPickerHTML(config?: Config): string {
  const currentColor = getFollowTimeColor(config);
  return `<svg class="b3-menu__icon"><use xlink:href="#"></use></svg><input type="color" value="${currentColor}">`;
}
