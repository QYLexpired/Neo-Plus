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
    document.documentElement.style.setProperty('--neo-followsystem-base-color', color);
  }
}
let focusHandler: (() => void) | null = null;
export function initFollowSystem(): void {
  if (!isDesktop()) return;
  applySystemAccentColor();
  focusHandler = () => {
    applySystemAccentColor();
  };
  window.addEventListener('focus', focusHandler);
}
export function destroyFollowSystem(): void {
  document.documentElement.style.removeProperty('--neo-followsystem-base-color');
  if (focusHandler) {
    window.removeEventListener('focus', focusHandler);
    focusHandler = null;
  }
}
