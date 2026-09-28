import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { Dialog } from '../modules/dialog';
import { getPlugin } from '../main/context';
import { withViewTransition } from '../modules/viewtransition';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let frostedGlassScope: 'light' | 'global' = 'light';
let frostedGlassLuminous = true;
let neoFeatureActive = false;
let configRevision = 0;
let actionRevision = 0;
function applySettings(): void {
  document.documentElement.classList.toggle('neo-frostedglass-global', frostedGlassScope === 'global');
  document.documentElement.classList.toggle('neo-frostedglass-luminous', frostedGlassLuminous);
}
function enableFrostedGlass(): void {
  if (neoFeatureActive) return;
  ensureCss('interface-frostedglass', featureCss['interface-frostedglass']);
  document.documentElement.classList.add('neo-frostedglass');
  neoFeatureActive = true;
  applySettings();
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
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.frostedGlassLuminous}</div>
              <div class="b3-label__text">${i18n.frostedGlassLuminousTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-frostedglass-luminous" type="checkbox">
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
  const isCurrent = createNeoLifecycleGuard();
  const dialog = new Dialog({
    title: plugin.i18n.frostedGlassSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const scopeSelect = dialog.element.querySelector('#neo-frostedglass-scope') as HTMLSelectElement;
  if (scopeSelect) scopeSelect.value = frostedGlassScope;
  const luminousSwitch = dialog.element.querySelector('#neo-frostedglass-luminous') as HTMLInputElement;
  if (luminousSwitch) luminousSwitch.checked = frostedGlassLuminous;
  dialog.element.querySelector('#neo-frostedglass-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-frostedglass-confirm')?.addEventListener('click', () => {
    if (!isCurrent()) {
      dialog.destroy();
      return;
    }
    configRevision += 1;
    const patch: Partial<Config> = {};
    if (scopeSelect) {
      const newScope = scopeSelect.value === 'global' ? 'global' : 'light';
      if (newScope !== frostedGlassScope) {
        frostedGlassScope = newScope;
        patch['frostedglass-scope'] = newScope;
      }
    }
    const newLuminous = luminousSwitch?.checked ?? frostedGlassLuminous;
    if (newLuminous !== frostedGlassLuminous) {
      frostedGlassLuminous = newLuminous;
      patch['frostedglass-luminous'] = newLuminous;
    }
    if (Object.keys(patch).length > 0) {
      saveConfig(patch);
      if (neoFeatureActive) applySettings();
    }
    dialog.destroy();
  });
}
export function initFrostedGlass(): Promise<void> {
  const revision = ++configRevision;
  const isCurrent = createNeoLifecycleGuard();
  return loadConfig().then((config) => {
    if (!isCurrent() || revision !== configRevision) return;
    frostedGlassScope = config['frostedglass-scope'] === 'global' ? 'global' : 'light';
    frostedGlassLuminous = (config['frostedglass-luminous'] ?? true) === true;
    if (neoFeatureActive) {
      applySettings();
    } else if (config['frostedglass'] === true) {
      enableFrostedGlass();
    }
  });
}
export function onFrostedGlassClick(): void {
  configRevision += 1;
  const revision = ++actionRevision;
  const shouldEnable = !neoFeatureActive;
  const isCurrent = createNeoLifecycleGuard();
  withViewTransition(() => {
    if (!isCurrent() || revision !== actionRevision) return;
    configRevision += 1;
    if (shouldEnable) {
      enableFrostedGlass();
      saveConfig({ 'frostedglass': true });
    } else {
      destroyFrostedGlass();
      saveConfig({ 'frostedglass': false });
    }
  });
}
export function destroyFrostedGlass(): void {
  neoFeatureActive = false;
  configRevision += 1;
  actionRevision += 1;
  removeCss('interface-frostedglass');
  document.documentElement?.classList.remove('neo-frostedglass', 'neo-frostedglass-global', 'neo-frostedglass-luminous');
}
