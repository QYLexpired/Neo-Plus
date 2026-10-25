import { isMobile } from '../modules/env';
import { saveConfig, type Config } from '../main/data';
import { withViewTransition } from '../modules/viewtransition';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { getThemeMode, getHighContrastKey } from './presets';
let neoFeatureActive = false;
let actionRevision = 0;
export function enableHighContrast(): void {
  if (isMobile() || getThemeMode() !== 'light' || neoFeatureActive) return;
  document.documentElement.classList.add('neo-palette-highcontrast');
  neoFeatureActive = true;
}
export function onHighContrastClick(): void {
  if (isMobile()) return;
  const mode = getThemeMode();
  if (mode !== 'light') return;
  const revision = ++actionRevision;
  const shouldEnable = !neoFeatureActive;
  const isCurrent = createNeoLifecycleGuard();
  const callback = () => {
    if (!isCurrent() || revision !== actionRevision || getThemeMode() !== mode) return;
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
  actionRevision += 1;
  if (isMobile()) return;
  const mode = getThemeMode();
  if (mode !== 'light') return;
  const key = getHighContrastKey(mode);
  const enabled = config[key] === true;
  if (enabled) {
    enableHighContrast();
  }
}
export function destroyHighContrast(): void {
  neoFeatureActive = false;
  actionRevision += 1;
  document.documentElement.classList.remove('neo-palette-highcontrast');
}
