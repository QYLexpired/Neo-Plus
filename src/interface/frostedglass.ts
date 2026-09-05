import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { Dialog } from 'siyuan';
import { getPlugin } from '../main/context';
import { withViewTransition } from '../modules/viewtransition';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let frostedGlassScope: 'light' | 'global' = 'light';
let neoFeatureActive = false;
function applyScopeClass(): void {
  document.documentElement.classList.toggle('neo-frostedglass-global', frostedGlassScope === 'global');
}
function enableFrostedGlass(): void {
  if (neoFeatureActive) return;
  ensureCss('interface-frostedglass', featureCss['interface-frostedglass']);
  document.documentElement.classList.add('neo-frostedglass');
  neoFeatureActive = true;
  applyScopeClass();
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
            <select class="b3-select fn__flex-center fn__size200" id="neo-frostedglass-scope">
              ${scopeOptions}
            </select>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-frostedglass-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-frostedglass-confirm">${i18n.confirm}</button>
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
  const scopeSelect = dialog.element.querySelector('#neo-frostedglass-scope') as HTMLSelectElement;
  if (scopeSelect) scopeSelect.value = frostedGlassScope;
  dialog.element.querySelector('#neo-frostedglass-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-frostedglass-confirm')?.addEventListener('click', () => {
    if (scopeSelect) {
      const newScope = scopeSelect.value as 'light' | 'global';
      if (newScope !== frostedGlassScope) {
        frostedGlassScope = newScope;
        saveConfig({ 'frostedglass-scope': newScope } as Partial<Config>);
        if (neoFeatureActive) {
          applyScopeClass();
        }
      }
    }
    dialog.destroy();
  });
}
export function initFrostedGlass(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    frostedGlassScope = config['frostedglass-scope'] || 'light';
    if (neoFeatureActive) {
      applyScopeClass();
    } else if (config['frostedglass'] === true) {
      enableFrostedGlass();
    }
  });
}
export function onFrostedGlassClick(): void {
  const shouldEnable = !neoFeatureActive;
  withViewTransition(() => {
    if (shouldEnable) {
      enableFrostedGlass();
      saveConfig({ 'frostedglass': true } as Partial<Config>);
    } else {
      destroyFrostedGlass();
      saveConfig({ 'frostedglass': false } as Partial<Config>);
    }
  });
}
export function destroyFrostedGlass(): void {
  neoFeatureActive = false;
  removeCss('interface-frostedglass');
  document.documentElement?.classList.remove('neo-frostedglass', 'neo-frostedglass-global');
}
