import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
export function initColoredHeadings(): void {
  loadConfig().then((config) => {
    if (config['colored-headings'] === true) {
      ensureCss('element-coloredheadings', featureCss['element-coloredheadings']);
      document.documentElement.classList.add('neo-element-coloredheadings');
    }
  });
}
export function onColoredHeadingsClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-element-coloredheadings');
  if (isActive) {
    destroyColoredHeadings();
    saveConfig({ 'colored-headings': false } as Partial<Config>);
  } else {
    ensureCss('element-coloredheadings', featureCss['element-coloredheadings']);
    htmlEl.classList.add('neo-element-coloredheadings');
    saveConfig({ 'colored-headings': true } as Partial<Config>);
  }
}
export function destroyColoredHeadings(): void {
  removeCss('element-coloredheadings');
  document.documentElement?.classList.remove('neo-element-coloredheadings');
}
