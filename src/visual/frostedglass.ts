import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { Dialog } from 'siyuan';
import { getPlugin } from '../main/guard';
import { withViewTransition } from '../modules/viewtransition';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let frostedGlassScope: 'light' | 'global' = 'light';
function applyScopeClass(): void {
  const htmlEl = document.documentElement;
  htmlEl.classList.add('neo-visual-frostedglass');
  htmlEl.classList.toggle('neo-visual-frostedglass-global', frostedGlassScope === 'global');
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const scopeOptions = ['light', 'global']
    .map(v => `<option value="${v}">${i18n[`frostedGlassScope${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.frostedGlassScope}</div>
              <div class="b3-label__text">${i18n.frostedGlassScopeTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-frosted-glass-scope">
              ${scopeOptions}
            </select>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-frosted-glass-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-frosted-glass-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showFrostedGlassSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.frostedGlassSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const scopeSelect = dialog.element.querySelector('#neo-frosted-glass-scope') as HTMLSelectElement;
  if (scopeSelect) scopeSelect.value = frostedGlassScope;
  dialog.element.querySelector('#neo-frosted-glass-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-frosted-glass-confirm')?.addEventListener('click', () => {
    if (scopeSelect) {
      const newScope = scopeSelect.value as 'light' | 'global';
      if (newScope !== frostedGlassScope) {
        frostedGlassScope = newScope;
        applyScopeClass();
        saveConfig({ 'frosted-glass-scope': newScope } as Partial<Config>);
      }
    }
    dialog.destroy();
  });
}
export function initFrostedGlass(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    frostedGlassScope = config['frosted-glass-scope'] || 'light';
    if (config['frosted-glass'] === true) {
      ensureCss('visual-frostedglass', featureCss['visual-frostedglass']);
      applyScopeClass();
    }
  });
}
export function onFrostedGlassClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-visual-frostedglass');
  withViewTransition(() => {
    if (isActive) {
      destroyFrostedGlass();
      saveConfig({ 'frosted-glass': false } as Partial<Config>);
    } else {
      ensureCss('visual-frostedglass', featureCss['visual-frostedglass']);
      applyScopeClass();
      saveConfig({ 'frosted-glass': true } as Partial<Config>);
    }
  });
}
export function destroyFrostedGlass(): void {
  removeCss('visual-frostedglass');
  document.documentElement?.classList.remove('neo-visual-frostedglass', 'neo-visual-frostedglass-global');
}
