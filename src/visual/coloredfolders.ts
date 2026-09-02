import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { getPlugin } from '../main/context';
import { Dialog } from 'siyuan';
import { createNeoLifecycleGuard } from '../main/lifecycle';
type ColoredFoldersLayout = 'partition' | 'simple' | 'card';
type ColoredFoldersColorStyle = 'default' | 'vivid';
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
function applyLayout(): void {
  document.body.classList.toggle('neo-visual-coloredfolders-partition', coloredFoldersLayout === 'partition');
  document.body.classList.toggle('neo-visual-coloredfolders-simple', coloredFoldersLayout === 'simple');
  document.body.classList.toggle('neo-visual-coloredfolders-card', coloredFoldersLayout === 'card');
}
function applyColorStyle(): void {
  if (coloredFoldersColorStyle === 'vivid') {
    document.documentElement.style.setProperty('--_coloredfolders-c', '0.185');
  } else {
    document.documentElement.style.removeProperty('--_coloredfolders-c');
  }
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
  ensureCss('visual-coloredfolders', featureCss['visual-coloredfolders']);
  document.documentElement.classList.add('neo-visual-coloredfolders');
  neoFeatureActive = true;
  applySettings();
}
export function initColoredFolders(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    const savedLayout = config['colored-folders-layout'];
    coloredFoldersLayout = savedLayout === 'simple' || savedLayout === 'card' ? savedLayout : 'partition';
    coloredFoldersColorStyle = config['colored-folders-colorstyle'] === 'vivid' ? 'vivid' : 'default';
    initialHueRule = config['colored-folders-initial-hue-rule'] === 'fixed' ? 'fixed' : 'theme';
    initialHue = normalizeInitialHue(config['colored-folders-initial-hue']);
    if (neoFeatureActive) {
      applySettings();
    } else if (config['colored-folders'] === true) {
      enableColoredFolders();
    }
  });
}
export function onColoredFoldersClick(): void {
  if (neoFeatureActive) {
    destroyColoredFolders();
    saveConfig({ 'colored-folders': false } as Partial<Config>);
  } else {
    enableColoredFolders();
    saveConfig({ 'colored-folders': true } as Partial<Config>);
  }
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const layoutOptions = ['partition', 'simple', 'card']
    .map(value => `<option value="${value}">${i18n[`coloredFoldersLayout${value.charAt(0).toUpperCase() + value.slice(1)}`]}</option>`)
    .join('');
  const colorStyleOptions = ['default', 'vivid']
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
            <select class="b3-select fn__flex-center fn__size200" id="neo-colored-folders-layout">
              ${layoutOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredFoldersColorStyle}</div>
              <div class="b3-label__text">${i18n.coloredFoldersColorStyleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-colored-folders-colorstyle">
              ${colorStyleOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredFoldersInitialHueRule}</div>
              <div class="b3-label__text">${i18n.coloredFoldersInitialHueRuleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-colored-folders-initial-hue-rule">
              ${ruleOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item${fixedHueClass}" id="neo-colored-folders-initial-hue-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredFoldersInitialHue}</div>
              <div class="b3-label__text">${i18n.coloredFoldersInitialHueTip}</div>
            </div>
            <span class="fn__space"></span>
            <div class="b3-tooltips b3-tooltips__n fn__flex-center" id="neo-colored-folders-initial-hue-tooltip" aria-label="${initialHue}deg">
              <input class="b3-slider fn__size200 neo-colored-hue-slider neo-colored-hue-slider--folders" data-colorstyle="${coloredFoldersColorStyle}" id="neo-colored-folders-initial-hue" min="0" max="360" step="1" type="range" value="${initialHue}">
            </div>
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
  const layoutSelect = dialog.element.querySelector('#neo-colored-folders-layout') as HTMLSelectElement | null;
  const colorStyleSelect = dialog.element.querySelector('#neo-colored-folders-colorstyle') as HTMLSelectElement | null;
  const ruleSelect = dialog.element.querySelector('#neo-colored-folders-initial-hue-rule') as HTMLSelectElement | null;
  const hueItem = dialog.element.querySelector('#neo-colored-folders-initial-hue-item') as HTMLElement | null;
  const hueSlider = dialog.element.querySelector('#neo-colored-folders-initial-hue') as HTMLInputElement | null;
  const hueTooltip = dialog.element.querySelector('#neo-colored-folders-initial-hue-tooltip') as HTMLElement | null;
  const updateColorStylePreview = (): void => {
    hueSlider?.setAttribute('data-colorstyle', colorStyleSelect?.value === 'vivid' ? 'vivid' : 'default');
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
  dialog.element.querySelector('#neo-colored-folders-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-colored-folders-confirm')?.addEventListener('click', () => {
    const layoutValue = layoutSelect?.value;
    const newLayout: ColoredFoldersLayout = layoutValue === 'simple' || layoutValue === 'card' ? layoutValue : 'partition';
    const newColorStyle: ColoredFoldersColorStyle = colorStyleSelect?.value === 'vivid' ? 'vivid' : 'default';
    const newRule: InitialHueRule = ruleSelect?.value === 'fixed' ? 'fixed' : 'theme';
    const newHue = normalizeInitialHue(hueSlider?.value);
    coloredFoldersLayout = newLayout;
    coloredFoldersColorStyle = newColorStyle;
    initialHueRule = newRule;
    initialHue = newHue;
    saveConfig({
      'colored-folders-layout': newLayout,
      'colored-folders-colorstyle': newColorStyle,
      'colored-folders-initial-hue-rule': newRule,
      'colored-folders-initial-hue': newHue,
    } as Partial<Config>);
    if (neoFeatureActive) applySettings();
    dialog.destroy();
  });
}
export function destroyColoredFolders(): void {
  neoFeatureActive = false;
  removeCss('visual-coloredfolders');
  document.documentElement?.classList.remove('neo-visual-coloredfolders');
  document.body.classList.remove('neo-visual-coloredfolders-partition', 'neo-visual-coloredfolders-simple', 'neo-visual-coloredfolders-card');
  document.documentElement?.style.removeProperty('--_coloredfolders-initial-hue');
  document.documentElement?.style.removeProperty('--_coloredfolders-c');
}
