import { saveConfig, type Config } from '../main/data';
import { withViewTransition } from '../modules/viewtransition';
import { getCurrentThemeMode, getInvertKey } from './presets';
let neoFeatureActive = false;
export function enableInvert(): void {
  if (neoFeatureActive) return;
  document.documentElement.classList.add('neo-palette-invert');
  neoFeatureActive = true;
}
export async function onInvertClick(): Promise<void> {
  const shouldEnable = !neoFeatureActive;
  const callback = () => {
    if (shouldEnable) {
      enableInvert();
    } else {
      destroyInvert();
    }
  };
  withViewTransition(callback);
  const mode = getCurrentThemeMode();
  const key = getInvertKey(mode);
  await saveConfig({ [key]: shouldEnable } as Partial<Config>);
}
export function initInvert(config: Config): void {
  const mode = getCurrentThemeMode();
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
