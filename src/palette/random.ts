import { saveConfig, loadConfig, type Config } from '../main/data';
import { Dialog } from '../modules/dialog';
import { getPlugin } from '../main/context';
import { isMobile } from '../modules/env';
import { withViewTransition } from '../modules/viewtransition';
import { getThemeMode, getPresetsByMode } from './presets';
import { paletteLibrary } from './library';
import type { Preset, ThemeMode } from './presets';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { enableInvert, destroyInvert } from './invert';
import { enableHighContrast, destroyHighContrast } from './highcontrast';
import { getFreePresetColors, applyFreeColors, clearFreeColors, setFreePresetAttr } from './free';
type RandomPool = 'preset' | 'free' | 'custom' | 'library';
const randomPools: RandomPool[] = ['preset', 'free', 'custom', 'library'];
let randomScope: RandomPool[] = [...randomPools];
let randomHighContrast: 'random' | 'on' | 'off' = 'random';
let randomInvert: 'random' | 'on' | 'off' = 'random';
let randomSaturationMin: number = 0;
let randomSaturationMax: number = 5;
let randomBrightnessMin: number = -1;
let randomBrightnessMax: number = 1;
let neoFeatureActive = false;
function clampSaturation(value: number): number {
  return Math.min(5, Math.max(0, value));
}
function clampBrightness(value: number): number {
  return Math.min(1, Math.max(-1, value));
}
function normalizeRandomScope(value: Config['random-scope']): RandomPool[] {
  const selected = Array.isArray(value) ? value : [];
  const pools = randomPools.filter(pool => selected.includes(pool));
  return pools.length > 0 ? pools : [...randomPools];
}
function normalizeRandomTristate(value: Config['random-highcontrast']): 'random' | 'on' | 'off' {
  return value === 'on' || value === 'off' ? value : 'random';
}
function readConfigRange(config: Config): { min: number; max: number } {
  const rawMin = config['random-saturation-min'];
  const rawMax = config['random-saturation-max'];
  const min = typeof rawMin === 'number' && !Number.isNaN(rawMin) ? clampSaturation(rawMin) : 0;
  const max = typeof rawMax === 'number' && !Number.isNaN(rawMax) ? clampSaturation(rawMax) : 5;
  return min <= max ? { min, max } : { min: max, max: min };
}
function readConfigBrightnessRange(config: Config): { min: number; max: number } {
  const rawMin = config['random-brightness-min'];
  const rawMax = config['random-brightness-max'];
  const min = typeof rawMin === 'number' && !Number.isNaN(rawMin) ? clampBrightness(rawMin) : -1;
  const max = typeof rawMax === 'number' && !Number.isNaN(rawMax) ? clampBrightness(rawMax) : 1;
  return min <= max ? { min, max } : { min: max, max: min };
}
interface LastRandomState {
  type: RandomPool;
  presetKey?: string;
  freeName?: string;
  color?: string;
  saturation?: number;
  brightness?: number;
  inverted?: boolean;
  highContrast?: boolean;
}
let lastState: LastRandomState | null = null;
let lastMode: ThemeMode | null = null;
function randomHexColor(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
function randomHexColorDifferentFrom(previous: string): string {
  let color: string;
  let attempts = 0;
  do {
    color = randomHexColor();
    attempts++;
  } while (color === previous && attempts < 20);
  return color;
}
function randomSaturation(): number {
  return Math.round((randomSaturationMin + Math.random() * (randomSaturationMax - randomSaturationMin)) * 100) / 100;
}
function randomSaturationDifferentFrom(previous: number): number {
  if (randomSaturationMin >= randomSaturationMax) {
    return randomSaturationMin;
  }
  let saturation: number;
  let attempts = 0;
  do {
    saturation = randomSaturation();
    attempts++;
  } while (saturation === previous && attempts < 20);
  return saturation;
}
function randomBrightness(): number {
  return Math.round((randomBrightnessMin + Math.random() * (randomBrightnessMax - randomBrightnessMin)) * 100) / 100;
}
function randomBrightnessDifferentFrom(previous: number): number {
  if (randomBrightnessMin >= randomBrightnessMax) {
    return randomBrightnessMin;
  }
  let brightness: number;
  let attempts = 0;
  do {
    brightness = randomBrightness();
    attempts++;
  } while (brightness === previous && attempts < 20);
  return brightness;
}
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomPickDifferentPreset(arr: Preset[], previousKey: string): Preset {
  const filtered = arr.filter(p => p.key !== previousKey);
  if (filtered.length === 0) return randomPick(arr);
  return randomPick(filtered);
}
function pickHighContrast(sameAsLast: boolean): boolean {
  if (isMobile() || getThemeMode() !== 'light') return false;
  const highContrast = randomHighContrast === 'on' || (randomHighContrast === 'random' && Math.random() < 0.15);
  if (randomHighContrast === 'random' && sameAsLast && highContrast === lastState?.highContrast) {
    return !highContrast;
  }
  return highContrast;
}
function pickInvert(sameAsLast: boolean): boolean {
  if (getThemeMode() !== 'dark') return false;
  const inverted = randomInvert === 'on' || (randomInvert === 'random' && Math.random() < 0.5);
  if (randomInvert === 'random' && sameAsLast && inverted === lastState?.inverted) {
    return !inverted;
  }
  return inverted;
}
function pickRandomEffects(sameAsLast: boolean): { inverted: boolean; highContrast: boolean } {
  const inverted = pickInvert(sameAsLast);
  const highContrast = pickHighContrast(sameAsLast);
  if (inverted) enableInvert();
  if (highContrast) enableHighContrast();
  return { inverted, highContrast };
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const scopeSwitches = randomPools.map(pool => `
          <label style="display:inline-flex;align-items:center;gap:8px;white-space:nowrap;cursor:pointer">
            <span>${i18n[`randomScope${pool.charAt(0).toUpperCase() + pool.slice(1)}`]}</span>
            <input class="b3-switch" id="neo-random-scope-${pool}" type="checkbox">
          </label>`).join('');
  const highContrastOptions = ['random', 'on', 'off']
    .map(v => `<option value="${v}">${i18n[`randomHighContrast${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  const invertOptions = ['random', 'on', 'off']
    .map(v => `<option value="${v}">${i18n[`randomInvert${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <div class="b3-label config-item" style="display:flex;flex-direction:column;align-items:stretch;gap:12px">
            <div class="config-item__main">
              <div class="config-name">${i18n.randomScope}</div>
              <div class="b3-label__text">${i18n.randomScopeTip}</div>
            </div>
            <div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px 20px" role="group" aria-label="${i18n.randomScope}">
              ${scopeSwitches}
            </div>
          </div>
          <div class="b3-label config-item" style="display:flex;flex-direction:column;align-items:stretch;gap:12px">
            <div class="config-item__main">
              <div class="config-name" id="neo-random-saturation-title">${i18n.saturation}</div>
              <div class="b3-label__text">${i18n.randomSaturationRangeTip}</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px" role="group" aria-labelledby="neo-random-saturation-title">
              <label style="display:flex;align-items:center;gap:8px;min-width:0;cursor:pointer">
                <span style="white-space:nowrap">${i18n.randomRangeMin}</span>
                <div class="b3-tooltips b3-tooltips__n" style="flex:1;min-width:0" id="neo-random-saturation-min-tooltip" aria-label="${randomSaturationMin}">
                  <input class="b3-slider" style="width:100%;min-width:0" id="neo-random-saturation-min" min="0" max="5" step="0.01" type="range" value="${randomSaturationMin}">
                </div>
              </label>
              <label style="display:flex;align-items:center;gap:8px;min-width:0;cursor:pointer">
                <span style="white-space:nowrap">${i18n.randomRangeMax}</span>
                <div class="b3-tooltips b3-tooltips__n" style="flex:1;min-width:0" id="neo-random-saturation-max-tooltip" aria-label="${randomSaturationMax}">
                  <input class="b3-slider" style="width:100%;min-width:0" id="neo-random-saturation-max" min="0" max="5" step="0.01" type="range" value="${randomSaturationMax}">
                </div>
              </label>
            </div>
          </div>
          <div class="b3-label config-item" style="display:flex;flex-direction:column;align-items:stretch;gap:12px">
            <div class="config-item__main">
              <div class="config-name" id="neo-random-brightness-title">${i18n.brightness}</div>
              <div class="b3-label__text">${i18n.randomBrightnessRangeTip}</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px" role="group" aria-labelledby="neo-random-brightness-title">
              <label style="display:flex;align-items:center;gap:8px;min-width:0;cursor:pointer">
                <span style="white-space:nowrap">${i18n.randomRangeMin}</span>
                <div class="b3-tooltips b3-tooltips__n" style="flex:1;min-width:0" id="neo-random-brightness-min-tooltip" aria-label="${randomBrightnessMin}">
                  <input class="b3-slider" style="width:100%;min-width:0" id="neo-random-brightness-min" min="-1" max="1" step="0.01" type="range" value="${randomBrightnessMin}">
                </div>
              </label>
              <label style="display:flex;align-items:center;gap:8px;min-width:0;cursor:pointer">
                <span style="white-space:nowrap">${i18n.randomRangeMax}</span>
                <div class="b3-tooltips b3-tooltips__n" style="flex:1;min-width:0" id="neo-random-brightness-max-tooltip" aria-label="${randomBrightnessMax}">
                  <input class="b3-slider" style="width:100%;min-width:0" id="neo-random-brightness-max" min="-1" max="1" step="0.01" type="range" value="${randomBrightnessMax}">
                </div>
              </label>
            </div>
          </div>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.randomHighContrast}</div>
              <div class="b3-label__text">${i18n.randomHighContrastTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-random-highcontrast">
              ${highContrastOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.randomInvert}</div>
              <div class="b3-label__text">${i18n.randomInvertTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-random-invert">
              ${invertOptions}
            </select>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-random-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-random-confirm">${i18n.confirm}</button>
  </div>`;
}
function showCurrentStateDialog(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const i18n = plugin.i18n;
  const mode = getThemeMode();
  const swatch = (color: string): string =>
    `<span style="display:inline-block;width:13px;height:13px;border-radius:50%;background-color:${color};outline:0.5px solid var(--b3-border-color-trans);outline-offset:-0.5px;vertical-align:-1px"></span>`;
  const lines: string[] = [];
  if (!lastState) {
    lines.push(i18n.randomNoState);
  } else {
    if (lastState.type === 'preset' && lastState.presetKey) {
      const nameKey = `colorScheme${lastState.presetKey.charAt(0).toUpperCase()}${lastState.presetKey.slice(1)}`;
      lines.push(`${i18n.colorScheme}：${i18n[nameKey] ?? lastState.presetKey}`);
    } else if ((lastState.type === 'free' || lastState.type === 'library') && lastState.presetKey) {
      const label = lastState.type === 'library' ? i18n.freeLibrary : i18n.freePalette;
      lines.push(`${label}：${(lastState.freeName ?? lastState.presetKey).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`);
    } else if (lastState.type === 'custom') {
      lines.push(`${i18n.customThemeColor}：${swatch(lastState.color ?? '')} ${lastState.color}`);
      if (lastState.saturation !== undefined) {
        lines.push(`${i18n.saturation}：${lastState.saturation}`);
      }
      if (lastState.brightness !== undefined) {
        lines.push(`${i18n.brightness}：${lastState.brightness}`);
      }
    }
    if (lastState.highContrast) {
      lines.push(`${i18n.highContrast}：${i18n.on}`);
    } else if (randomHighContrast === 'on' && isMobile()) {
      lines.push(`${i18n.highContrast}：${i18n.randomHighContrastMobileOff}`);
    } else if (mode === 'dark') {
      lines.push(`${i18n.highContrast}：${i18n.randomHighContrastDarkOff}`);
    } else {
      lines.push(`${i18n.highContrast}：${i18n.off}`);
    }
    if (lastState.inverted) {
      lines.push(`${i18n.invertColor}：${i18n.on}`);
    } else if (mode === 'light') {
      lines.push(`${i18n.invertColor}：${i18n.randomInvertLightOff}`);
    } else {
      lines.push(`${i18n.invertColor}：${i18n.off}`);
    }
  }
  new Dialog({
    title: `<div class="fn__flex">
    <div class="fn__ellipsis" style="white-space: nowrap">${i18n.randomCurrentState}</div>
  </div>`,
    content: `<div class="b3-dialog__content"><div class="b3-label__text">${lines.join('<br>')}</div></div>`,
  });
}
export function showRandomSettings(): void {
  const isCurrent = createNeoLifecycleGuard();
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: `<div class="fn__flex">
    <div class="fn__ellipsis" style="white-space: nowrap">${plugin.i18n.randomSettings}</div>
    <div class="fn__space"></div>
    <button class="b3-button b3-button--small fn__flex-center" id="neo-random-reset-default">${plugin.i18n.randomResetDefault}</button>
    <span class="fn__space" style="width:8px"></span>
    <button class="b3-button b3-button--small fn__flex-center" id="neo-random-view-current">${plugin.i18n.randomViewCurrent}</button>
  </div>`,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  dialog.element.querySelector('#neo-random-view-current')?.addEventListener('click', showCurrentStateDialog);
  const scopeSwitches = randomPools.map(pool => ({
    pool,
    input: dialog.element.querySelector(`#neo-random-scope-${pool}`) as HTMLInputElement,
  }));
  const updateScopeSwitches = (): void => {
    const selected = scopeSwitches.filter(({ input }) => input.checked);
    for (const { input } of scopeSwitches) {
      input.disabled = selected.length === 1 && input.checked;
    }
  };
  for (const { pool, input } of scopeSwitches) {
    input.checked = randomScope.includes(pool);
    input.addEventListener('change', () => {
      if (!scopeSwitches.some(({ input }) => input.checked)) input.checked = true;
      updateScopeSwitches();
    });
  }
  updateScopeSwitches();
  const highContrastSelect = dialog.element.querySelector('#neo-random-highcontrast') as HTMLSelectElement;
  if (highContrastSelect) highContrastSelect.value = randomHighContrast;
  const invertSelect = dialog.element.querySelector('#neo-random-invert') as HTMLSelectElement;
  if (invertSelect) invertSelect.value = randomInvert;
  const saturationMinSlider = dialog.element.querySelector('#neo-random-saturation-min') as HTMLInputElement;
  const saturationMinTooltip = dialog.element.querySelector('#neo-random-saturation-min-tooltip') as HTMLElement;
  const saturationMaxSlider = dialog.element.querySelector('#neo-random-saturation-max') as HTMLInputElement;
  const saturationMaxTooltip = dialog.element.querySelector('#neo-random-saturation-max-tooltip') as HTMLElement;
  if (saturationMinSlider) {
    saturationMinSlider.value = String(randomSaturationMin);
    saturationMinSlider.addEventListener('input', () => {
      if (saturationMinTooltip) saturationMinTooltip.setAttribute('aria-label', saturationMinSlider.value);
      if (saturationMaxSlider && parseFloat(saturationMinSlider.value) > parseFloat(saturationMaxSlider.value)) {
        saturationMaxSlider.value = saturationMinSlider.value;
        if (saturationMaxTooltip) saturationMaxTooltip.setAttribute('aria-label', saturationMaxSlider.value);
      }
    });
  }
  if (saturationMaxSlider) {
    saturationMaxSlider.value = String(randomSaturationMax);
    saturationMaxSlider.addEventListener('input', () => {
      if (saturationMaxTooltip) saturationMaxTooltip.setAttribute('aria-label', saturationMaxSlider.value);
      if (saturationMinSlider && parseFloat(saturationMaxSlider.value) < parseFloat(saturationMinSlider.value)) {
        saturationMinSlider.value = saturationMaxSlider.value;
        if (saturationMinTooltip) saturationMinTooltip.setAttribute('aria-label', saturationMinSlider.value);
      }
    });
  }
  const brightnessMinSlider = dialog.element.querySelector('#neo-random-brightness-min') as HTMLInputElement;
  const brightnessMinTooltip = dialog.element.querySelector('#neo-random-brightness-min-tooltip') as HTMLElement;
  const brightnessMaxSlider = dialog.element.querySelector('#neo-random-brightness-max') as HTMLInputElement;
  const brightnessMaxTooltip = dialog.element.querySelector('#neo-random-brightness-max-tooltip') as HTMLElement;
  if (brightnessMinSlider) {
    brightnessMinSlider.value = String(randomBrightnessMin);
    brightnessMinSlider.addEventListener('input', () => {
      if (brightnessMinTooltip) brightnessMinTooltip.setAttribute('aria-label', brightnessMinSlider.value);
      if (brightnessMaxSlider && parseFloat(brightnessMinSlider.value) > parseFloat(brightnessMaxSlider.value)) {
        brightnessMaxSlider.value = brightnessMinSlider.value;
        if (brightnessMaxTooltip) brightnessMaxTooltip.setAttribute('aria-label', brightnessMaxSlider.value);
      }
    });
  }
  if (brightnessMaxSlider) {
    brightnessMaxSlider.value = String(randomBrightnessMax);
    brightnessMaxSlider.addEventListener('input', () => {
      if (brightnessMaxTooltip) brightnessMaxTooltip.setAttribute('aria-label', brightnessMaxSlider.value);
      if (brightnessMinSlider && parseFloat(brightnessMaxSlider.value) < parseFloat(brightnessMinSlider.value)) {
        brightnessMinSlider.value = brightnessMaxSlider.value;
        if (brightnessMinTooltip) brightnessMinTooltip.setAttribute('aria-label', brightnessMinSlider.value);
      }
    });
  }
  dialog.element.querySelector('#neo-random-reset-default')?.addEventListener('click', () => {
    for (const { input } of scopeSwitches) input.checked = true;
    updateScopeSwitches();
    if (highContrastSelect) highContrastSelect.value = 'random';
    if (invertSelect) invertSelect.value = 'random';
    if (saturationMinSlider) {
      saturationMinSlider.value = '0';
      if (saturationMinTooltip) saturationMinTooltip.setAttribute('aria-label', '0');
    }
    if (saturationMaxSlider) {
      saturationMaxSlider.value = '5';
      if (saturationMaxTooltip) saturationMaxTooltip.setAttribute('aria-label', '5');
    }
    if (brightnessMinSlider) {
      brightnessMinSlider.value = '-1';
      if (brightnessMinTooltip) brightnessMinTooltip.setAttribute('aria-label', '-1');
    }
    if (brightnessMaxSlider) {
      brightnessMaxSlider.value = '1';
      if (brightnessMaxTooltip) brightnessMaxTooltip.setAttribute('aria-label', '1');
    }
  });
  dialog.element.querySelector('#neo-random-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-random-confirm')?.addEventListener('click', () => {
    if (!isCurrent()) {
      dialog.destroy();
      return;
    }
    const newScope = normalizeRandomScope(scopeSwitches.filter(({ input }) => input.checked).map(({ pool }) => pool));
    randomScope = newScope;
    saveConfig({ 'random-scope': newScope });
    if (highContrastSelect) {
      const newHighContrast = highContrastSelect.value as 'random' | 'on' | 'off';
      if (newHighContrast !== randomHighContrast) {
        randomHighContrast = newHighContrast;
        saveConfig({ 'random-highcontrast': newHighContrast } as Partial<Config>);
      }
    }
    if (invertSelect) {
      const newInvert = invertSelect.value as 'random' | 'on' | 'off';
      if (newInvert !== randomInvert) {
        randomInvert = newInvert;
        saveConfig({ 'random-invert': newInvert } as Partial<Config>);
      }
    }
    if (saturationMinSlider && saturationMaxSlider) {
      const newMin = clampSaturation(parseFloat(saturationMinSlider.value) || 0);
      const newMax = clampSaturation(parseFloat(saturationMaxSlider.value) || 0);
      if (newMin !== randomSaturationMin || newMax !== randomSaturationMax) {
        randomSaturationMin = Math.min(newMin, newMax);
        randomSaturationMax = Math.max(newMin, newMax);
        saveConfig({
          'random-saturation-min': randomSaturationMin,
          'random-saturation-max': randomSaturationMax,
        } as Partial<Config>);
      }
    }
    if (brightnessMinSlider && brightnessMaxSlider) {
      const newMin = clampBrightness(parseFloat(brightnessMinSlider.value) || 0);
      const newMax = clampBrightness(parseFloat(brightnessMaxSlider.value) || 0);
      if (newMin !== randomBrightnessMin || newMax !== randomBrightnessMax) {
        randomBrightnessMin = Math.min(newMin, newMax);
        randomBrightnessMax = Math.max(newMin, newMax);
        saveConfig({
          'random-brightness-min': randomBrightnessMin,
          'random-brightness-max': randomBrightnessMax,
        } as Partial<Config>);
      }
    }
    dialog.destroy();
    loadConfig().then((config) => {
      if (!isCurrent()) return;
      if (neoFeatureActive) {
        withViewTransition(() => {
          if (!isCurrent() || !neoFeatureActive) return;
          applyRandom(config);
        });
      }
    });
  });
}
export function initRandomSettings(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    randomScope = normalizeRandomScope(config['random-scope']);
    randomHighContrast = normalizeRandomTristate(config['random-highcontrast']);
    randomInvert = normalizeRandomTristate(config['random-invert']);
    const saturationRange = readConfigRange(config);
    randomSaturationMin = saturationRange.min;
    randomSaturationMax = saturationRange.max;
    const brightnessRange = readConfigBrightnessRange(config);
    randomBrightnessMin = brightnessRange.min;
    randomBrightnessMax = brightnessRange.max;
  });
}
export function destroyRandom(): void {
  neoFeatureActive = false;
  const html = document.documentElement;
  html.style.removeProperty('--neo-custom-base-color');
  html.style.removeProperty('--neo-saturation');
  html.style.removeProperty('--neo-brightness');
  clearFreeColors();
  setFreePresetAttr('');
  html.classList.remove('neo-palette-free');
  destroyInvert();
  destroyHighContrast();
  lastState = null;
  lastMode = null;
}
function pickRandomPool(config: Config, mode: ThemeMode): RandomPool | 'default' {
  const candidates = randomScope.filter(pool => {
    if (pool === 'free') return Object.keys(config[`free-presets-${mode}`] ?? {}).length > 0;
    if (pool === 'library') return paletteLibrary[mode].length > 0;
    if (pool === 'preset') return getPresetsByMode(mode).length > 0;
    return true;
  });
  return candidates.length > 0 ? randomPick(candidates) : 'default';
}
function applyDefaultRandom(): void {
  document.documentElement.classList.add('neo-palette-default');
  lastState = { type: 'preset', presetKey: 'default', inverted: false, highContrast: false };
}
function applyPresetRandom(config: Config, mode: ThemeMode): void {
  const html = document.documentElement;
  const available = getPresetsByMode(mode);
  if (available.length === 0) {
    applyDefaultRandom();
    return;
  }
  const preset = lastState?.type === 'preset' && lastState.presetKey
    ? randomPickDifferentPreset(available, lastState.presetKey)
    : randomPick(available);
  html.classList.add(`neo-palette-${preset.key}`);
  const sameAsLast = lastState?.type === 'preset' && lastState.presetKey === preset.key;
  const { inverted: finalInverted, highContrast: finalHighContrast } = pickRandomEffects(sameAsLast);
  lastState = { type: 'preset', presetKey: preset.key, inverted: finalInverted, highContrast: finalHighContrast };
}
function applyFreeRandom(config: Config, mode: ThemeMode, pool: 'free' | 'library'): void {
  const candidates = pool === 'library'
    ? paletteLibrary[mode].map(item => item.key)
    : Object.keys(config[`free-presets-${mode}`] ?? {});
  if (candidates.length === 0) {
    applyDefaultRandom();
    return;
  }
  const rest = lastState?.type === pool
    ? candidates.filter(key => key !== lastState?.presetKey)
    : candidates;
  const selected = randomPick(rest.length > 0 ? rest : candidates);
  const libraryItem = pool === 'library'
    ? paletteLibrary[mode].find(item => item.key === selected)
    : undefined;
  const colors = pool === 'library'
    ? libraryItem?.colors
    : getFreePresetColors(config, mode, selected);
  if (!colors) {
    applyDefaultRandom();
    return;
  }
  const name = libraryItem
    ? (getPlugin()?.i18n[libraryItem.nameKey] ?? libraryItem.key)
    : selected;
  const sameAsLast = lastState?.type === pool && lastState.presetKey === selected;
  const { inverted: finalInverted, highContrast: finalHighContrast } = pickRandomEffects(sameAsLast);
  if (finalInverted) {
    applyFreeColors({ ...colors, background: colors.surface, surface: colors.background });
  } else {
    applyFreeColors(colors);
  }
  document.documentElement.classList.add('neo-palette-free');
  setFreePresetAttr(name);
  lastState = { type: pool, presetKey: selected, freeName: name, inverted: finalInverted, highContrast: finalHighContrast };
}
function applyCustomRandom(config: Config, mode: ThemeMode): void {
  const html = document.documentElement;
  html.classList.add('neo-palette-custom');
  const color = lastState?.type === 'custom' && lastState.color
    ? randomHexColorDifferentFrom(lastState.color)
    : randomHexColor();
  const saturation = lastState?.type === 'custom' && lastState.saturation !== undefined
    ? randomSaturationDifferentFrom(lastState.saturation)
    : randomSaturation();
  const brightness = lastState?.type === 'custom' && lastState.brightness !== undefined
    ? randomBrightnessDifferentFrom(lastState.brightness)
    : randomBrightness();
  const sameAsLast = lastState?.type === 'custom'
    && color === lastState.color
    && saturation === lastState.saturation
    && brightness === lastState.brightness;
  const { inverted: finalInverted, highContrast: finalHighContrast } = pickRandomEffects(sameAsLast);
  html.style.setProperty('--neo-custom-base-color', color);
  html.style.setProperty('--neo-saturation', String(saturation));
  html.style.setProperty('--neo-brightness', String(brightness));
  lastState = { type: 'custom', color, saturation, brightness, inverted: finalInverted, highContrast: finalHighContrast };
}
function applyRandom(config: Config): void {
  const html = document.documentElement;
  const mode = getThemeMode();
  if (lastMode !== mode) lastState = null;
  lastMode = mode;
  randomScope = normalizeRandomScope(config['random-scope']);
  randomHighContrast = normalizeRandomTristate(config['random-highcontrast']);
  randomInvert = normalizeRandomTristate(config['random-invert']);
  const saturationRange = readConfigRange(config);
  randomSaturationMin = saturationRange.min;
  randomSaturationMax = saturationRange.max;
  const brightnessRange = readConfigBrightnessRange(config);
  randomBrightnessMin = brightnessRange.min;
  randomBrightnessMax = brightnessRange.max;
  html.classList.remove(
    ...Array.from(html.classList).filter(cls => cls.startsWith('neo-palette-') && cls !== 'neo-palette-random')
  );
  html.style.removeProperty('--neo-custom-base-color');
  html.style.removeProperty('--neo-saturation');
  html.style.removeProperty('--neo-brightness');
  clearFreeColors();
  setFreePresetAttr('');
  destroyInvert();
  destroyHighContrast();
  const pool = pickRandomPool(config, mode);
  if (pool === 'preset') applyPresetRandom(config, mode);
  else if (pool === 'free' || pool === 'library') applyFreeRandom(config, mode, pool);
  else if (pool === 'default') applyDefaultRandom();
  else applyCustomRandom(config, mode);
}
export function refreshRandom(config: Config): boolean {
  if (!neoFeatureActive) return false;
  applyRandom(config);
  return true;
}
function enableRandom(config: Config): void {
  if (neoFeatureActive) return;
  neoFeatureActive = true;
  applyRandom(config);
}
export function initRandom(config: Config): void {
  enableRandom(config);
}
