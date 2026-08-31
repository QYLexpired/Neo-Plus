import { saveConfig, type Config } from '../main/data';
import { withViewTransition } from '../modules/viewtransition';
import { getCurrentThemeMode, getInvertKey } from './presets';
export async function onInvertClick(): Promise<void> {
  const html = document.documentElement;
  const enabled = html.classList.contains('neo-palette-invert');
  const callback = () => {
    if (enabled) {
      html.classList.remove('neo-palette-invert');
    } else {
      html.classList.add('neo-palette-invert');
    }
  };
  withViewTransition(callback);
  const mode = getCurrentThemeMode();
  const key = getInvertKey(mode);
  await saveConfig({ [key]: !enabled } as Partial<Config>);
}
export function initInvert(config: Config): void {
  const mode = getCurrentThemeMode();
  const key = getInvertKey(mode);
  const enabled = config[key] ?? false;
  if (enabled) {
    document.documentElement.classList.add('neo-palette-invert');
  }
}
export function destroyInvert(): void {
  document.documentElement.classList.remove('neo-palette-invert');
}
