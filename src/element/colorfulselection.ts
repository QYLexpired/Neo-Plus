import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { createNeoLifecycleGuard } from '../main/lifecycle';
export function initColorfulSelection(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    if (config['colorful-selection'] === true) {
      ensureCss('element-colorfulselection', featureCss['element-colorfulselection']);
      document.documentElement.classList.add('neo-element-colorfulselection');
    }
  });
}
export function onColorfulSelectionClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-element-colorfulselection');
  if (isActive) {
    destroyColorfulSelection();
    saveConfig({ 'colorful-selection': false } as Partial<Config>);
  } else {
    ensureCss('element-colorfulselection', featureCss['element-colorfulselection']);
    htmlEl.classList.add('neo-element-colorfulselection');
    saveConfig({ 'colorful-selection': true } as Partial<Config>);
  }
}
export function destroyColorfulSelection(): void {
  removeCss('element-colorfulselection');
  document.documentElement?.classList.remove('neo-element-colorfulselection');
}
