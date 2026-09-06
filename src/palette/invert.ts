import { saveConfig, type Config } from '../main/data';
import { withViewTransition } from '../modules/viewtransition';
import { getThemeMode, getInvertKey } from './presets';
let neoFeatureActive = false;
export function enableInvert(): void {
  if (getThemeMode() !== 'dark' || neoFeatureActive) return;
  document.documentElement.classList.add('neo-palette-invert');
  neoFeatureActive = true;
}
export async function onInvertClick(): Promise<void> {
  const mode = getThemeMode();
  if (mode !== 'dark') return;
  const shouldEnable = !neoFeatureActive;
  const callback = () => {
    if (shouldEnable) {
      enableInvert();
    } else {
      destroyInvert();
    }
  };
  withViewTransition(callback);
  const key = getInvertKey(mode);
  const patch: Partial<Config> = {};
  patch[key] = shouldEnable;
  await saveConfig(patch);
}
export function initInvert(config: Config): void {
  const mode = getThemeMode();
  if (mode !== 'dark') return;
  const key = getInvertKey(mode);
  const enabled = config[key] ?? false;
  if (enabled) {
    enableInvert();
  }
}
export function destroyInvert(): void {
  neoFeatureActive = false;
  document.documentElement.classList.remove('neo-palette-invert');
}
