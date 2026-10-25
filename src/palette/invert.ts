import { saveConfig, type Config } from '../main/data';
import { withViewTransition } from '../modules/viewtransition';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { getThemeMode, getInvertKey } from './presets';
let neoFeatureActive = false;
let actionRevision = 0;
export function enableInvert(): void {
  if (getThemeMode() !== 'dark' || neoFeatureActive) return;
  document.documentElement.classList.add('neo-palette-invert');
  neoFeatureActive = true;
}
export async function onInvertClick(): Promise<void> {
  const mode = getThemeMode();
  if (mode !== 'dark') return;
  const revision = ++actionRevision;
  const shouldEnable = !neoFeatureActive;
  const isCurrent = createNeoLifecycleGuard();
  const callback = () => {
    if (!isCurrent() || revision !== actionRevision || getThemeMode() !== mode) return;
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
  actionRevision += 1;
  const mode = getThemeMode();
  if (mode !== 'dark') return;
  const key = getInvertKey(mode);
  const enabled = config[key] === true;
  if (enabled) {
    enableInvert();
  }
}
export function destroyInvert(): void {
  neoFeatureActive = false;
  actionRevision += 1;
  document.documentElement.classList.remove('neo-palette-invert');
}
