import { Dialog } from 'siyuan';
import { getPlugin } from '../main/context';
import {
  saveConfig,
  type Config,
  type PresetTextureSettingValue,
  type PresetTextureSettings,
  type PresetTextureSettingsMap,
} from '../main/data';
import {
  presetTextures,
  type PresetTextureDefinition,
  type TextureRangeSetting,
  type TextureSettingDefinition,
} from './definitions';
let presetTextureSettings: PresetTextureSettingsMap = {};
const appliedCssVariables = new Set<string>();
function normalizeRangeValue(setting: TextureRangeSetting, value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return setting.defaultValue;
  const clamped = Math.min(setting.max, Math.max(setting.min, parsed));
  const stepped = setting.min + Math.round((clamped - setting.min) / setting.step) * setting.step;
  const decimals = Math.max(0, (String(setting.step).split('.')[1] || '').length);
  return Number(Math.min(setting.max, Math.max(setting.min, stepped)).toFixed(decimals));
}
function normalizeSettingValue(
  setting: TextureSettingDefinition,
  value: unknown,
): PresetTextureSettingValue {
  if (setting.type === 'range') return normalizeRangeValue(setting, value);
  if (typeof value === 'string' && setting.options.some(option => option.value === value)) return value;
  return setting.defaultValue;
}
function getTextureSettingValues(texture: PresetTextureDefinition): PresetTextureSettings {
  const storedValues = presetTextureSettings[texture.key] || {};
  const values: PresetTextureSettings = {};
  for (const setting of texture.settings) {
    values[setting.key] = normalizeSettingValue(setting, storedValues[setting.key]);
  }
  return values;
}
export function loadPresetTextureSettings(config: Config): void {
  const source = config['texture-settings'];
  const nextSettings: PresetTextureSettingsMap = {};
  if (!source || typeof source !== 'object') {
    presetTextureSettings = nextSettings;
    return;
  }
  for (const texture of presetTextures) {
    const sourceValues = source[texture.key];
    if (!sourceValues || typeof sourceValues !== 'object') continue;
    const values: PresetTextureSettings = {};
    for (const setting of texture.settings) {
      if (!Object.prototype.hasOwnProperty.call(sourceValues, setting.key)) continue;
      values[setting.key] = normalizeSettingValue(setting, sourceValues[setting.key]);
    }
    if (Object.keys(values).length > 0) nextSettings[texture.key] = values;
  }
  presetTextureSettings = nextSettings;
}
export function clearAppliedPresetTextureSettings(): void {
  for (const cssVar of appliedCssVariables) {
    document.documentElement.style.removeProperty(cssVar);
  }
  appliedCssVariables.clear();
}
export function applyPresetTextureSettings(texture: PresetTextureDefinition): void {
  clearAppliedPresetTextureSettings();
  const values = getTextureSettingValues(texture);
  for (const setting of texture.settings) {
    const value = values[setting.key];
    for (const binding of setting.css || []) {
      document.documentElement.style.setProperty(binding.cssVar, binding.toCss(value));
      appliedCssVariables.add(binding.cssVar);
    }
  }
}
function getInputId(texture: PresetTextureDefinition, setting: TextureSettingDefinition): string {
  return `neo-preset-texture-${texture.key}-${setting.key}`;
}
function buildSettingHTML(
  texture: PresetTextureDefinition,
  setting: TextureSettingDefinition,
  value: PresetTextureSettingValue,
  i18n: Record<string, string>,
): string {
  const inputId = getInputId(texture, setting);
  let control = '';
  if (setting.type === 'select') {
    const options = setting.options
      .map(option => `<option value="${option.value}">${i18n[option.labelKey]}</option>`)
      .join('');
    control = `<select class="b3-select fn__flex-center fn__size200" id="${inputId}">${options}</select>`;
  } else {
    control = `<div class="b3-tooltips b3-tooltips__n fn__flex-center" id="${inputId}-tooltip" aria-label="${value}${setting.unit}">
      <input class="b3-slider fn__size200" id="${inputId}" min="${setting.min}" max="${setting.max}" step="${setting.step}" type="range" value="${value}">
    </div>`;
  }
  return `<label class="fn__flex b3-label config-item">
    <div class="fn__flex-1 config-item__main">
      <div class="config-name">${i18n[setting.labelKey]}</div>
      <div class="b3-label__text">${i18n[setting.tipKey]}</div>
    </div>
    <span class="fn__space"></span>
    ${control}
  </label>`;
}
function buildSettingsHTML(
  texture: PresetTextureDefinition,
  values: PresetTextureSettings,
  i18n: Record<string, string>,
): string {
  const settingsHTML = texture.settings
    .map(setting => buildSettingHTML(texture, setting, values[setting.key], i18n))
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          ${settingsHTML}
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-preset-texture-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-preset-texture-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showPresetTextureSettings(
  texture: PresetTextureDefinition,
  textureLabel: string,
  onApply: () => void,
): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const values = getTextureSettingValues(texture);
  const dialog = new Dialog({
    title: `${plugin.i18n.presetTextureSettings} · ${textureLabel}`,
    content: buildSettingsHTML(texture, values, plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  for (const setting of texture.settings) {
    const inputId = getInputId(texture, setting);
    const input = dialog.element.querySelector(`#${inputId}`) as HTMLInputElement | HTMLSelectElement | null;
    if (!input) continue;
    input.value = String(values[setting.key]);
    if (setting.type === 'range') {
      const tooltip = dialog.element.querySelector(`#${inputId}-tooltip`) as HTMLElement | null;
      input.addEventListener('input', () => {
        tooltip?.setAttribute('aria-label', `${input.value}${setting.unit}`);
      });
    }
  }
  dialog.element.querySelector('#neo-preset-texture-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-preset-texture-confirm')?.addEventListener('click', () => {
    const nextValues: PresetTextureSettings = {};
    for (const setting of texture.settings) {
      const input = dialog.element.querySelector(`#${getInputId(texture, setting)}`) as HTMLInputElement | HTMLSelectElement | null;
      nextValues[setting.key] = normalizeSettingValue(setting, input?.value);
    }
    presetTextureSettings = {
      ...presetTextureSettings,
      [texture.key]: nextValues,
    };
    saveConfig({
      'texture-settings': Object.fromEntries(
        Object.entries(presetTextureSettings).map(([key, settings]) => [key, { ...settings }]),
      ),
    } as Partial<Config>);
    onApply();
    dialog.destroy();
  });
}
