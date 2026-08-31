import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { Dialog } from 'siyuan';
import { getPlugin } from '../main/guard';
import { isMobile } from '../modules/env';
import { withViewTransition } from '../modules/viewtransition';
let superFusionMode: 'blur' | 'frostedGlass' | 'liquidGlass' = 'blur';
export function createSuperFusionLabelHTML(i18n: Record<string, string>): string {
  return `<span class="fn__flex fn__pointer">
    <span>${i18n.superFusion}</span>
    <span class="fn__space fn__flex-1 neo-menu-item-second-icon-space"></span>
    <svg class="b3-menu__icon neo-menu-item-second-icon ariaLabel" aria-label="${i18n.superFusionSettings}" onclick="event.stopPropagation();__neoOpenSuperFusionSettings()"><use xlink:href="#iconSettings"></use></svg>
  </span>`;
}
function applyModeClass(): void {
  document.body.classList.toggle('neo-visual-superfusion-blur', superFusionMode === 'blur');
  document.body.classList.toggle('neo-visual-superfusion-frosted-glass', superFusionMode === 'frostedGlass');
  document.body.classList.toggle('neo-visual-superfusion-liquid-glass', superFusionMode === 'liquidGlass');
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const modeOptions = ['blur', 'frostedGlass', 'liquidGlass']
    .map(v => `<option value="${v}">${i18n[`superFusionMode${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.superFusionMode}</div>
              <div class="b3-label__text">${i18n.superFusionModeTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-superfusion-mode">
              ${modeOptions}
            </select>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-superfusion-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-superfusion-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showSuperFusionSettings(): void {
  if (isMobile()) return;
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.superFusionSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const modeSelect = dialog.element.querySelector('#neo-superfusion-mode') as HTMLSelectElement;
  if (modeSelect) modeSelect.value = superFusionMode;
  dialog.element.querySelector('#neo-superfusion-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-superfusion-confirm')?.addEventListener('click', () => {
    if (modeSelect) {
      const newMode = modeSelect.value as 'blur' | 'frostedGlass' | 'liquidGlass';
      if (newMode !== superFusionMode) {
        superFusionMode = newMode;
        applyModeClass();
        saveConfig({ 'super-fusion-mode': newMode } as Partial<Config>);
      }
    }
    dialog.destroy();
  });
}
export function initSuperFusion(): void {
  if (isMobile()) return;
  (window as any).__neoOpenSuperFusionSettings = showSuperFusionSettings;
  loadConfig().then((config) => {
    superFusionMode = config['super-fusion-mode'] || 'blur';
    if (config['super-fusion'] === true) {
      ensureCss('superfusion', featureCss['superfusion']);
      document.documentElement.classList.add('neo-visual-superfusion');
      applyModeClass();
    }
  });
}
export function onSuperFusionClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-visual-superfusion');
  withViewTransition(() => {
    if (isActive) {
      destroySuperFusion();
      saveConfig({ 'super-fusion': false } as Partial<Config>);
    } else {
      ensureCss('superfusion', featureCss['superfusion']);
      htmlEl.classList.add('neo-visual-superfusion');
      applyModeClass();
      saveConfig({ 'super-fusion': true } as Partial<Config>);
    }
  });
}
export function destroySuperFusion(): void {
  removeCss('superfusion');
  document.documentElement?.classList.remove('neo-visual-superfusion');
  document.body?.classList.remove('neo-visual-superfusion-blur', 'neo-visual-superfusion-frosted-glass', 'neo-visual-superfusion-liquid-glass');
}
