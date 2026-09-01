import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let neoFeatureActive = false;
function enableColoredLists(): void {
  if (neoFeatureActive) return;
  ensureCss('element-coloredlists', featureCss['element-coloredlists']);
  document.documentElement.classList.add('neo-element-coloredlists');
  neoFeatureActive = true;
}
export function initColoredLists(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    if (config['colored-lists'] === true) {
      enableColoredLists();
    }
  });
}
export function onColoredListsClick(): void {
  if (neoFeatureActive) {
    destroyColoredLists();
    saveConfig({ 'colored-lists': false } as Partial<Config>);
  } else {
    enableColoredLists();
    saveConfig({ 'colored-lists': true } as Partial<Config>);
  }
}
export function destroyColoredLists(): void {
  neoFeatureActive = false;
  removeCss('element-coloredlists');
  document.documentElement?.classList.remove('neo-element-coloredlists');
}
