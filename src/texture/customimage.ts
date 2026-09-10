import { showMessage, type Menu } from 'siyuan';
import { Dialog } from '../modules/dialog';
import { openPresetMenu, showPresetMessage } from '../modules/presetmenu';
import { getPlugin } from '../main/context';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import {
  saveConfigIfUnchanged,
  loadConfig,
  type Config,
  type CustomImageConfigKey,
  type CustomImageValues,
  type CustomImageSource,
} from '../main/data';
import { getThemeMode } from '../modules/thememode';
export type { CustomImageConfigKey, CustomImageValues, CustomImageSource };
interface CustomImageCssBinding {
  cssVar: string;
  toCss: (raw: string, values: Readonly<CustomImageValues>) => string;
}
interface CustomImageNumericRule {
  min: number;
  max?: number;
  step: number;
}
export interface CustomImageField {
  configKey: CustomImageConfigKey;
  defaultRaw: string;
  css: readonly CustomImageCssBinding[];
  numeric?: CustomImageNumericRule;
  inputId: string;
  tooltipId: string;
  event: 'input' | 'change';
  tooltipSuffix: string;
}
type CustomImageInput = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
interface CustomImageFieldDom {
  field: CustomImageField;
  input: CustomImageInput | null;
  tooltip: HTMLElement | null;
}
function isCssFunction(raw: string): boolean {
  if (!/^[\w-]+\(/.test(raw)) return false;
  let depth = 0;
  for (const ch of raw) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}
function isColorValue(raw: string): boolean {
  if (!raw) return false;
  if (/^#[0-9a-fA-F]{3,8}$/.test(raw)) return true;
  if (isCssFunction(raw)) return false;
  return typeof CSS !== 'undefined' && CSS.supports('color', raw);
}
function splitTopLevel(raw: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(raw.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(raw.slice(start));
  return parts;
}
function toInfoValue(raw: string | undefined): string {
  if (!raw) return 'none';
  const v = raw.trim().replace(/;+$/, '');
  if (!v) return 'none';
  const parts = splitTopLevel(v)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  if (parts.length === 0) return 'none';
  return parts
    .map(seg => {
      if (isColorValue(seg)) return seg;
      return isCssFunction(seg) ? seg : `url(${seg})`;
    })
    .join(', ');
}
const zlevelMap: Record<string, string> = { backdrop: '-99', content: '1', topmost: '99' };
const fieldDefs: CustomImageField[] = [
  { configKey: 'customimage-info', defaultRaw: '', css: [
    { cssVar: '--neo-customimage-info', toCss: raw => toInfoValue(raw) },
  ], inputId: 'neo-customimage-path', tooltipId: '', event: 'input', tooltipSuffix: '' },
  { configKey: 'customimage-blur', defaultRaw: '0', css: [
    { cssVar: '--neo-customimage-blur', toCss: raw => raw + 'px' },
  ], numeric: { min: 0, max: 50, step: 1 }, inputId: 'neo-customimage-blur', tooltipId: 'neo-customimage-blur-tooltip', event: 'input', tooltipSuffix: 'px' },
  { configKey: 'customimage-x', defaultRaw: '50', css: [
    { cssVar: '--neo-customimage-x', toCss: raw => raw + '%' },
  ], numeric: { min: 0, max: 100, step: 1 }, inputId: 'neo-customimage-x', tooltipId: 'neo-customimage-x-tooltip', event: 'input', tooltipSuffix: '%' },
  { configKey: 'customimage-y', defaultRaw: '50', css: [
    { cssVar: '--neo-customimage-y', toCss: raw => raw + '%' },
  ], numeric: { min: 0, max: 100, step: 1 }, inputId: 'neo-customimage-y', tooltipId: 'neo-customimage-y-tooltip', event: 'input', tooltipSuffix: '%' },
  { configKey: 'customimage-opacity', defaultRaw: '0.12', css: [
    { cssVar: '--neo-customimage-opacity', toCss: raw => raw },
  ], numeric: { min: 0, max: 0.8, step: 0.01 }, inputId: 'neo-customimage-opacity', tooltipId: 'neo-customimage-opacity-tooltip', event: 'input', tooltipSuffix: '' },
  { configKey: 'customimage-effect', defaultRaw: 'normal', css: [
    { cssVar: '--neo-customimage-effect', toCss: raw => raw },
  ], inputId: 'neo-customimage-effect', tooltipId: '', event: 'change', tooltipSuffix: '' },
  { configKey: 'customimage-background-blend-mode', defaultRaw: 'normal', css: [
    { cssVar: '--neo-customimage-background-blend-mode', toCss: raw => raw },
  ], inputId: 'neo-customimage-background-blend-mode', tooltipId: '', event: 'change', tooltipSuffix: '' },
  { configKey: 'customimage-brightness', defaultRaw: '1', css: [
    { cssVar: '--neo-customimage-brightness', toCss: raw => raw },
  ], numeric: { min: 0.5, max: 1.5, step: 0.01 }, inputId: 'neo-customimage-brightness', tooltipId: 'neo-customimage-brightness-tooltip', event: 'input', tooltipSuffix: '' },
  { configKey: 'customimage-saturation', defaultRaw: '1', css: [
    { cssVar: '--neo-customimage-saturation', toCss: raw => raw },
  ], numeric: { min: 0, max: 2, step: 0.01 }, inputId: 'neo-customimage-saturation', tooltipId: 'neo-customimage-saturation-tooltip', event: 'input', tooltipSuffix: '' },
  { configKey: 'customimage-contrast', defaultRaw: '1', css: [
    { cssVar: '--neo-customimage-contrast', toCss: raw => raw },
  ], numeric: { min: 0, max: 2, step: 0.01 }, inputId: 'neo-customimage-contrast', tooltipId: 'neo-customimage-contrast-tooltip', event: 'input', tooltipSuffix: '' },
  { configKey: 'customimage-grayscale', defaultRaw: '0', css: [
    { cssVar: '--neo-customimage-grayscale', toCss: raw => raw },
  ], numeric: { min: 0, max: 1, step: 0.01 }, inputId: 'neo-customimage-grayscale', tooltipId: 'neo-customimage-grayscale-tooltip', event: 'input', tooltipSuffix: '' },
  { configKey: 'customimage-hue-rotate', defaultRaw: '0', css: [
    { cssVar: '--neo-customimage-hue-rotate', toCss: raw => raw + 'deg' },
  ], numeric: { min: 0, max: 360, step: 1 }, inputId: 'neo-customimage-hue-rotate', tooltipId: 'neo-customimage-hue-rotate-tooltip', event: 'input', tooltipSuffix: 'deg' },
  { configKey: 'customimage-zlevel', defaultRaw: 'topmost', css: [
    { cssVar: '--neo-customimage-zlevel', toCss: raw => zlevelMap[raw] ?? zlevelMap.topmost },
  ], inputId: 'neo-customimage-zlevel', tooltipId: '', event: 'change', tooltipSuffix: '' },
  { configKey: 'customimage-layout-opacity', defaultRaw: '0.9', css: [
    { cssVar: '--neo-customimage-layout-opacity', toCss: (raw, values) => values['customimage-zlevel'] === 'backdrop' ? raw : '1' },
  ], numeric: { min: 0.5, max: 1, step: 0.01 }, inputId: 'neo-customimage-layout-opacity', tooltipId: 'neo-customimage-layout-opacity-tooltip', event: 'input', tooltipSuffix: '' },
  { configKey: 'customimage-fill-mode', defaultRaw: 'scale', css: [
    { cssVar: '--neo-customimage-repeat', toCss: (raw, values) => {
      if (raw === 'tile') return 'repeat';
      if (raw === 'custom') return values['customimage-fill-repeat'] === 'true' ? 'repeat' : 'no-repeat';
      return 'no-repeat';
    } },
    { cssVar: '--neo-customimage-size', toCss: (raw, values) => {
      if (raw === 'tile') return 'auto';
      if (raw === 'custom') {
        const width = values['customimage-fill-width'];
        const height = values['customimage-fill-height'];
        const unit = values['customimage-fill-unit'];
        return `${width}${unit} ${height}${unit}`;
      }
      return 'cover';
    } },
  ], inputId: 'neo-customimage-fill-mode', tooltipId: '', event: 'change', tooltipSuffix: '' },
  { configKey: 'customimage-fill-width', defaultRaw: '1', css: [], numeric: { min: 1, step: 1 }, inputId: 'neo-customimage-fill-width', tooltipId: '', event: 'input', tooltipSuffix: '' },
  { configKey: 'customimage-fill-height', defaultRaw: '1', css: [], numeric: { min: 1, step: 1 }, inputId: 'neo-customimage-fill-height', tooltipId: '', event: 'input', tooltipSuffix: '' },
  { configKey: 'customimage-fill-unit', defaultRaw: 'px', css: [], inputId: 'neo-customimage-fill-unit', tooltipId: '', event: 'change', tooltipSuffix: '' },
  { configKey: 'customimage-fill-repeat', defaultRaw: 'false', css: [], inputId: 'neo-customimage-fill-repeat', tooltipId: '', event: 'change', tooltipSuffix: '' },
];
const defaultCustomImageValues = Object.freeze(Object.fromEntries(
  fieldDefs.map(field => [field.configKey, field.defaultRaw]),
) as CustomImageValues);
function normalizeCustomImageValues(source?: CustomImageSource | null): CustomImageValues {
  const values = { ...defaultCustomImageValues };
  for (const field of fieldDefs) {
    const raw = source?.[field.configKey];
    let value: string | null = null;
    if (typeof raw === 'string' && raw !== '') value = raw;
    else if (typeof raw === 'number' && Number.isFinite(raw)) value = String(raw);
    else if (typeof raw === 'boolean') value = String(raw);
    if (value === null) continue;
    if (field.numeric) {
      const numericValue = Number(value.trim());
      if (!Number.isFinite(numericValue)) continue;
      const boundedValue = Math.min(field.numeric.max ?? Number.POSITIVE_INFINITY, Math.max(field.numeric.min, numericValue));
      value = String(boundedValue);
    }
    values[field.configKey] = value;
  }
  return values;
}
function readInputValue(input: CustomImageInput): string {
  return input instanceof HTMLInputElement && input.type === 'checkbox'
    ? (input.checked ? 'true' : 'false')
    : input.value;
}
function writeInputValue(input: CustomImageInput, value: string): void {
  if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = value === 'true';
  else input.value = value;
}
function readFieldDomValues(fieldDom: CustomImageFieldDom[]): CustomImageValues {
  const source: CustomImageSource = {};
  for (const { field, input } of fieldDom) {
    if (input) source[field.configKey] = readInputValue(input);
  }
  return normalizeCustomImageValues(source);
}
function writeFieldDomValues(fieldDom: CustomImageFieldDom[], source?: CustomImageSource | null): CustomImageValues {
  const values = normalizeCustomImageValues(source);
  for (const { field, input, tooltip } of fieldDom) {
    if (!input) continue;
    const value = values[field.configKey];
    writeInputValue(input, value);
    if (tooltip) tooltip.setAttribute('aria-label', value + field.tooltipSuffix);
  }
  return values;
}
function syncConditionalVisibility(
  values: Readonly<CustomImageValues>,
  customWrap: HTMLElement | null,
  layoutOpacityWrap: HTMLElement | null,
): void {
  customWrap?.classList.toggle('fn__none', values['customimage-fill-mode'] !== 'custom');
  layoutOpacityWrap?.classList.toggle('fn__none', values['customimage-zlevel'] !== 'backdrop');
}
let neoFeatureActive = false;
function applyCustomImageCss(config?: CustomImageSource | null): void {
  const style = document.documentElement.style;
  const values = normalizeCustomImageValues(config);
  for (const field of fieldDefs) {
    for (const binding of field.css) {
      style.setProperty(binding.cssVar, binding.toCss(values[field.configKey], values));
    }
  }
}
function clearCustomImageCss(): void {
  const style = document.documentElement.style;
  for (const field of fieldDefs) {
    for (const binding of field.css) style.removeProperty(binding.cssVar);
  }
}
export function enableCustomImage(config?: CustomImageSource | null): void {
  if (neoFeatureActive) return;
  document.documentElement.classList.add('neo-texture-customimage');
  neoFeatureActive = true;
  applyCustomImageCss(config ?? {});
}
export function destroyCustomImage(): void {
  neoFeatureActive = false;
  document.documentElement.classList.remove('neo-texture-customimage');
  clearCustomImageCss();
}
type ThemeMode = ReturnType<typeof getThemeMode>;
function getCurrentPresetName(config: Config, mode: ThemeMode): string {
  const presets = config[`customimage-presets-${mode}`] ?? {};
  const selected = config[`customimage-preset-current-${mode}`] ?? '';
  return Object.prototype.hasOwnProperty.call(presets, selected) ? selected : '';
}
function getValues(config: Config, mode: ThemeMode): CustomImageValues {
  const presets = config[`customimage-presets-${mode}`] ?? {};
  return normalizeCustomImageValues(presets[getCurrentPresetName(config, mode)]);
}
interface SliderConfig {
  id: string;
  tooltipId: string;
  i18nKey: string;
  i18nTipKey: string;
  tipKey?: string;
  tipTitleKey?: string;
  min: number;
  max: number;
  step: number;
  val: number | string;
  tooltipSuffix: string;
}
function getSliderConfig(key: string): SliderConfig | null {
  const field = fieldDefs.find(f => f.configKey === key);
  const numeric = field?.numeric;
  if (!field || !numeric || numeric.max === undefined) return null;
  const i18nMap: Record<string, string> = {
    'customimage-x': 'customimagePositionX',
    'customimage-y': 'customimagePositionY',
  };
  const i18nKey = i18nMap[key] || ('customimage' + key.replace('customimage-', '').replace(/(^\w|-\w)/g, s => s.replace('-', '').toUpperCase()));
  const tipKey = key === 'customimage-layout-opacity' ? 'customimageLayoutOpacityTip' : undefined;
  const tipTitleKey = key === 'customimage-layout-opacity' ? 'customimageLayoutOpacity' : undefined;
  const val = field.defaultRaw;
  return {
    id: 'neo-' + key,
    tooltipId: 'neo-' + key + '-tooltip',
    i18nKey,
    i18nTipKey: 'customDefaultValue',
    tipKey,
    tipTitleKey,
    min: numeric.min, max: numeric.max, step: numeric.step, val,
    tooltipSuffix: field.tooltipSuffix,
  };
}
function t(i18n: Record<string, string>, key: string): string {
  return i18n[key] || key;
}
function sliderHTML(i18n: Record<string, string>, sc: SliderConfig): string {
  const tip = sc.tipKey ? `<span class="neo-config-name-tip" data-tip-key="${sc.tipKey}" data-tip-title="${sc.tipTitleKey ?? sc.i18nKey}">${t(i18n, 'customimagePathTipToggle')}</span>` : '';
  return `<label class="fn__flex b3-label config-item">
    <div class="fn__flex-1 config-item__main">
      <div class="config-name">${t(i18n, sc.i18nKey)}${tip}</div>
      <div class="b3-label__text">${t(i18n, 'customDefaultValue')}${sc.val}${sc.tooltipSuffix}</div>
    </div>
    <span class="fn__space"></span>
    <div class="b3-tooltips b3-tooltips__n fn__flex-center" id="${sc.tooltipId}" aria-label="${sc.val}${sc.tooltipSuffix}">
      <input class="b3-slider fn__size200" id="${sc.id}" max="${sc.max}" min="${sc.min}" step="${sc.step}" type="range" value="${sc.val}">
    </div>
  </label>`;
}
function textFieldHTML(i18n: Record<string, string>, id: string, i18nKey: string, i18nTipKey: string, multiline = false): string {
  if (multiline) {
    const tipTitleKey = i18nKey + 'TipTitle';
    const tipTitle = tipTitleKey in i18n ? t(i18n, tipTitleKey) : t(i18n, i18nKey);
    return `<div class="b3-label config-item" data-config-item-id="${id}">
    <div class="fn__block">
        <div class="config-name">${t(i18n, i18nKey)}<span class="neo-config-name-tip" data-tip-key="${i18nTipKey}" data-tip-title="${tipTitle}">${t(i18n, 'customimagePathTipToggle')}</span></div>
        <div class="fn__hr--small"></div>
        <textarea class="b3-text-field fn__block" id="${id}" spellcheck="false"></textarea>
    </div>
</div>`;
  }
  return `<label class="fn__flex b3-label config-item">
    <div class="fn__flex-1 config-item__main">
      <div class="config-name">${t(i18n, i18nKey)}</div>
      <div class="b3-label__text">${t(i18n, i18nTipKey)}</div>
    </div>
    <span class="fn__space"></span>
    <input class="b3-text-field fn__flex-center fn__size200" id="${id}" spellcheck="false">
  </label>`;
}
function effectSelectHTML(i18n: Record<string, string>, id: string, i18nKey: string): string {
  const defaultValue = defaultCustomImageValues['customimage-effect'];
  const opts = ['normal', 'multiply', 'luminosity', 'screen', 'color', 'overlay', 'soft-light', 'color-burn', 'color-dodge']
    .map(v => `<option value="${v}"${v === defaultValue ? ' selected' : ''}>${t(i18n, `customimageEffect${v.charAt(0).toUpperCase() + v.slice(1).replace(/-(\w)/g, (_, c) => c.toUpperCase())}`)}</option>`)
    .join('');
  return `<label class="fn__flex b3-label config-item">
    <div class="fn__flex-1 config-item__main">
      <div class="config-name">${t(i18n, i18nKey)}<span class="neo-config-name-tip" data-tip-key="customimageEffectTip" data-tip-title="customimageEffect">${t(i18n, 'customimagePathTipToggle')}</span></div>
      <div class="b3-label__text">${t(i18n, 'customDefaultValue')}${t(i18n, 'customimageEffectNormal')}</div>
    </div>
    <span class="fn__space"></span>
    <select class="b3-select fn__flex-center fn__size200" id="${id}">${opts}</select>
  </label>`;
}
function blendModeSelectHTML(i18n: Record<string, string>, id: string, i18nKey: string): string {
  const defaultValue = defaultCustomImageValues['customimage-background-blend-mode'];
  const opts = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity']
    .map(v => `<option value="${v}"${v === defaultValue ? ' selected' : ''}>${t(i18n, `customimageBackgroundBlendMode${v.charAt(0).toUpperCase() + v.slice(1).replace(/-(\w)/g, (_, c) => c.toUpperCase())}`)}</option>`)
    .join('');
  return `<label class="fn__flex b3-label config-item">
    <div class="fn__flex-1 config-item__main">
      <div class="config-name">${t(i18n, i18nKey)}</div>
      <div class="b3-label__text">${t(i18n, 'customDefaultValue')}${t(i18n, 'customimageBackgroundBlendModeNormal')}</div>
    </div>
    <span class="fn__space"></span>
    <select class="b3-select fn__flex-center fn__size200" id="${id}">${opts}</select>
  </label>`;
}
function zlevelSelectHTML(i18n: Record<string, string>, id: string, i18nKey: string): string {
  const defaultValue = defaultCustomImageValues['customimage-zlevel'];
  const opts = ['backdrop', 'content', 'topmost']
    .map(v => `<option value="${v}"${v === defaultValue ? ' selected' : ''}>${t(i18n, `customimageZLevel${v.charAt(0).toUpperCase() + v.slice(1)}`)}</option>`)
    .join('');
  const layoutOpacitySlider = sliderHTML(i18n, getSliderConfig('customimage-layout-opacity')!);
  return `<label class="fn__flex b3-label config-item">
    <div class="fn__flex-1 config-item__main">
      <div class="config-name">${t(i18n, i18nKey)}<span class="neo-config-name-tip" data-tip-key="customimageZLevelTip" data-tip-title="customimageZLevel">${t(i18n, 'customimagePathTipToggle')}</span></div>
      <div class="b3-label__text">${t(i18n, 'customDefaultValue')}${t(i18n, 'customimageZLevelTopmost')}</div>
    </div>
    <span class="fn__space"></span>
    <select class="b3-select fn__flex-center fn__size200" id="${id}">${opts}</select>
  </label>
  <div class="fn__none" id="neo-customimage-layout-opacity-wrap">
    ${layoutOpacitySlider}
  </div>`;
}
function fillModeSelectHTML(i18n: Record<string, string>, id: string, i18nKey: string): string {
  const defaultValue = defaultCustomImageValues['customimage-fill-mode'];
  const opts = ['scale', 'tile', 'custom']
    .map(v => `<option value="${v}"${v === defaultValue ? ' selected' : ''}>${t(i18n, `customimageFillMode${v.charAt(0).toUpperCase() + v.slice(1)}`)}</option>`)
    .join('');
  return `<label class="fn__flex b3-label config-item">
    <div class="fn__flex-1 config-item__main">
      <div class="config-name">${t(i18n, i18nKey)}<span class="neo-config-name-tip" data-tip-key="customimageFillModeTip" data-tip-title="customimageFillMode">${t(i18n, 'customimagePathTipToggle')}</span></div>
      <div class="b3-label__text">${t(i18n, 'customDefaultValue')}${t(i18n, 'customimageFillModeScale')}</div>
    </div>
    <span class="fn__space"></span>
    <select class="b3-select fn__flex-center fn__size200" id="${id}">${opts}</select>
  </label>
  <div class="b3-label config-item fn__none" id="neo-customimage-fill-custom">
    <div class="fn__block">
      <div class="config-name">${t(i18n, 'customimageCustomFillTitle')}</div>
      <div class="fn__hr--small"></div>
      <div class="fn__flex config-wrap">
        <div class="fn__block">
          <div class="b3-label__text">${t(i18n, 'customimageCustomFillUnit')}</div>
        </div>
        <span class="fn__space"></span>
        <select class="b3-select fn__flex-center fn__size200" id="neo-customimage-fill-unit">
          ${['px', '%', 'em', 'rem', 'vh', 'vw'].map(unit => `<option value="${unit}"${unit === defaultCustomImageValues['customimage-fill-unit'] ? ' selected' : ''}>${unit}</option>`).join('')}
        </select>
      </div>
      <div class="fn__hr--small"></div>
      <div class="fn__flex config-wrap">
        <div class="fn__block">
          <div class="b3-label__text">${t(i18n, 'customimageCustomFillWidth')}</div>
        </div>
        <span class="fn__space"></span>
        <input class="b3-text-field fn__flex-center fn__size200" type="number" min="1" step="1" value="${defaultCustomImageValues['customimage-fill-width']}" id="neo-customimage-fill-width">
      </div>
      <div class="fn__hr--small"></div>
      <div class="fn__flex config-wrap">
        <div class="fn__block">
          <div class="b3-label__text">${t(i18n, 'customimageCustomFillHeight')}</div>
        </div>
        <span class="fn__space"></span>
        <input class="b3-text-field fn__flex-center fn__size200" type="number" min="1" step="1" value="${defaultCustomImageValues['customimage-fill-height']}" id="neo-customimage-fill-height">
      </div>
      <div class="fn__hr--small"></div>
      <div class="fn__flex config-wrap">
        <div class="fn__block">
          <div class="b3-label__text">${t(i18n, 'customimageCustomFillRepeat')}</div>
        </div>
        <span class="fn__space"></span>
        <input class="b3-switch fn__flex-center" type="checkbox" id="neo-customimage-fill-repeat"${defaultCustomImageValues['customimage-fill-repeat'] === 'true' ? ' checked' : ''}>
      </div>
    </div>
  </div>`;
}
function buildSettingsHTML(i18n: Record<string, string>, mode: ThemeMode): string {
  const basicSliderKeys = ['customimage-blur'];
  const basicSliders = basicSliderKeys.map(k => sliderHTML(i18n, getSliderConfig(k)!)).join('');
  const opacitySlider = sliderHTML(i18n, getSliderConfig('customimage-opacity')!);
  const effectSelect = effectSelectHTML(i18n, 'neo-customimage-effect', 'customimageEffect');
  const blendModeSelect = blendModeSelectHTML(i18n, 'neo-customimage-background-blend-mode', 'customimageBackgroundBlendMode');
  const moreSliderKeys = ['customimage-hue-rotate', 'customimage-brightness', 'customimage-saturation', 'customimage-contrast', 'customimage-grayscale'];
  const moreSliders = moreSliderKeys.map(k => sliderHTML(i18n, getSliderConfig(k)!)).join('');
  const positionSliderKeys = ['customimage-x', 'customimage-y'];
  const positionSliders = positionSliderKeys.map(k => sliderHTML(i18n, getSliderConfig(k)!)).join('');
  return `<div class="b3-dialog__content">
  <div class="config__tab-container">
    <div class="config-group">
      <div class="config-title">${t(i18n, 'customimagePresetTip')}</div>
      <div class="config-items">
        <label class="fn__flex b3-label config-item">
          <div class="fn__flex-1 config-item__main">
            <div class="config-name">${t(i18n, mode === 'dark' ? 'customimagePresetSelectDark' : 'customimagePresetSelectLight')}</div>
            <div class="b3-label__text">${t(i18n, 'customimagePresetSelectTip')}</div>
          </div>
          <span class="fn__space"></span>
          <button type="button" class="b3-select fn__flex-center fn__size200 fn__ellipsis" style="text-align:left" id="neo-customimage-preset-select" aria-label="${t(i18n, mode === 'dark' ? 'customimagePresetSelectDark' : 'customimagePresetSelectLight')}" aria-haspopup="listbox" aria-expanded="false">&nbsp;</button>
        </label>
      </div>
    </div>
    <div class="config-group">
      <div class="config-title">${t(i18n, 'customimageImageInfo')}</div>
      <div class="config-items">
        ${textFieldHTML(i18n, 'neo-customimage-path', 'customimagePath', 'customimagePathTip', true)}
      </div>
    </div>
    <div class="config-group">
      <div class="config-title">${t(i18n, 'customimageBasicParams')}</div>
      <div class="config-items">
        ${zlevelSelectHTML(i18n, 'neo-customimage-zlevel', 'customimageZLevel')}
        ${effectSelect}
        ${fillModeSelectHTML(i18n, 'neo-customimage-fill-mode', 'customimageFillMode')}
        ${opacitySlider}
        ${basicSliders}
      </div>
    </div>
    <div class="config-group">
      <div class="config-title">${t(i18n, 'customimageMoreParams')}</div>
      <div class="config-items">
        ${positionSliders}
        ${blendModeSelect}
        ${moreSliders}
      </div>
    </div>
  </div>
</div>
<div class="b3-dialog__action">
  <button class="b3-button b3-button--cancel" id="neo-customimage-cancel">${t(i18n, 'close')}</button>
  <span class="fn__space"></span>
  <button class="b3-button" id="neo-customimage-new-preset">${t(i18n, 'customimageNewPreset')}</button>
  <span class="fn__space"></span>
  <button class="b3-button b3-button--text" id="neo-customimage-update-preset">${t(i18n, 'customimageUpdateApply')}</button>
</div>`;
}
function confirmPresetAction(title: string, content: string, action: string, cancel: string): Promise<boolean> {
  return new Promise(resolve => {
    const dialog = new Dialog({
      title,
      content: `<div class="b3-dialog__content"></div><div class="b3-dialog__action">
        <button class="b3-button b3-button--cancel" id="neo-customimage-action-cancel">${cancel}</button>
        <span class="fn__space"></span>
        <button class="b3-button b3-button--remove" id="neo-customimage-action-confirm">${action}</button>
      </div>`,
      destroyCallback: () => resolve(false),
    });
    dialog.element.classList.add('neo-settings-dialog');
    dialog.element.querySelector('.b3-dialog__content')!.textContent = content;
    dialog.element.querySelector('#neo-customimage-action-cancel')?.addEventListener('click', () => dialog.destroy());
    dialog.element.querySelector('#neo-customimage-action-confirm')?.addEventListener('click', () => {
      resolve(true);
      dialog.destroy();
    });
  });
}
export async function showCustomImageSettings(): Promise<void> {
  const plugin = getPlugin();
  if (!plugin) return;
  const isCurrent = createNeoLifecycleGuard();
  let config = await loadConfig();
  if (!isCurrent()) return;
  const mode = getThemeMode();
  const presetsKey = mode === 'dark' ? 'customimage-presets-dark' : 'customimage-presets-light';
  const currentKey = mode === 'dark' ? 'customimage-preset-current-dark' : 'customimage-preset-current-light';
  const { i18n } = plugin;
  let presets = config[presetsKey] ?? {};
  let selected = config[currentKey] ?? '';
  if (!Object.prototype.hasOwnProperty.call(presets, selected)) selected = '';
  let savedValues = getValues(config, mode);
  let saving = false;
  let presetMenu: Menu | null = null;
  let closePromptOpen = false;
  let dirty = false;
  function canPreview(): boolean {
    return isCurrent() && getThemeMode() === mode && neoFeatureActive;
  }
  const dialog = new Dialog({
    title: `<div class="fn__flex">
      <div class="fn__ellipsis">${i18n.customimageSettings}</div>
      <span class="fn__space"></span>
      <button class="b3-button b3-button--small fn__flex-center" id="neo-customimage-reset-preset">${i18n.customimageResetPreset}</button>
    </div>`,
    content: buildSettingsHTML(i18n, mode),
    destroyCallback: () => {
      presetMenu?.close();
      if (canPreview()) applyCustomImageCss(savedValues);
    },
  });
  dialog.element.classList.add('neo-settings-dialog');
  const presetButton = dialog.element.querySelector<HTMLButtonElement>('#neo-customimage-preset-select')!;
  const fieldDom: CustomImageFieldDom[] = fieldDefs.map(f => ({
    field: f,
    input: dialog.element.querySelector('#' + f.inputId) as CustomImageInput | null,
    tooltip: f.tooltipId ? dialog.element.querySelector('#' + f.tooltipId) as HTMLElement | null : null,
  }));
  const btn = (id: string) => dialog.element.querySelector(id) as HTMLButtonElement | null;
  const buildPresetFromDom = (): Partial<CustomImageValues> => {
    const preset: Partial<CustomImageValues> = readFieldDomValues(fieldDom);
    if (preset['customimage-fill-mode'] !== 'custom') {
      delete preset['customimage-fill-width'];
      delete preset['customimage-fill-height'];
      delete preset['customimage-fill-unit'];
      delete preset['customimage-fill-repeat'];
    }
    return preset;
  };
  const customFillWrap = dialog.element.querySelector('#neo-customimage-fill-custom') as HTMLElement | null;
  const updateFillCustomVisibility = (mode: string): void => {
    customFillWrap?.classList.toggle('fn__none', mode !== 'custom');
  };
  const layoutOpacityWrap = dialog.element.querySelector('#neo-customimage-layout-opacity-wrap') as HTMLElement | null;
  const updateLayoutOpacityVisibility = (level: string): void => {
    layoutOpacityWrap?.classList.toggle('fn__none', level !== 'backdrop');
  };
  const setFormValues = (source?: CustomImageSource | null, updatePreview = false): CustomImageValues => {
    const values = writeFieldDomValues(fieldDom, source);
    syncConditionalVisibility(values, customFillWrap, layoutOpacityWrap);
    if (updatePreview && canPreview()) applyCustomImageCss(values);
    return values;
  };
  function updatePresetButton(): void {
    presetButton.value = selected;
    presetButton.textContent = selected || '\u00a0';
  }
  updatePresetButton();
  async function persist(nextPresets: Record<string, CustomImageSource>, name: string, preserveDraft = false): Promise<boolean> {
    if (!isCurrent() || saving || !dialog.element.isConnected) return false;
    saving = true;
    const controls = dialog.element.querySelectorAll<CustomImageInput | HTMLButtonElement>('input, textarea, select, button');
    controls.forEach(control => { control.disabled = true; });
    const patch: Partial<Config> = {};
    patch[presetsKey] = nextPresets;
    patch[currentKey] = name;
    const expected: Partial<Config> = {};
    expected[presetsKey] = config[presetsKey];
    expected[currentKey] = config[currentKey];
    try {
      if (!await saveConfigIfUnchanged(patch, expected)) {
        if (isCurrent()) showMessage(i18n.customimagePresetsChanged);
        return false;
      }
      if (!isCurrent()) return false;
      config = { ...config, ...patch };
      presets = nextPresets;
      selected = name;
      savedValues = getValues(config, mode);
      updatePresetButton();
      if (!preserveDraft) {
        setFormValues(savedValues, true);
        dirty = false;
      }
      return true;
    } catch {
      if (isCurrent()) showMessage(i18n.customimageSaveFailed);
      return false;
    } finally {
      saving = false;
      controls.forEach(control => { control.disabled = false; });
    }
  }
  setFormValues(savedValues);
  const applyCssFromDom = (): void => {
    if (!canPreview()) return;
    applyCustomImageCss(readFieldDomValues(fieldDom));
  };
  for (const { field, input, tooltip } of fieldDom) {
    if (!input) continue;
    input.addEventListener(field.event, () => {
      dirty = true;
      const v = readInputValue(input);
      if (tooltip && field.tooltipSuffix !== undefined) tooltip.setAttribute('aria-label', v + field.tooltipSuffix);
      if (field.configKey === 'customimage-fill-mode') updateFillCustomVisibility(v);
      if (field.configKey === 'customimage-zlevel') updateLayoutOpacityVisibility(v);
      applyCssFromDom();
    });
  }
  const resetFormToDefaults = (): void => {
    const currentValues = readFieldDomValues(fieldDom);
    setFormValues({ 'customimage-info': currentValues['customimage-info'] }, true);
  };
  btn('#neo-customimage-reset-preset')?.addEventListener('click', () => {
    resetFormToDefaults();
    dirty = true;
  });
  dialog.element.querySelectorAll<HTMLElement>('[data-tip-key]').forEach(btnEl => {
    btnEl.addEventListener('click', () => {
      const tipKey = btnEl.dataset.tipKey;
      const titleKey = btnEl.dataset.tipTitle;
      if (!tipKey) return;
      new Dialog({
        title: titleKey ? t(i18n, titleKey) : '',
        content: `<div class="b3-dialog__content"><div class="b3-label__text">${t(i18n, tipKey)}</div></div>`,
      });
    });
  });
  const originalDestroy = dialog.destroy.bind(dialog);
  dialog.destroy = (): void => {
    if (saving || closePromptOpen) return;
    if (!isCurrent() || !dirty) {
      originalDestroy();
      return;
    }
    closePromptOpen = true;
    void confirmPresetAction(i18n.customimageUnsavedTitle, i18n.customimageUnsavedContent, i18n.customimageUnsavedExit, i18n.customimageUnsavedBack)
      .then(discard => {
        closePromptOpen = false;
        if (discard) originalDestroy();
      });
  };
  dialog.element.querySelector('#neo-customimage-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-customimage-update-preset')?.addEventListener('click', async () => {
    if (!selected) { showMessage(i18n.customimagePresetNotSelected); return; }
    if (await persist({ ...presets, [selected]: buildPresetFromDom() }, selected)) {
      showPresetMessage(i18n.customimagePresetUpdated, selected);
      dialog.destroy();
    }
  });
  presetButton.addEventListener('click', () => {
    if (!isCurrent() || saving) return;
    presetMenu?.close();
    presetMenu = openPresetMenu(
      presetButton,
      Object.keys(presets).map(name => ({ key: name, label: name })),
      i18n.customimagePresetSearch,
      mode === 'dark' ? i18n.customimagePresetSelectDark : i18n.customimagePresetSelectLight,
      async name => {
        if (!name || name === selected) return;
        if (dirty && !await confirmPresetAction(i18n.customimagePresetSwitchTitle, i18n.customimagePresetSwitchContent, i18n.customimagePresetSwitchConfirm, i18n.customimagePresetSwitchCancel)) return;
        await persist(presets, name);
      },
      () => { presetMenu = null; },
      [
        { label: i18n.customimageRenamePreset, icon: 'iconEdit', rename: renamePreset },
        { label: i18n.customimageDelete, icon: 'iconTrashcan', click: deletePreset },
      ],
    );
  });
  async function deletePreset(name: string): Promise<void> {
    if (!isCurrent() || saving || !Object.prototype.hasOwnProperty.call(presets, name)) return;
    if (!await confirmPresetAction(i18n.customimagePresetDeleteConfirmTitle, i18n.customimagePresetDeleteConfirmContent.replace('${name}', () => name), i18n.customimageDelete, i18n.cancel)) return;
    const next = { ...presets };
    delete next[name];
    if (await persist(next, name === selected ? '' : selected, name !== selected)) {
      showPresetMessage(i18n.customimagePresetDeleted, name);
    }
  }
  async function renamePreset(oldName: string, name: string): Promise<boolean> {
    if (!isCurrent() || saving || !dialog.element.isConnected || !Object.prototype.hasOwnProperty.call(presets, oldName)) return false;
    name = name.trim();
    if (!name) {
      showMessage(i18n.customimagePresetNameEmpty);
      return false;
    }
    if (name === oldName) return true;
    if (Object.prototype.hasOwnProperty.call(presets, name)) {
      showMessage(i18n.customimagePresetNameExists);
      return false;
    }
    const next = Object.fromEntries(Object.entries(presets).map(([key, value]) => [key === oldName ? name : key, value]));
    return persist(next, selected === oldName ? name : selected, true);
  }
  function showNewPreset(source: Partial<CustomImageValues>, title: string): Promise<boolean> {
    return new Promise(resolve => {
      const nameDialog = new Dialog({
        title,
        content: `<div class="b3-dialog__content"><label class="fn__flex b3-label config-item">
          <div class="fn__flex-1 config-item__main"><div class="config-name">${i18n.customimagePresetName}</div><div class="b3-label__text">${i18n.customimagePresetNameTip}</div></div>
          <span class="fn__space"></span><input class="b3-text-field fn__flex-center fn__size200" id="neo-customimage-preset-name" spellcheck="false">
        </label></div><div class="b3-dialog__action">
          <button class="b3-button b3-button--cancel" id="neo-customimage-name-cancel">${i18n.cancel}</button><span class="fn__space"></span>
          <button class="b3-button b3-button--text" id="neo-customimage-name-confirm">${i18n.confirm}</button>
        </div>`,
        destroyCallback: () => resolve(false),
      });
      nameDialog.element.classList.add('neo-settings-dialog');
      const nameInput = nameDialog.element.querySelector<HTMLInputElement>('#neo-customimage-preset-name')!;
      nameInput.focus();
      nameDialog.element.querySelector('#neo-customimage-name-cancel')?.addEventListener('click', () => nameDialog.destroy());
      const confirmButton = nameDialog.element.querySelector<HTMLButtonElement>('#neo-customimage-name-confirm')!;
      let submitting = false;
      const destroyNameDialog = nameDialog.destroy.bind(nameDialog);
      nameDialog.destroy = (): void => {
        if (!submitting || !isCurrent()) destroyNameDialog();
      };
      const controls = nameDialog.element.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button');
      const submit = async (): Promise<void> => {
        if (submitting || !isCurrent() || !nameDialog.element.isConnected || !dialog.element.isConnected) return;
        const name = nameInput.value.trim();
        if (!name) { showMessage(i18n.customimagePresetNameEmpty); return; }
        submitting = true;
        controls.forEach(control => { control.disabled = true; });
        try {
          if (Object.prototype.hasOwnProperty.call(presets, name)
            && !await confirmPresetAction(i18n.customimagePresetOverwriteTitle, i18n.customimagePresetOverwriteContent.replace('${name}', () => name), i18n.confirm, i18n.cancel)) return;
          if (await persist({ ...presets, [name]: { ...source } }, name)) {
            showPresetMessage(i18n.customimagePresetSaved, name);
            resolve(true);
            destroyNameDialog();
          }
        } finally {
          submitting = false;
          controls.forEach(control => { control.disabled = false; });
        }
      };
      confirmButton.addEventListener('click', () => { void submit(); });
    });
  }
  dialog.element.querySelector('#neo-customimage-new-preset')?.addEventListener('click', () => {
    void showNewPreset(buildPresetFromDom(), i18n.customimageNewPresetTitle);
  });
}
