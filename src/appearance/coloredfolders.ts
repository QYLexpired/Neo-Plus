import { saveConfig, loadConfig, getConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { getPlugin } from '../main/context';
import { Dialog } from '../modules/dialog';
import { createNeoLifecycleGuard } from '../main/lifecycle';
type InitialHueRule = 'theme' | 'fixed' | 'accent';
type ColorStyle = 'soft' | 'default' | 'vivid';
type ColoredFoldersLayout = 'partition' | 'simple' | 'card';
let coloredFoldersLayout: ColoredFoldersLayout = 'partition';
let coloredFoldersColorStyle: ColorStyle = 'default';
let initialHueRule: InitialHueRule = 'theme';
let initialHue = 0;
let neoFeatureActive = false;
let configRevision = 0;
function applyLayout(): void {
  document.body.classList.toggle('neo-coloredfolders-layout-partition', coloredFoldersLayout === 'partition');
  document.body.classList.toggle('neo-coloredfolders-layout-simple', coloredFoldersLayout === 'simple');
  document.body.classList.toggle('neo-coloredfolders-layout-card', coloredFoldersLayout === 'card');
}
function applyColorStyle(): void {
  if (coloredFoldersColorStyle === 'default') {
    document.documentElement.style.removeProperty('--_coloredfolders-c');
    return;
  }
  document.documentElement.style.setProperty('--_coloredfolders-c', coloredFoldersColorStyle === 'soft' ? '0.08' : '0.2');
}
function applyInitialHue(): void {
  document.documentElement.classList.toggle('neo-coloredfolders-initial-hue-rule-accent', initialHueRule === 'accent');
  if (initialHueRule === 'fixed') {
    document.documentElement.style.setProperty('--_coloredfolders-initial-hue', String(initialHue));
  } else {
    document.documentElement.style.removeProperty('--_coloredfolders-initial-hue');
  }
}
function applySettings(): void {
  applyLayout();
  applyColorStyle();
  applyInitialHue();
}
function enableColoredFolders(): void {
  if (neoFeatureActive) return;
  ensureCss('appearance-coloredfolders', featureCss['appearance-coloredfolders']);
  document.documentElement.classList.add('neo-coloredfolders');
  neoFeatureActive = true;
  applySettings();
}
export function initColoredFolders(): Promise<void> {
  const revision = ++configRevision;
  const isCurrent = createNeoLifecycleGuard();
  return loadConfig().then(() => {
    if (!isCurrent()) return;
    const config = getConfig();
    const savedLayout = config['coloredfolders-layout'];
    const savedColorStyle = config['coloredfolders-colorstyle'];
    const savedRule = config['coloredfolders-initial-hue-rule'];
    const savedHue = Number(config['coloredfolders-initial-hue']);
    coloredFoldersLayout = savedLayout === 'simple' || savedLayout === 'card' ? savedLayout : 'partition';
    coloredFoldersColorStyle = savedColorStyle === 'soft' || savedColorStyle === 'vivid' ? savedColorStyle : 'default';
    initialHueRule = savedRule === 'fixed' || savedRule === 'accent' ? savedRule : 'theme';
    initialHue = Number.isFinite(savedHue) ? Math.min(360, Math.max(0, Math.round(savedHue))) : 0;
    if (neoFeatureActive) {
      applySettings();
    } else if (revision === configRevision && config['coloredfolders'] === true) {
      enableColoredFolders();
    }
  });
}
export function onColoredFoldersClick(): void {
  configRevision += 1;
  if (neoFeatureActive) {
    destroyColoredFolders();
    saveConfig({ 'coloredfolders': false });
  } else {
    enableColoredFolders();
    saveConfig({ 'coloredfolders': true });
  }
}
function buildSettingsHTML(i18n: Record<string, string>, rule: InitialHueRule, hue: number, colorStyle: ColorStyle): string {
  const layoutOptions = ['partition', 'simple', 'card']
    .map(value => `<option value="${value}">${i18n[`coloredFoldersLayout${value.charAt(0).toUpperCase() + value.slice(1)}`]}</option>`)
    .join('');
  const colorStyleOptions = ['soft', 'default', 'vivid']
    .map(value => `<option value="${value}">${i18n[`coloredFoldersColorStyle${value.charAt(0).toUpperCase() + value.slice(1)}`]}</option>`)
    .join('');
  const ruleOptions = ['theme', 'fixed', 'accent']
    .map(value => `<option value="${value}">${i18n[`coloredFoldersInitialHueRule${value.charAt(0).toUpperCase() + value.slice(1)}`]}</option>`)
    .join('');
  const fixedHueClass = rule === 'fixed' ? '' : ' fn__none';
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredFoldersLayout}</div>
              <div class="b3-label__text">${i18n.coloredFoldersLayoutTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-coloredfolders-layout">
              ${layoutOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredFoldersInitialHueRule}</div>
              <div class="b3-label__text">${i18n.coloredFoldersInitialHueRuleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-coloredfolders-initial-hue-rule">
              ${ruleOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredFoldersColorStyle}</div>
              <div class="b3-label__text">${i18n.coloredFoldersColorStyleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-coloredfolders-colorstyle">
              ${colorStyleOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item${fixedHueClass}" id="neo-coloredfolders-initial-hue-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredFoldersInitialHue}</div>
              <div class="b3-label__text">${i18n.coloredFoldersInitialHueTip}</div>
            </div>
            <span class="fn__space"></span>
            <div class="b3-tooltips b3-tooltips__n fn__flex-center" id="neo-coloredfolders-initial-hue-tooltip" aria-label="${hue}deg">
              <input class="b3-slider fn__size200 neo-colored-hue-slider neo-colored-hue-slider--folders" data-colorstyle="${colorStyle}" id="neo-coloredfolders-initial-hue" min="0" max="360" step="1" type="range" value="${hue}">
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-coloredfolders-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-coloredfolders-confirm">${i18n.confirm}</button>
  </div>`;
}
export async function showColoredFoldersSettings(): Promise<void> {
  const plugin = getPlugin();
  if (!plugin) return;
  const isCurrent = createNeoLifecycleGuard();
  await loadConfig();
  if (!isCurrent()) return;
  const config = getConfig();
  const savedHue = Number(config['coloredfolders-initial-hue']);
  const initialLayout = config['coloredfolders-layout'] === 'simple' || config['coloredfolders-layout'] === 'card' ? config['coloredfolders-layout'] : 'partition';
  const initialColorStyle = config['coloredfolders-colorstyle'] === 'soft' || config['coloredfolders-colorstyle'] === 'vivid' ? config['coloredfolders-colorstyle'] : 'default';
  const initialRule = config['coloredfolders-initial-hue-rule'] === 'fixed' || config['coloredfolders-initial-hue-rule'] === 'accent' ? config['coloredfolders-initial-hue-rule'] : 'theme';
  const initialHueValue = Number.isFinite(savedHue) ? Math.min(360, Math.max(0, Math.round(savedHue))) : 0;
  const dialog = new Dialog({
    title: plugin.i18n.coloredFoldersSettings,
    content: buildSettingsHTML(plugin.i18n, initialRule, initialHueValue, initialColorStyle),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const layoutSelect = dialog.element.querySelector('#neo-coloredfolders-layout') as HTMLSelectElement | null;
  const colorStyleSelect = dialog.element.querySelector('#neo-coloredfolders-colorstyle') as HTMLSelectElement | null;
  const ruleSelect = dialog.element.querySelector('#neo-coloredfolders-initial-hue-rule') as HTMLSelectElement | null;
  const hueItem = dialog.element.querySelector('#neo-coloredfolders-initial-hue-item') as HTMLElement | null;
  const hueSlider = dialog.element.querySelector('#neo-coloredfolders-initial-hue') as HTMLInputElement | null;
  const hueTooltip = dialog.element.querySelector('#neo-coloredfolders-initial-hue-tooltip') as HTMLElement | null;
  const updateColorStylePreview = (): void => {
    const value = colorStyleSelect?.value;
    hueSlider?.setAttribute('data-colorstyle', value === 'soft' || value === 'vivid' ? value : 'default');
  };
  const updateHueVisibility = (): void => {
    hueItem?.classList.toggle('fn__none', ruleSelect?.value !== 'fixed');
    colorStyleSelect?.closest('.config-item')?.classList.toggle('fn__none', ruleSelect?.value === 'accent');
  };
  if (layoutSelect) layoutSelect.value = initialLayout;
  if (colorStyleSelect) {
    colorStyleSelect.value = initialColorStyle;
    colorStyleSelect.addEventListener('change', updateColorStylePreview);
  }
  if (ruleSelect) {
    ruleSelect.value = initialRule;
    ruleSelect.addEventListener('change', updateHueVisibility);
  }
  if (hueSlider) {
    hueSlider.value = String(initialHueValue);
    hueTooltip?.setAttribute('aria-label', `${hueSlider.value}deg`);
    hueSlider.addEventListener('input', () => {
      hueTooltip?.setAttribute('aria-label', `${hueSlider.value}deg`);
    });
  }
  updateColorStylePreview();
  updateHueVisibility();
  dialog.element.querySelector('#neo-coloredfolders-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-coloredfolders-confirm')?.addEventListener('click', () => {
    if (!isCurrent() || !dialog.element.isConnected) {
      dialog.destroy();
      return;
    }
    const layoutValue = layoutSelect?.value;
    const newLayout: ColoredFoldersLayout = layoutValue === 'simple' || layoutValue === 'card' ? layoutValue : 'partition';
    const colorStyle = colorStyleSelect?.value;
    const rule = ruleSelect?.value;
    const hue = Number(hueSlider?.value);
    const newColorStyle = colorStyle === 'soft' || colorStyle === 'vivid' ? colorStyle : 'default';
    const newRule = rule === 'fixed' || rule === 'accent' ? rule : 'theme';
    const newHue = Number.isFinite(hue) ? Math.min(360, Math.max(0, Math.round(hue))) : 0;
    const patch: Partial<Config> = {};
    if (newLayout !== initialLayout) {
      coloredFoldersLayout = newLayout;
      patch['coloredfolders-layout'] = newLayout;
    }
    if (newColorStyle !== initialColorStyle) {
      coloredFoldersColorStyle = newColorStyle;
      patch['coloredfolders-colorstyle'] = newColorStyle;
    }
    if (newRule !== initialRule) {
      initialHueRule = newRule;
      patch['coloredfolders-initial-hue-rule'] = newRule;
    }
    if (newHue !== initialHueValue) {
      initialHue = newHue;
      patch['coloredfolders-initial-hue'] = newHue;
    }
    if (Object.keys(patch).length > 0) {
      saveConfig(patch);
      if (neoFeatureActive) applySettings();
    }
    dialog.destroy();
  });
}
export function destroyColoredFolders(): void {
  neoFeatureActive = false;
  configRevision += 1;
  removeCss('appearance-coloredfolders');
  document.documentElement?.classList.remove('neo-coloredfolders', 'neo-coloredfolders-initial-hue-rule-accent');
  document.body.classList.remove('neo-coloredfolders-layout-partition', 'neo-coloredfolders-layout-simple', 'neo-coloredfolders-layout-card');
  document.documentElement?.style.removeProperty('--_coloredfolders-initial-hue');
  document.documentElement?.style.removeProperty('--_coloredfolders-c');
}
