import { saveConfig, loadConfig, getConfig } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { Dialog } from '../modules/dialog';
import { getPlugin } from '../main/context';
import { isMobile } from '../modules/env';
import { withViewTransition } from '../modules/viewtransition';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let superFusionMode: 'blur' | 'frostedGlass' | 'liquidGlass' = 'blur';
let neoFeatureActive = false;
let configRevision = 0;
let actionRevision = 0;
function normalizeSuperFusionMode(value: unknown): typeof superFusionMode {
  return value === 'frostedGlass' || value === 'liquidGlass' ? value : 'blur';
}
function applyModeClass(): void {
  document.body.classList.toggle('neo-superfusion-mode-blur', superFusionMode === 'blur');
  document.body.classList.toggle('neo-superfusion-mode-frostedglass', superFusionMode === 'frostedGlass');
  document.body.classList.toggle('neo-superfusion-mode-liquidglass', superFusionMode === 'liquidGlass');
}
function enableSuperFusion(): void {
  if (neoFeatureActive) return;
  ensureCss('interface-superfusion', featureCss['interface-superfusion']);
  document.documentElement.classList.add('neo-superfusion');
  neoFeatureActive = true;
  applyModeClass();
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
export async function showSuperFusionSettings(): Promise<void> {
  if (isMobile()) return;
  const plugin = getPlugin();
  if (!plugin) return;
  const isCurrent = createNeoLifecycleGuard();
  await loadConfig();
  if (!isCurrent()) return;
  const config = getConfig();
  const initialSuperFusionMode = normalizeSuperFusionMode(config['superfusion-mode']);
  const dialog = new Dialog({
    title: plugin.i18n.superFusionSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const modeSelect = dialog.element.querySelector('#neo-superfusion-mode') as HTMLSelectElement;
  if (modeSelect) modeSelect.value = initialSuperFusionMode;
  dialog.element.querySelector('#neo-superfusion-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-superfusion-confirm')?.addEventListener('click', () => {
    if (!isCurrent() || !dialog.element.isConnected) {
      dialog.destroy();
      return;
    }
    if (modeSelect) {
      const newMode = normalizeSuperFusionMode(modeSelect.value);
      if (newMode !== initialSuperFusionMode) {
        superFusionMode = newMode;
        saveConfig({ 'superfusion-mode': newMode });
        if (neoFeatureActive) {
          applyModeClass();
        }
      }
    }
    dialog.destroy();
  });
}
export function initSuperFusion(): Promise<void> | void {
  if (isMobile()) return;
  const revision = ++configRevision;
  const isCurrent = createNeoLifecycleGuard();
  return loadConfig().then(() => {
    if (!isCurrent()) return;
    const config = getConfig();
    superFusionMode = normalizeSuperFusionMode(config['superfusion-mode']);
    if (neoFeatureActive) {
      applyModeClass();
    } else if (revision === configRevision && config['superfusion'] === true) {
      enableSuperFusion();
    }
  });
}
export function onSuperFusionClick(): void {
  if (isMobile()) return;
  configRevision += 1;
  const revision = ++actionRevision;
  const shouldEnable = !neoFeatureActive;
  const isCurrent = createNeoLifecycleGuard();
  withViewTransition(() => {
    if (!isCurrent() || revision !== actionRevision) return;
    configRevision += 1;
    if (shouldEnable) {
      enableSuperFusion();
      saveConfig({ 'superfusion': true });
    } else {
      destroySuperFusion();
      saveConfig({ 'superfusion': false });
    }
  });
}
export function destroySuperFusion(): void {
  neoFeatureActive = false;
  configRevision += 1;
  actionRevision += 1;
  removeCss('interface-superfusion');
  document.documentElement?.classList.remove('neo-superfusion');
  document.body?.classList.remove('neo-superfusion-mode-blur', 'neo-superfusion-mode-frostedglass', 'neo-superfusion-mode-liquidglass');
}
