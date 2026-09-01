import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let neoFeatureActive = false;
function enableColorfulSelection(): void {
  if (neoFeatureActive) return;
  ensureCss('element-colorfulselection', featureCss['element-colorfulselection']);
  document.documentElement.classList.add('neo-element-colorfulselection');
  neoFeatureActive = true;
}
export function initColorfulSelection(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    if (config['colorful-selection'] === true) {
      enableColorfulSelection();
    }
  });
}
export function onColorfulSelectionClick(): void {
  if (neoFeatureActive) {
    destroyColorfulSelection();
    saveConfig({ 'colorful-selection': false } as Partial<Config>);
  } else {
    enableColorfulSelection();
    saveConfig({ 'colorful-selection': true } as Partial<Config>);
  }
}
export function destroyColorfulSelection(): void {
  neoFeatureActive = false;
  removeCss('element-colorfulselection');
  document.documentElement?.classList.remove('neo-element-colorfulselection');
}
