import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { getPlugin } from '../main/guard';
import { Dialog } from 'siyuan';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let coloredFoldersStyle: 'partition' | 'simple' | 'card' = 'partition';
function applyStyle(): void {
  document.body.classList.toggle('neo-visual-coloredfolders-partition', coloredFoldersStyle === 'partition');
  document.body.classList.toggle('neo-visual-coloredfolders-simple', coloredFoldersStyle === 'simple');
  document.body.classList.toggle('neo-visual-coloredfolders-card', coloredFoldersStyle === 'card');
}
export function initColoredFolders(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    coloredFoldersStyle = config['colored-folders-style'] || 'partition';
    if (config['colored-folders'] === true) {
      ensureCss('visual-coloredfolders', featureCss['visual-coloredfolders']);
      document.documentElement.classList.add('neo-visual-coloredfolders');
      applyStyle();
    }
  });
}
export function onColoredFoldersClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-visual-coloredfolders');
  if (isActive) {
    destroyColoredFolders();
    saveConfig({ 'colored-folders': false } as Partial<Config>);
  } else {
    ensureCss('visual-coloredfolders', featureCss['visual-coloredfolders']);
    htmlEl.classList.add('neo-visual-coloredfolders');
    applyStyle();
    saveConfig({ 'colored-folders': true } as Partial<Config>);
  }
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const styleOptions = ['partition', 'simple', 'card']
    .map(v => `<option value="${v}">${i18n[`coloredFoldersStyle${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredFoldersStyle}</div>
              <div class="b3-label__text">${i18n.coloredFoldersStyleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-colored-folders-style">
              ${styleOptions}
            </select>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-colored-folders-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-colored-folders-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showColoredFoldersSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.coloredFoldersSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const styleSelect = dialog.element.querySelector('#neo-colored-folders-style') as HTMLSelectElement;
  if (styleSelect) styleSelect.value = coloredFoldersStyle;
  dialog.element.querySelector('#neo-colored-folders-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-colored-folders-confirm')?.addEventListener('click', () => {
    if (styleSelect) {
      const newStyle = styleSelect.value as 'partition' | 'simple' | 'card';
      if (newStyle !== coloredFoldersStyle) {
        coloredFoldersStyle = newStyle;
        applyStyle();
        saveConfig({ 'colored-folders-style': newStyle } as Partial<Config>);
      }
    }
    dialog.destroy();
  });
}
export function destroyColoredFolders(): void {
  removeCss('visual-coloredfolders');
  document.documentElement?.classList.remove('neo-visual-coloredfolders');
  document.body.classList.remove('neo-visual-coloredfolders-partition', 'neo-visual-coloredfolders-simple', 'neo-visual-coloredfolders-card');
}
