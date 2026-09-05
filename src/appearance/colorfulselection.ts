import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let neoFeatureActive = false;
function enableColorfulSelection(): void {
  if (neoFeatureActive) return;
  ensureCss('appearance-colorfulselection', featureCss['appearance-colorfulselection']);
  document.documentElement.classList.add('neo-colorfulselection');
  neoFeatureActive = true;
}
export function initColorfulSelection(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    if (config['colorfulselection'] === true) {
      enableColorfulSelection();
    }
  });
}
export function onColorfulSelectionClick(): void {
  if (neoFeatureActive) {
    destroyColorfulSelection();
    saveConfig({ 'colorfulselection': false } as Partial<Config>);
  } else {
    enableColorfulSelection();
    saveConfig({ 'colorfulselection': true } as Partial<Config>);
  }
}
export function destroyColorfulSelection(): void {
  neoFeatureActive = false;
  removeCss('appearance-colorfulselection');
  document.documentElement?.classList.remove('neo-colorfulselection');
}
