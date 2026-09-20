import { isDesktop } from '../modules/env';
function getSystemAccentColor(): string | null {
  try {
    const remote = require('@electron/remote');
    const color = remote.systemPreferences.getAccentColor();
    if (color && typeof color === 'string') {
      return `#${color}`;
    }
  } catch {}
  return null;
}
function applySystemAccentColor(): void {
  const color = getSystemAccentColor();
  if (color) {
    document.documentElement.style.setProperty('--neo-basefollowsystem-color', color);
  }
}
let focusHandler: (() => void) | null = null;
export function initBaseFollowSystem(): void {
  if (!isDesktop()) return;
  applySystemAccentColor();
  focusHandler = () => {
    applySystemAccentColor();
  };
  window.addEventListener('focus', focusHandler);
}
export function destroyBaseFollowSystem(): void {
  document.documentElement.style.removeProperty('--neo-basefollowsystem-color');
  if (focusHandler) {
    window.removeEventListener('focus', focusHandler);
    focusHandler = null;
  }
}
