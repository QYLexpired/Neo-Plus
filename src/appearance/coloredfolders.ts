import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { getPlugin } from '../main/context';
import { Dialog } from 'siyuan';
import { createNeoLifecycleGuard } from '../main/lifecycle';
type ColoredFoldersLayout = 'partition' | 'simple' | 'card';
type ColoredFoldersColorStyle = 'soft' | 'default' | 'vivid';
type InitialHueRule = 'theme' | 'fixed';
const defaultInitialHue = 0;
let coloredFoldersLayout: ColoredFoldersLayout = 'partition';
let coloredFoldersColorStyle: ColoredFoldersColorStyle = 'default';
let initialHueRule: InitialHueRule = 'theme';
let initialHue = defaultInitialHue;
let neoFeatureActive = false;
function normalizeInitialHue(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultInitialHue;
  return Math.min(360, Math.max(0, Math.round(parsed)));
}
function normalizeColorStyle(value: unknown): ColoredFoldersColorStyle {
  if (value === 'soft' || value === 'vivid') return value;
  return 'default';
}
function applyLayout(): void {
  document.body.classList.toggle('neo-coloredfolders-partition', coloredFoldersLayout === 'partition');
  document.body.classList.toggle('neo-coloredfolders-simple', coloredFoldersLayout === 'simple');
  document.body.classList.toggle('neo-coloredfolders-card', coloredFoldersLayout === 'card');
}
function applyColorStyle(): void {
  if (coloredFoldersColorStyle === 'default') {
    document.documentElement.style.removeProperty('--_coloredfolders-c');
    return;
  }
  document.documentElement.style.setProperty('--_coloredfolders-c', coloredFoldersColorStyle === 'soft' ? '0.08' : '0.2');
}
function applyInitialHue(): void {
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
export function initColoredFolders(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    const savedLayout = config['coloredfolders-layout'];
    coloredFoldersLayout = savedLayout === 'simple' || savedLayout === 'card' ? savedLayout : 'partition';
    coloredFoldersColorStyle = normalizeColorStyle(config['coloredfolders-colorstyle']);
    initialHueRule = config['coloredfolders-initial-hue-rule'] === 'fixed' ? 'fixed' : 'theme';
    initialHue = normalizeInitialHue(config['coloredfolders-initial-hue']);
    if (neoFeatureActive) {
      applySettings();
    } else if (config['coloredfolders'] === true) {
      enableColoredFolders();
    }
  });
}
export function onColoredFoldersClick(): void {
  if (neoFeatureActive) {
    destroyColoredFolders();
    saveConfig({ 'coloredfolders': false } as Partial<Config>);
  } else {
    enableColoredFolders();
    saveConfig({ 'coloredfolders': true } as Partial<Config>);
  }
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const layoutOptions = ['partition', 'simple', 'card']
    .map(value => `<option value="${value}">${i18n[`coloredFoldersLayout${value.charAt(0).toUpperCase() + value.slice(1)}`]}</option>`)
    .join('');
  const colorStyleOptions = ['soft', 'default', 'vivid']
    .map(value => `<option value="${value}">${i18n[`coloredFoldersColorStyle${value.charAt(0).toUpperCase() + value.slice(1)}`]}</option>`)
    .join('');
  const ruleOptions = ['theme', 'fixed']
    .map(value => `<option value="${value}">${i18n[`coloredFoldersInitialHueRule${value.charAt(0).toUpperCase() + value.slice(1)}`]}</option>`)
    .join('');
  const fixedHueClass = initialHueRule === 'fixed' ? '' : ' fn__none';
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
              <div class="config-name">${i18n.coloredFoldersColorStyle}</div>
              <div class="b3-label__text">${i18n.coloredFoldersColorStyleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-coloredfolders-colorstyle">
              ${colorStyleOptions}
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
          <label class="fn__flex b3-label config-item${fixedHueClass}" id="neo-coloredfolders-initial-hue-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredFoldersInitialHue}</div>
              <div class="b3-label__text">${i18n.coloredFoldersInitialHueTip}</div>
            </div>
            <span class="fn__space"></span>
            <div class="b3-tooltips b3-tooltips__n fn__flex-center" id="neo-coloredfolders-initial-hue-tooltip" aria-label="${initialHue}deg">
              <input class="b3-slider fn__size200 neo-colored-hue-slider neo-colored-hue-slider--folders" data-colorstyle="${coloredFoldersColorStyle}" id="neo-coloredfolders-initial-hue" min="0" max="360" step="1" type="range" value="${initialHue}">
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
export function showColoredFoldersSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.coloredFoldersSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const layoutSelect = dialog.element.querySelector('#neo-coloredfolders-layout') as HTMLSelectElement | null;
  const colorStyleSelect = dialog.element.querySelector('#neo-coloredfolders-colorstyle') as HTMLSelectElement | null;
  const ruleSelect = dialog.element.querySelector('#neo-coloredfolders-initial-hue-rule') as HTMLSelectElement | null;
  const hueItem = dialog.element.querySelector('#neo-coloredfolders-initial-hue-item') as HTMLElement | null;
  const hueSlider = dialog.element.querySelector('#neo-coloredfolders-initial-hue') as HTMLInputElement | null;
  const hueTooltip = dialog.element.querySelector('#neo-coloredfolders-initial-hue-tooltip') as HTMLElement | null;
  const updateColorStylePreview = (): void => {
    hueSlider?.setAttribute('data-colorstyle', normalizeColorStyle(colorStyleSelect?.value));
  };
  const updateHueVisibility = (): void => {
    hueItem?.classList.toggle('fn__none', ruleSelect?.value !== 'fixed');
  };
  if (layoutSelect) layoutSelect.value = coloredFoldersLayout;
  if (colorStyleSelect) {
    colorStyleSelect.value = coloredFoldersColorStyle;
    colorStyleSelect.addEventListener('change', updateColorStylePreview);
  }
  if (ruleSelect) {
    ruleSelect.value = initialHueRule;
    ruleSelect.addEventListener('change', updateHueVisibility);
  }
  if (hueSlider) {
    hueSlider.value = String(initialHue);
    hueSlider.addEventListener('input', () => {
      hueTooltip?.setAttribute('aria-label', `${hueSlider.value}deg`);
    });
  }
  updateColorStylePreview();
  updateHueVisibility();
  dialog.element.querySelector('#neo-coloredfolders-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-coloredfolders-confirm')?.addEventListener('click', () => {
    const layoutValue = layoutSelect?.value;
    const newLayout: ColoredFoldersLayout = layoutValue === 'simple' || layoutValue === 'card' ? layoutValue : 'partition';
    const newColorStyle = normalizeColorStyle(colorStyleSelect?.value);
    const newRule: InitialHueRule = ruleSelect?.value === 'fixed' ? 'fixed' : 'theme';
    const newHue = normalizeInitialHue(hueSlider?.value);
    coloredFoldersLayout = newLayout;
    coloredFoldersColorStyle = newColorStyle;
    initialHueRule = newRule;
    initialHue = newHue;
    saveConfig({
      'coloredfolders-layout': newLayout,
      'coloredfolders-colorstyle': newColorStyle,
      'coloredfolders-initial-hue-rule': newRule,
      'coloredfolders-initial-hue': newHue,
    } as Partial<Config>);
    if (neoFeatureActive) applySettings();
    dialog.destroy();
  });
}
export function destroyColoredFolders(): void {
  neoFeatureActive = false;
  removeCss('appearance-coloredfolders');
  document.documentElement?.classList.remove('neo-coloredfolders');
  document.body.classList.remove('neo-coloredfolders-partition', 'neo-coloredfolders-simple', 'neo-coloredfolders-card');
  document.documentElement?.style.removeProperty('--_coloredfolders-initial-hue');
  document.documentElement?.style.removeProperty('--_coloredfolders-c');
}
