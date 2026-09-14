import { type InitialHueRule, type ColorStyle, defaultInitialHue, normalizeInitialHue, normalizeColorStyle, normalizeInitialHueRule } from './color';
import { saveConfig, loadConfig } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { getPlugin } from '../main/context';
import { Dialog } from '../modules/dialog';
let coloredHeadingsColorStyle: ColorStyle = 'default';
let initialHueRule: InitialHueRule = 'theme';
let initialHue = defaultInitialHue;
let outlineFollow = true;
let neoFeatureActive = false;
function applyInitialHue(): void {
  document.documentElement.classList.toggle('neo-coloredheadings-accent', initialHueRule === 'accent');
  if (initialHueRule === 'fixed') {
    document.documentElement.style.setProperty('--_coloredheadings-initial-hue', String(initialHue));
  } else {
    document.documentElement.style.removeProperty('--_coloredheadings-initial-hue');
  }
}
function applyColorStyle(): void {
  if (coloredHeadingsColorStyle === 'default') {
    document.documentElement.style.removeProperty('--_coloredheadings-c');
    return;
  }
  document.documentElement.style.setProperty('--_coloredheadings-c', coloredHeadingsColorStyle === 'soft' ? '0.05' : '0.2');
}
function applySettings(): void {
  applyColorStyle();
  applyInitialHue();
  document.body.classList.toggle('neo-coloredheadings-outline', outlineFollow);
}
function enableColoredHeadings(): void {
  if (neoFeatureActive) return;
  ensureCss('appearance-coloredheadings', featureCss['appearance-coloredheadings']);
  document.documentElement.classList.add('neo-coloredheadings');
  neoFeatureActive = true;
  applySettings();
}
export function initColoredHeadings(): Promise<void> {
  const isCurrent = createNeoLifecycleGuard();
  return loadConfig().then((config) => {
    if (!isCurrent()) return;
    coloredHeadingsColorStyle = normalizeColorStyle(config['coloredheadings-colorstyle']);
    initialHueRule = normalizeInitialHueRule(config['coloredheadings-initial-hue-rule']);
    initialHue = normalizeInitialHue(config['coloredheadings-initial-hue']);
    outlineFollow = config['coloredheadings-outline'] !== false;
    if (neoFeatureActive) {
      applySettings();
    } else if (config['coloredheadings'] === true) {
      enableColoredHeadings();
    }
  });
}
export function onColoredHeadingsClick(): void {
  if (neoFeatureActive) {
    destroyColoredHeadings();
    saveConfig({ 'coloredheadings': false });
  } else {
    enableColoredHeadings();
    saveConfig({ 'coloredheadings': true });
  }
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const colorStyleOptions = ['soft', 'default', 'vivid']
    .map(value => `<option value="${value}">${i18n[`coloredHeadingsColorStyle${value.charAt(0).toUpperCase() + value.slice(1)}`]}</option>`)
    .join('');
  const ruleOptions = ['theme', 'fixed', 'accent']
    .map(value => `<option value="${value}">${i18n[`coloredHeadingsInitialHueRule${value.charAt(0).toUpperCase() + value.slice(1)}`]}</option>`)
    .join('');
  const fixedHueClass = initialHueRule === 'fixed' ? '' : ' fn__none';
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredHeadingsOutline}</div>
              <div class="b3-label__text">${i18n.coloredHeadingsOutlineTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-coloredheadings-outline" type="checkbox">
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredHeadingsInitialHueRule}</div>
              <div class="b3-label__text">${i18n.coloredHeadingsInitialHueRuleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-coloredheadings-initial-hue-rule">
              ${ruleOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredHeadingsColorStyle}</div>
              <div class="b3-label__text">${i18n.coloredHeadingsColorStyleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-coloredheadings-colorstyle">
              ${colorStyleOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item${fixedHueClass}" id="neo-coloredheadings-initial-hue-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.coloredHeadingsInitialHue}</div>
              <div class="b3-label__text">${i18n.coloredHeadingsInitialHueTip}</div>
            </div>
            <span class="fn__space"></span>
            <div class="b3-tooltips b3-tooltips__n fn__flex-center" id="neo-coloredheadings-initial-hue-tooltip" aria-label="${initialHue}deg">
              <input class="b3-slider fn__size200 neo-colored-hue-slider neo-colored-hue-slider--headings" data-colorstyle="${coloredHeadingsColorStyle}" id="neo-coloredheadings-initial-hue" min="0" max="360" step="1" type="range" value="${initialHue}">
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-coloredheadings-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-coloredheadings-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showColoredHeadingsSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.coloredHeadingsSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const outlineSwitch = dialog.element.querySelector('#neo-coloredheadings-outline') as HTMLInputElement | null;
  if (outlineSwitch) outlineSwitch.checked = outlineFollow;
  const colorStyleSelect = dialog.element.querySelector('#neo-coloredheadings-colorstyle') as HTMLSelectElement | null;
  const ruleSelect = dialog.element.querySelector('#neo-coloredheadings-initial-hue-rule') as HTMLSelectElement | null;
  const hueItem = dialog.element.querySelector('#neo-coloredheadings-initial-hue-item') as HTMLElement | null;
  const hueSlider = dialog.element.querySelector('#neo-coloredheadings-initial-hue') as HTMLInputElement | null;
  const hueTooltip = dialog.element.querySelector('#neo-coloredheadings-initial-hue-tooltip') as HTMLElement | null;
  const updateColorStylePreview = (): void => {
    hueSlider?.setAttribute('data-colorstyle', normalizeColorStyle(colorStyleSelect?.value));
  };
  const updateHueVisibility = (): void => {
    hueItem?.classList.toggle('fn__none', ruleSelect?.value !== 'fixed');
    colorStyleSelect?.closest('.config-item')?.classList.toggle('fn__none', ruleSelect?.value === 'accent');
  };
  if (colorStyleSelect) {
    colorStyleSelect.value = coloredHeadingsColorStyle;
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
  dialog.element.querySelector('#neo-coloredheadings-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-coloredheadings-confirm')?.addEventListener('click', () => {
    const newColorStyle = normalizeColorStyle(colorStyleSelect?.value);
    const newRule = normalizeInitialHueRule(ruleSelect?.value);
    const newHue = normalizeInitialHue(hueSlider?.value);
    coloredHeadingsColorStyle = newColorStyle;
    initialHueRule = newRule;
    initialHue = newHue;
    outlineFollow = outlineSwitch?.checked ?? outlineFollow;
    saveConfig({
      'coloredheadings-outline': outlineFollow,
      'coloredheadings-colorstyle': newColorStyle,
      'coloredheadings-initial-hue-rule': newRule,
      'coloredheadings-initial-hue': newHue,
    });
    if (neoFeatureActive) applySettings();
    dialog.destroy();
  });
}
export function destroyColoredHeadings(): void {
  neoFeatureActive = false;
  removeCss('appearance-coloredheadings');
  document.body?.classList.remove('neo-coloredheadings-outline');
  document.documentElement?.classList.remove('neo-coloredheadings', 'neo-coloredheadings-accent');
  document.documentElement?.style.removeProperty('--_coloredheadings-initial-hue');
  document.documentElement?.style.removeProperty('--_coloredheadings-c');
}
