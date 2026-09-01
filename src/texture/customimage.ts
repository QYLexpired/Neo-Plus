import { Dialog, showMessage } from 'siyuan';
import { getPlugin } from '../main/guard';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { saveConfig, loadConfig, deleteConfigKeys, type Config } from '../main/data';
import { getCurrentThemeMode } from '../modules/thememode';
export type CustomImageConfigKey =
  | 'customimage-info'
  | 'customimage-blur'
  | 'customimage-x'
  | 'customimage-y'
  | 'customimage-opacity'
  | 'customimage-effect'
  | 'customimage-background-blend-mode'
  | 'customimage-brightness'
  | 'customimage-saturation'
  | 'customimage-contrast'
  | 'customimage-grayscale'
  | 'customimage-hue-rotate'
  | 'customimage-zlevel'
  | 'customimage-layout-opacity'
  | 'customimage-fill-mode'
  | 'customimage-fill-width'
  | 'customimage-fill-height'
  | 'customimage-fill-unit'
  | 'customimage-fill-repeat';
export type CustomImageValues = Record<CustomImageConfigKey, string>;
export type CustomImageSource = Partial<Record<CustomImageConfigKey, string | number | boolean | null | undefined>>;
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
const currentPresetKeyLight = 'customimage-preset-current-light';
const currentPresetKeyDark  = 'customimage-preset-current-dark';
type CurrentPresetKey = typeof currentPresetKeyLight | typeof currentPresetKeyDark;
function getPreset(config: Partial<Config> | null | undefined, name: string): CustomImageSource {
  if (!config || !name) return {};
  const raw = (config as Record<string, unknown>)[`customimage-preset-${name}`];
  return (raw && typeof raw === 'object') ? raw as CustomImageSource : {};
}
function getPresetKeyForMode(mode: 'light' | 'dark'): CurrentPresetKey {
  return mode === 'dark' ? currentPresetKeyDark : currentPresetKeyLight;
}
function getCurrentPresetKey(): CurrentPresetKey {
  return getPresetKeyForMode(getCurrentThemeMode());
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
  const tip = sc.tipKey ? `<span class="neo-customimage-detail-tip" data-tip-key="${sc.tipKey}" data-tip-title="${sc.tipTitleKey ?? sc.i18nKey}">${t(i18n, 'customimagePathTipToggle')}</span>` : '';
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
        <div class="config-name">${t(i18n, i18nKey)}<span class="neo-customimage-detail-tip" data-tip-key="${i18nTipKey}" data-tip-title="${tipTitle}">${t(i18n, 'customimagePathTipToggle')}</span></div>
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
      <div class="config-name">${t(i18n, i18nKey)}<span class="neo-customimage-detail-tip" data-tip-key="customimageEffectTip" data-tip-title="customimageEffect">${t(i18n, 'customimagePathTipToggle')}</span></div>
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
      <div class="config-name">${t(i18n, i18nKey)}<span class="neo-customimage-detail-tip" data-tip-key="customimageZLevelTip" data-tip-title="customimageZLevel">${t(i18n, 'customimagePathTipToggle')}</span></div>
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
      <div class="config-name">${t(i18n, i18nKey)}<span class="neo-customimage-detail-tip" data-tip-key="customimageFillModeTip" data-tip-title="customimageFillMode">${t(i18n, 'customimagePathTipToggle')}</span></div>
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
function buildSettingsHTML(i18n: Record<string, string>): string {
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
            <div class="config-name">${t(i18n, 'customimagePresetSelect')}</div>
            <div class="b3-label__text">${t(i18n, 'customimagePresetSelectTip')}</div>
          </div>
          <span class="fn__space"></span>
          <select class="b3-select fn__flex-center fn__size200" id="neo-customimage-preset-select">
          </select>
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
  <button class="b3-button b3-button--cancel" id="neo-customimage-cancel">${t(i18n, 'cancel')}</button>
  <span class="fn__space"></span>
  <button class="b3-button b3-button--remove" id="neo-customimage-delete-preset">${t(i18n, 'customimageDeletePreset')}</button>
  <span class="fn__space"></span>
  <button class="b3-button" id="neo-customimage-new-preset">${t(i18n, 'customimageNewPreset')}</button>
  <span class="fn__space"></span>
  <button class="b3-button b3-button--text" id="neo-customimage-update-preset">${t(i18n, 'customimageUpdateApply')}</button>
</div>`;
}
export function showCustomImageSettings(restoreTexture: () => Promise<void>): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: `<div class="fn__flex">
    <div class="fn__ellipsis" style="white-space: nowrap">${plugin.i18n.customimageSettings}</div>
    <div class="fn__space"></div>
    <button class="b3-button b3-button--small fn__flex-center" id="neo-customimage-reset-preset">${plugin.i18n.customimageResetPreset}</button>
  </div>`,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const presetSelect = dialog.element.querySelector('#neo-customimage-preset-select') as HTMLSelectElement | null;
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
    if (updatePreview && neoFeatureActive) applyCustomImageCss(values);
    return values;
  };
  const initializationControls = new Set<CustomImageInput | HTMLButtonElement>();
  if (presetSelect) initializationControls.add(presetSelect);
  for (const { input } of fieldDom) {
    if (input) initializationControls.add(input);
  }
  for (const id of ['#neo-customimage-reset-preset', '#neo-customimage-delete-preset', '#neo-customimage-new-preset', '#neo-customimage-update-preset']) {
    const button = btn(id);
    if (button) initializationControls.add(button);
  }
  initializationControls.forEach(control => { control.disabled = true; });
  loadConfig().then(c => {
    if (!dialog.element.isConnected) return;
    populateDialog(c, presetSelect, fieldDom, customFillWrap, layoutOpacityWrap);
  }).catch(() => {}).finally(() => {
    if (!dialog.element.isConnected) return;
    initializationControls.forEach(control => { control.disabled = false; });
  });
  let dirty = false;
  const applyCssFromDom = (): void => {
    if (!neoFeatureActive) return;
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
        title: titleKey ? t(plugin.i18n, titleKey) : '',
        content: `<div class="b3-dialog__content"><div class="b3-label__text">${t(plugin.i18n, tipKey)}</div></div>`,
      });
    });
  });
  const originalDestroy = dialog.destroy.bind(dialog);
  const doDestroy = (): void => { originalDestroy(); };
  const performDestroyWithRestore = async (): Promise<void> => {
    try {
      await restoreTexture();
    } catch {}
    doDestroy();
  };
  dialog.destroy = (): void => {
    if (!dirty) {
      performDestroyWithRestore();
      return;
    }
    const cd = new Dialog({
      title: plugin.i18n.customimageUnsavedTitle,
      content: `<div class="b3-dialog__content">${plugin.i18n.customimageUnsavedContent}</div><div class="b3-dialog__action"><button class="b3-button b3-button--cancel" id="ncu-back">${plugin.i18n.customimageUnsavedBack}</button><span class="fn__space"></span><button class="b3-button b3-button--remove" id="ncu-exit">${plugin.i18n.customimageUnsavedExit}</button></div>`,
    });
    cd.element.classList.add('neo-settings-dialog');
    cd.element.querySelector('#ncu-back')?.addEventListener('click', () => cd.destroy());
    cd.element.querySelector('#ncu-exit')?.addEventListener('click', () => {
      dirty = false;
      cd.destroy();
      performDestroyWithRestore();
    });
  };
  btn('#neo-customimage-cancel')?.addEventListener('click', () => dialog.destroy());
  btn('#neo-customimage-delete-preset')?.addEventListener('click', async () => {
    if (!presetSelect) return;
    const name = presetSelect.value;
    if (!name) { showMessage(plugin.i18n.customimagePresetNotSelected, 3000); return; }
    const cd = new Dialog({
      title: plugin.i18n.customimagePresetDeleteConfirmTitle,
      content: `<div class="b3-dialog__content">${plugin.i18n.customimagePresetDeleteConfirmContent.replace('${name}', name)}</div><div class="b3-dialog__action"><button class="b3-button b3-button--cancel" id="ndc-cancel">${plugin.i18n.cancel}</button><span class="fn__space"></span><button class="b3-button b3-button--remove" id="ndc-confirm">${plugin.i18n.customimageDelete}</button></div>`,
    });
    cd.element.classList.add('neo-settings-dialog');
    cd.element.querySelector('#ndc-cancel')?.addEventListener('click', () => cd.destroy());
    cd.element.querySelector('#ndc-confirm')?.addEventListener('click', async () => {
      const isCurrent = createNeoLifecycleGuard();
      const currentKey = getCurrentPresetKey();
      try {
        await saveConfig({ [currentKey]: '' } as Partial<Config>);
        await deleteConfigKeys([`customimage-preset-${name}`]);
        const updatedCfg = await loadConfig();
        if (presetSelect) {
          Array.from(presetSelect.options).find(o => o.value === name)?.remove();
          presetSelect.value = '';
        }
        const otherKey = currentKey === currentPresetKeyLight ? currentPresetKeyDark : currentPresetKeyLight;
        const patch: Record<string, any> = {};
        if ((updatedCfg as Record<string, any>)?.[otherKey] === name) patch[otherKey] = '';
        if (Object.keys(patch).length) await saveConfig(patch as Partial<Config>);
        const values = populateDialog(updatedCfg, presetSelect, fieldDom, customFillWrap, layoutOpacityWrap);
        if (isCurrent() && neoFeatureActive) applyCustomImageCss(values);
        showMessage(plugin.i18n.customimagePresetDeleted.replace('${name}', name), 3000);
      } catch {} finally { cd.destroy(); }
    });
  });
  const savePresetToConfig = async (preset: Partial<CustomImageValues>, presetName: string): Promise<void> => {
    const isCurrent = createNeoLifecycleGuard();
    const currentKey = getCurrentPresetKey();
    const patch: Record<string, any> = {
      [`customimage-preset-${presetName}`]: preset,
      [currentKey]: presetName,
    };
    await saveConfig(patch as Partial<Config>);
    if (isCurrent() && neoFeatureActive) {
      applyCustomImageCss(preset);
    }
  };
  btn('#neo-customimage-update-preset')?.addEventListener('click', async () => {
    if (!presetSelect) return;
    const name = presetSelect.value;
    if (!name) { showMessage(plugin.i18n.customimagePresetNotSelected, 3000); return; }
    const preset = buildPresetFromDom();
    await savePresetToConfig(preset, name);
    dirty = false;
    showMessage(plugin.i18n.customimagePresetUpdated.replace('${name}', name), 3000);
    dialog.destroy();
  });
  const askPresetName = (title: string, onConfirm: (name: string) => Promise<boolean>): void => {
    const pd = new Dialog({
      title,
      content: `<div class="b3-dialog__content"><div class="fn__flex b3-label config-item"><div class="fn__flex-1 config-item__main"><div class="config-name">${plugin.i18n.customimagePresetName}</div><div class="b3-label__text">${plugin.i18n.customimagePresetNameTip}</div></div><span class="fn__space"></span><input class="b3-text-field fn__flex-center fn__size200" id="neo-customimage-preset-name" spellcheck="false"></div></div><div class="b3-dialog__action"><button class="b3-button b3-button--cancel" id="npc-cancel">${plugin.i18n.cancel}</button><span class="fn__space"></span><button class="b3-button b3-button--text" id="npc-confirm">${plugin.i18n.confirm}</button></div>`,
    });
    pd.element.classList.add('neo-settings-dialog');
    pd.element.querySelector('#npc-cancel')?.addEventListener('click', () => pd.destroy());
    pd.element.querySelector('#npc-confirm')?.addEventListener('click', async () => {
      const name = (pd.element.querySelector('#neo-customimage-preset-name') as HTMLInputElement)?.value?.trim();
      if (!name) { showMessage(plugin.i18n.customimagePresetNameEmpty, 3000); return; }
      if (['current', 'current-light', 'current-dark'].includes(name.toLowerCase())) {
        showMessage(plugin.i18n.customimagePresetNameReserved, 3000);
        return;
      }
      const saved = await onConfirm(name);
      if (saved) pd.destroy();
    });
  };
  const savePresetAs = async (name: string): Promise<boolean> => {
    const cfg = await loadConfig();
    const exists = (cfg as Record<string, any>)[`customimage-preset-${name}`] !== undefined;
    if (exists) {
      const confirmed = await new Promise<boolean>(resolve => {
        const cd = new Dialog({
          title: plugin.i18n.customimagePresetOverwriteTitle,
          content: `<div class="b3-dialog__content">${plugin.i18n.customimagePresetOverwriteContent.replace('${name}', name)}</div><div class="b3-dialog__action"><button class="b3-button b3-button--cancel" id="npo-cancel">${plugin.i18n.cancel}</button><span class="fn__space"></span><button class="b3-button b3-button--text" id="npo-confirm">${plugin.i18n.confirm}</button></div>`,
        });
        cd.element.classList.add('neo-settings-dialog');
        const resolveFalse = () => resolve(false);
        const origDestroy = cd.destroy.bind(cd);
        cd.destroy = () => { resolveFalse(); origDestroy(); };
        cd.element.querySelector('#npo-cancel')?.addEventListener('click', () => cd.destroy());
        cd.element.querySelector('#npo-confirm')?.addEventListener('click', async () => {
          resolve(true);
          cd.destroy();
        });
      });
      if (!confirmed) return false;
    }
    const preset = buildPresetFromDom();
    await savePresetToConfig(preset, name);
    setFormValues(preset);
    dirty = false;
    showMessage(plugin.i18n.customimagePresetSaved.replace('${name}', name), 3000);
    if (presetSelect && !Array.from(presetSelect.options).some(o => o.value === name)) {
      const opt = document.createElement('option'); opt.value = name; opt.textContent = name;
      presetSelect.appendChild(opt); presetSelect.value = name;
    }
    return true;
  };
  btn('#neo-customimage-new-preset')?.addEventListener('click', () => {
    askPresetName(plugin.i18n.customimageNewPresetTitle, savePresetAs);
  });
  presetSelect?.addEventListener('change', async () => {
    const name = presetSelect.value;
    if (!name) return;
    const switchPreset = async (): Promise<void> => {
      const isCurrent = createNeoLifecycleGuard();
      try {
        const currentKey = getCurrentPresetKey();
        const patch: Record<string, any> = { [currentKey]: name };
        await saveConfig(patch as Partial<Config>);
        const updatedCfg = await loadConfig();
        const values = populateDialog(updatedCfg, presetSelect, fieldDom, customFillWrap, layoutOpacityWrap);
        if (isCurrent() && neoFeatureActive) {
          applyCustomImageCss(values);
        }
      } catch {}
    };
    if (!dirty) {
      await switchPreset();
      return;
    }
    const sd = new Dialog({
      title: plugin.i18n.customimagePresetSwitchTitle,
      content: `<div class="b3-dialog__content">${plugin.i18n.customimagePresetSwitchContent}</div><div class="b3-dialog__action"><button class="b3-button b3-button--cancel" id="nps-cancel">${plugin.i18n.customimagePresetSwitchCancel}</button><span class="fn__space"></span><button class="b3-button b3-button--remove" id="nps-confirm">${plugin.i18n.customimagePresetSwitchConfirm}</button></div>`,
    });
    sd.element.classList.add('neo-settings-dialog');
    const restorePresetSelect = (): void => {
      if (presetSelect) presetSelect.value = presetSelect.dataset.previousValue || '';
    };
    const origSdDestroy = sd.destroy.bind(sd);
    sd.destroy = (): void => {
      restorePresetSelect();
      origSdDestroy();
    };
    sd.element.querySelector('#nps-cancel')?.addEventListener('click', () => {
      restorePresetSelect();
      sd.destroy();
    });
    sd.element.querySelector('#nps-confirm')?.addEventListener('click', async () => {
      dirty = false;
      origSdDestroy();
      await switchPreset();
    });
  });
}
function populateDialog(
  config: Partial<Config> | null,
  presetSelect: HTMLSelectElement | null,
  fieldDom: CustomImageFieldDom[],
  customWrap: HTMLElement | null,
  layoutOpacityWrap: HTMLElement | null,
): CustomImageValues {
  const currentKey = getCurrentPresetKey();
  const cpk = (config?.[currentKey] as string) || '';
  if (presetSelect) {
    presetSelect.innerHTML = '';
    if (config) Object.keys(config as Record<string, any>).forEach(k => {
      if (!k.startsWith('customimage-preset-') || k === currentPresetKeyLight || k === currentPresetKeyDark) return;
      const n = k.replace('customimage-preset-', '');
      if (n) {
        const o = document.createElement('option'); o.value = n; o.textContent = n;
        presetSelect.appendChild(o);
      }
    });
  }
  const presetAvailable = !!cpk && presetSelect !== null && Array.from(presetSelect.options).some(o => o.value === cpk);
  if (presetSelect) {
    if (presetAvailable) {
      presetSelect.value = cpk;
      presetSelect.dataset.previousValue = cpk;
    } else {
      presetSelect.selectedIndex = -1;
      delete presetSelect.dataset.previousValue;
    }
  }
  const values = writeFieldDomValues(fieldDom, presetAvailable ? getPreset(config, cpk) : undefined);
  syncConditionalVisibility(values, customWrap, layoutOpacityWrap);
  return values;
}
