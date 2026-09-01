import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let neoFeatureActive = false;
function enableColoredHeadings(): void {
  if (neoFeatureActive) return;
  ensureCss('element-coloredheadings', featureCss['element-coloredheadings']);
  document.documentElement.classList.add('neo-element-coloredheadings');
  neoFeatureActive = true;
}
export function initColoredHeadings(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    if (config['colored-headings'] === true) {
      enableColoredHeadings();
    }
  });
}
export function onColoredHeadingsClick(): void {
  if (neoFeatureActive) {
    destroyColoredHeadings();
    saveConfig({ 'colored-headings': false } as Partial<Config>);
  } else {
    enableColoredHeadings();
    saveConfig({ 'colored-headings': true } as Partial<Config>);
  }
}
export function destroyColoredHeadings(): void {
  neoFeatureActive = false;
  removeCss('element-coloredheadings');
  document.documentElement?.classList.remove('neo-element-coloredheadings');
}
