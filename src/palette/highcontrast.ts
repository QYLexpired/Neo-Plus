import { isMobile } from '../modules/env';
import { saveConfig, type Config } from '../main/data';
import { withViewTransition } from '../modules/viewtransition';
import { getThemeMode, getHighContrastKey } from './presets';
let neoFeatureActive = false;
export function enableHighContrast(): void {
  if (isMobile() || getThemeMode() !== 'light' || neoFeatureActive) return;
  document.documentElement.classList.add('neo-palette-highcontrast');
  neoFeatureActive = true;
}
export function onHighContrastClick(): void {
  if (isMobile()) return;
  const mode = getThemeMode();
  if (mode !== 'light') return;
  const shouldEnable = !neoFeatureActive;
  const callback = () => {
    if (shouldEnable) {
      enableHighContrast();
    } else {
      destroyHighContrast();
    }
  };
  withViewTransition(callback);
  const key = getHighContrastKey(mode);
  const patch: Partial<Config> = {};
  patch[key] = shouldEnable;
  saveConfig(patch);
}
export function initHighContrast(config: Config): void {
  if (isMobile()) return;
  const mode = getThemeMode();
  if (mode !== 'light') return;
  const key = getHighContrastKey(mode);
  const enabled = config[key] ?? false;
  if (enabled) {
    enableHighContrast();
  }
}
export function destroyHighContrast(): void {
  neoFeatureActive = false;
  document.documentElement.classList.remove('neo-palette-highcontrast');
}
