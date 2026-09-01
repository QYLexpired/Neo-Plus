import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { createNeoLifecycleGuard } from '../main/lifecycle';
export function initColoredLists(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    if (config['colored-lists'] === true) {
      ensureCss('element-coloredlists', featureCss['element-coloredlists']);
      document.documentElement.classList.add('neo-element-coloredlists');
    }
  });
}
export function onColoredListsClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-element-coloredlists');
  if (isActive) {
    destroyColoredLists();
    saveConfig({ 'colored-lists': false } as Partial<Config>);
  } else {
    ensureCss('element-coloredlists', featureCss['element-coloredlists']);
    htmlEl.classList.add('neo-element-coloredlists');
    saveConfig({ 'colored-lists': true } as Partial<Config>);
  }
}
export function destroyColoredLists(): void {
  removeCss('element-coloredlists');
  document.documentElement?.classList.remove('neo-element-coloredlists');
}
