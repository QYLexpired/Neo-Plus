import type { Config } from '../main/data';
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
let _focusHandler: (() => void) | null = null;
export function initFollowSystem(config: Config): void {
  if (!isDesktop()) return;
  applySystemAccentColor();
  _focusHandler = () => {
    applySystemAccentColor();
  };
  window.addEventListener('focus', _focusHandler);
}
export function destroyFollowSystem(): void {
  document.documentElement.style.removeProperty('--neo-followsystem-base-color');
  if (_focusHandler) {
    window.removeEventListener('focus', _focusHandler);
    _focusHandler = null;
  }
}