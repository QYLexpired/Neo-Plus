import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { getPlugin } from '../main/context';
import { Dialog } from 'siyuan';
type InitialHueRule = 'theme' | 'fixed';
type ColoredListsColorStyle = 'soft' | 'default' | 'vivid';
const defaultInitialHue = 0;
let coloredListsColorStyle: ColoredListsColorStyle = 'default';
let initialHueRule: InitialHueRule = 'theme';
let initialHue = defaultInitialHue;
let neoFeatureActive = false;
function normalizeInitialHue(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultInitialHue;
  return Math.min(360, Math.max(0, Math.round(parsed)));
}
function normalizeColorStyle(value: unknown): ColoredListsColorStyle {
  if (value === 'soft' || value === 'vivid') return value;
  return 'default';
}
function applyInitialHue(): void {
  if (initialHueRule === 'fixed') {
    document.documentElement.style.setProperty('--_coloredlists-initial-hue', String(initialHue));
  } else {
    document.documentElement.style.removeProperty('--_coloredlists-initial-hue');
  }
}
function applyColorStyle(): void {
  if (coloredListsColorStyle === 'default') {
    document.documentElement.style.removeProperty('--_coloredlists-c');
    return;
  }
  document.documentElement.style.setProperty('--_coloredlists-c', coloredListsColorStyle === 'soft' ? '0.05' : '0.185');
}
function applySettings(): void {
  applyColorStyle();
  applyInitialHue();
}
function enableColoredLists(): void {
  if (neoFeatureActive) return;
  ensureCss('element-coloredlists', featureCss['element-coloredlists']);
  document.documentElement.classList.add('neo-element-coloredlists');
  neoFeatureActive = true;
  applySettings();
}
export function initColoredLists(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    coloredListsColorStyle = normalizeColorStyle(config['colored-lists-colorstyle']);
    initialHueRule = config['colored-lists-initial-hue-rule'] === 'fixed' ? 'fixed' : 'theme';
    initialHue = normalizeInitialHue(config['colored-lists-initial-hue']);
    if (neoFeatureActive) {
      applySettings();
    } else if (config['colored-lists'] === true) {
      enableColoredLists();
    }
  });
}
export function onColoredListsClick(): void {
  if (neoFeatureActive) {
    destroyColoredLists();
    saveConfig({ 'colored-lists': false } as Partial<Config>);
  } else {
    enableColoredLists();
    saveConfig({ 'colored-lists': true } as Partial<Config>);
  }
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const colorStyleOptions = ['soft', 'default', 'vivid']
    .map(value => `<option value="${value}">${i18n[`coloredListsColorStyle${value.charAt(0).toUpperCase() + value.slice(1)}`]}</option>`)
    .join('');
  const ruleOptions = ['theme', 'fixed']
    .map(value => `<option value="${value}">${i18n[`coloredListsInitialHueRule${value.charAt(0).toUpperCase() + value.slice(1)}`]}</option>`)
    .join('');
  const fixedHueClass = initialHueRule === 'fixed' ? '' : ' fn__none';
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredListsColorStyle}</div>
              <div class="b3-label__text">${i18n.coloredListsColorStyleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-colored-lists-colorstyle">
              ${colorStyleOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredListsInitialHueRule}</div>
              <div class="b3-label__text">${i18n.coloredListsInitialHueRuleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-colored-lists-initial-hue-rule">
              ${ruleOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item${fixedHueClass}" id="neo-colored-lists-initial-hue-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredListsInitialHue}</div>
              <div class="b3-label__text">${i18n.coloredListsInitialHueTip}</div>
            </div>
            <span class="fn__space"></span>
            <div class="b3-tooltips b3-tooltips__n fn__flex-center" id="neo-colored-lists-initial-hue-tooltip" aria-label="${initialHue}deg">
              <input class="b3-slider fn__size200 neo-colored-hue-slider neo-colored-hue-slider--lists" data-colorstyle="${coloredListsColorStyle}" id="neo-colored-lists-initial-hue" min="0" max="360" step="1" type="range" value="${initialHue}">
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-colored-lists-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-colored-lists-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showColoredListsSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.coloredListsSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const colorStyleSelect = dialog.element.querySelector('#neo-colored-lists-colorstyle') as HTMLSelectElement | null;
  const ruleSelect = dialog.element.querySelector('#neo-colored-lists-initial-hue-rule') as HTMLSelectElement | null;
  const hueItem = dialog.element.querySelector('#neo-colored-lists-initial-hue-item') as HTMLElement | null;
  const hueSlider = dialog.element.querySelector('#neo-colored-lists-initial-hue') as HTMLInputElement | null;
  const hueTooltip = dialog.element.querySelector('#neo-colored-lists-initial-hue-tooltip') as HTMLElement | null;
  const updateColorStylePreview = (): void => {
    hueSlider?.setAttribute('data-colorstyle', normalizeColorStyle(colorStyleSelect?.value));
  };
  const updateHueVisibility = (): void => {
    hueItem?.classList.toggle('fn__none', ruleSelect?.value !== 'fixed');
  };
  if (colorStyleSelect) {
    colorStyleSelect.value = coloredListsColorStyle;
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
  dialog.element.querySelector('#neo-colored-lists-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-colored-lists-confirm')?.addEventListener('click', () => {
    const newColorStyle = normalizeColorStyle(colorStyleSelect?.value);
    const newRule: InitialHueRule = ruleSelect?.value === 'fixed' ? 'fixed' : 'theme';
    const newHue = normalizeInitialHue(hueSlider?.value);
    coloredListsColorStyle = newColorStyle;
    initialHueRule = newRule;
    initialHue = newHue;
    saveConfig({
      'colored-lists-colorstyle': newColorStyle,
      'colored-lists-initial-hue-rule': newRule,
      'colored-lists-initial-hue': newHue,
    } as Partial<Config>);
    if (neoFeatureActive) applySettings();
    dialog.destroy();
  });
}
export function destroyColoredLists(): void {
  neoFeatureActive = false;
  removeCss('element-coloredlists');
  document.documentElement?.classList.remove('neo-element-coloredlists');
  document.documentElement?.style.removeProperty('--_coloredlists-initial-hue');
  document.documentElement?.style.removeProperty('--_coloredlists-c');
}
