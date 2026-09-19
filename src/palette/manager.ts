import type { MenuItem } from 'siyuan';
import { getPlugin } from '../main/context';
import { loadConfig, saveConfig, flushConfigSave, type Config } from '../main/data';
import {
  type ThemeMode,
  type Preset,
  getThemeMode,
  getPresetsByMode,
  getCurrentPlan,
  getCustomColorKey,
  getSaturationKey,
  getBrightnessKey,
  applyPreset,
  applyCurrentPlan,
  destroyPaletteClasses,
  volChunkSize,
} from './presets';
import { initFree, destroyFree, scheduleFreeColorRestore } from './free';
import { initCustomColor, destroyCustomColor } from './customcolor';
import { initFollowBanner, destroyFollowBanner } from './followbanner';
import { initFollowSystem, destroyFollowSystem } from './followsystem';
import { initSaturation, destroySaturation } from './saturation';
import { initBrightness, destroyBrightness } from './brightness';
import { initInvert, destroyInvert } from './invert';
import { initHighContrast, destroyHighContrast } from './highcontrast';
import { initRandom, destroyRandom, initRandomSettings, refreshRandom } from './random';
import { withViewTransition } from '../modules/viewtransition';
import { createNeoLifecycleGuard } from '../main/lifecycle';
export type { ThemeMode, Preset, Config };
type Plan = 'custom' | 'followbanner' | 'followsystem' | 'random' | 'free';
function initPlan(plan: Plan, config: Config): void {
  switch (plan) {
    case 'free': initFree(config); break;
    case 'custom': initCustomColor(config); break;
    case 'followbanner': initFollowBanner(config); break;
    case 'followsystem': initFollowSystem(); break;
    case 'random': initRandom(config); break;
  }
}
function destroyPaletteEffects(): void {
  destroyFree();
  destroyRandom();
  destroyCustomColor();
  destroyFollowBanner();
  destroyFollowSystem();
  destroySaturation();
  destroyBrightness();
  destroyInvert();
  destroyHighContrast();
}
function restorePalette(config: Config): void {
  const mode = getThemeMode();
  const plan = getCurrentPlan(config, mode);
  if (plan === 'random' && refreshRandom(config)) return;
  destroyPaletteEffects();
  applyCurrentPlan(config);
  if (plan !== 'preset') {
    initPlan(plan as Plan, config);
  }
  if (plan !== 'random') {
    initSaturation(config);
    initBrightness(config);
    initInvert(config);
    initHighContrast(config);
  }
  if (plan === 'free') {
    scheduleFreeColorRestore(config);
  }
}
export function switchToPreset(key: string): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    withViewTransition(() => {
      if (!isCurrent()) return;
      destroyPaletteEffects();
      applyPreset(key);
      initSaturation(config);
      initBrightness(config);
      initInvert(config);
      initHighContrast(config);
    });
  }).catch(() => {});
}
export function switchToPlan(plan: Plan): void {
  const isCurrent = createNeoLifecycleGuard();
  const mode = getThemeMode();
  const configKey: 'color-plan-light' | 'color-plan-dark' = mode === 'dark' ? 'color-plan-dark' : 'color-plan-light';
  saveConfig({ [configKey]: plan }).then(() => {
    if (!isCurrent()) return;
    return loadConfig().then((config) => {
      withViewTransition(() => {
        if (!isCurrent()) return;
        restorePalette(config);
      });
    });
  }).catch(() => {});
}
export function getPresetMenuItems(i18n: Record<string, string>): MenuItem[] {
  const mode = getThemeMode();
  const availablePresets = getPresetsByMode(mode);
  const pinnedKeys = ['default', 'classic'];
  const topLevelPresets = availablePresets.filter((p) => pinnedKeys.includes(p.key));
  const restPresets = availablePresets.filter((p) => !pinnedKeys.includes(p.key));
  const makeItem = (preset: Preset): MenuItem => ({
    id: `neo-palette-${preset.key}-button`,
    icon: 'iconNeoPalette',
    label: i18n[preset.nameKey],
    click: () => {
      switchToPreset(preset.key);
      return true;
    },
  });
  const makeSubmenu = (presets: Preset[]): MenuItem[] => {
    const submenuItems: MenuItem[] = [];
    for (let i = 0; i < presets.length; i += 5) {
      submenuItems.push(...presets.slice(i, i + 5).map(makeItem));
      if (i + 5 < presets.length) {
        submenuItems.push({ type: 'separator' });
      }
    }
    return submenuItems;
  };
  const items: MenuItem[] = topLevelPresets.map(makeItem);
  items.push({ type: 'separator' });
  const groupedPresets = new Map<string, Preset[]>();
  const ungroupedPresets: Preset[] = [];
  for (const preset of restPresets) {
    if (preset.group) {
      const list = groupedPresets.get(preset.group);
      if (list) {
        list.push(preset);
      } else {
        groupedPresets.set(preset.group, [preset]);
      }
    } else {
      ungroupedPresets.push(preset);
    }
  }
  const chunkSize = volChunkSize;
  const groups: Preset[][] = [];
  for (let i = 0; i < ungroupedPresets.length; i += chunkSize) {
    groups.push(ungroupedPresets.slice(i, i + chunkSize));
  }
  groups.forEach((group, index) => {
    if (group.length === 0) return;
    const label = i18n['colorSchemeVol'].replace('${n}', String(index + 1));
    items.push({
      id: `neo-palette-vol${index + 1}-button`,
      icon: 'iconNeoPalette',
      label,
      submenu: makeSubmenu(group),
    });
  });
  for (const [groupKey, groupPresets] of groupedPresets) {
    const nameKey = `colorSchemeGroup${groupKey.charAt(0).toUpperCase()}${groupKey.slice(1)}`;
    items.push({
      id: `neo-palette-group-${groupKey}-button`,
      icon: 'iconNeoPalette',
      label: i18n[nameKey],
      submenu: makeSubmenu(groupPresets),
    });
  }
  return items;
}
export function handleColorInput(value: string, cssVar: string, colorKey: ReturnType<typeof getCustomColorKey>, plan: Plan): void {
  document.documentElement.style.setProperty(cssVar, value);
  const mode = getThemeMode();
  const configKey: 'color-plan-light' | 'color-plan-dark' = mode === 'dark' ? 'color-plan-dark' : 'color-plan-light';
  saveConfig({ [colorKey]: value, [configKey]: plan }, 200);
}
let menuListenerInitialized = false;
let inputHandler: ((e: Event) => void) | null = null;
let clickHandler: ((e: Event) => void) | null = null;
let changeHandler: ((e: Event) => void) | null = null;
let dblclickHandler: ((e: Event) => void) | null = null;
function handleSliderInput(target: HTMLInputElement, cssVar: string, configKey: ReturnType<typeof getSaturationKey> | ReturnType<typeof getBrightnessKey>, label: string): void {
  const num = parseFloat(target.value);
  document.documentElement.style.setProperty(cssVar, target.value);
  const tooltip = target.closest('.b3-tooltips') as HTMLElement | null;
  if (tooltip) {
    tooltip.setAttribute('aria-label', `${label}：${num.toFixed(2)}`);
  }
  saveConfig({ [configKey]: num }, 200);
}
export function initPaletteMenuEvents(i18n: Record<string, string>): void {
  if (menuListenerInitialized) return;
  menuListenerInitialized = true;
  inputHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    const menuItem = target.closest('[data-id]') as HTMLElement | null;
    if (!menuItem) return;
    const dataId = menuItem.getAttribute('data-id');
    if (dataId === 'neo-customcolor-button' && target instanceof HTMLInputElement && target.type === 'color') {
      handleColorInput(target.value, '--neo-custom-base-color', getCustomColorKey(getThemeMode()), 'custom');
    } else if (dataId === 'neo-saturation-button' && target instanceof HTMLInputElement && target.type === 'range') {
      handleSliderInput(target, '--neo-saturation', getSaturationKey(getThemeMode()), i18n.saturation ?? 'Saturation');
    } else if (dataId === 'neo-brightness-button' && target instanceof HTMLInputElement && target.type === 'range') {
      handleSliderInput(target, '--neo-brightness', getBrightnessKey(getThemeMode()), i18n.brightness ?? 'Brightness');
    }
  };
  changeHandler = (e: Event) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    const dataId = target.closest('[data-id]')?.getAttribute('data-id');
    if ((target.type === 'range' && (dataId === 'neo-saturation-button' || dataId === 'neo-brightness-button'))
      || (target.type === 'color' && dataId === 'neo-customcolor-button')) flushConfigSave();
  };
  clickHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLInputElement && target.type === 'color')) return;
    const menuItem = target.closest('[data-id]') as HTMLElement | null;
    if (!menuItem) return;
    const dataId = menuItem.getAttribute('data-id');
    if (dataId !== 'neo-customcolor-button') return;
    e.stopPropagation();
  };
  dblclickHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    const menuItem = target.closest('[data-id]') as HTMLElement | null;
    if (!menuItem) return;
    const dataId = menuItem.getAttribute('data-id');
    if (dataId === 'neo-saturation-button' && target instanceof HTMLInputElement && target.type === 'range') {
      target.value = '1';
      handleSliderInput(target, '--neo-saturation', getSaturationKey(getThemeMode()), i18n.saturation ?? 'Saturation');
    } else if (dataId === 'neo-brightness-button' && target instanceof HTMLInputElement && target.type === 'range') {
      target.value = '0';
      handleSliderInput(target, '--neo-brightness', getBrightnessKey(getThemeMode()), i18n.brightness ?? 'Brightness');
    }
  };
  document.addEventListener('input', inputHandler, true);
  document.addEventListener('change', changeHandler, true);
  document.addEventListener('click', clickHandler, true);
  document.addEventListener('dblclick', dblclickHandler, true);
}
export function destroyPaletteMenuEvents(): void {
  flushConfigSave();
  if (changeHandler) {
    document.removeEventListener('change', changeHandler, true);
    changeHandler = null;
  }
  if (inputHandler) {
    document.removeEventListener('input', inputHandler, true);
    inputHandler = null;
  }
  if (clickHandler) {
    document.removeEventListener('click', clickHandler, true);
    clickHandler = null;
  }
  if (dblclickHandler) {
    document.removeEventListener('dblclick', dblclickHandler, true);
    dblclickHandler = null;
  }
  menuListenerInitialized = false;
}
export { createColorPickerHTML, getThemeColor } from './customcolor';
export { createSliderHTML } from './saturation';
export { createBrightnessSliderHTML } from './brightness';
export { onInvertClick } from './invert';
export { onHighContrastClick } from './highcontrast';
let mutationObserver: MutationObserver | null = null;
let lastThemeMode: string | null = null;
export function initPalette(): Promise<void> | void {
  const plugin = getPlugin();
  if (!plugin) return;
  const isCurrent = createNeoLifecycleGuard();
  initPaletteMenuEvents(plugin.i18n);
  const settingsReady = initRandomSettings();
  const paletteReady = loadConfig().then((config) => {
    if (!isCurrent()) return;
    restorePalette(config);
    lastThemeMode = document.documentElement.getAttribute('data-theme-mode');
    mutationObserver = new MutationObserver(() => {
      if (!isCurrent()) return;
      const current = document.documentElement.getAttribute('data-theme-mode');
      if (current === lastThemeMode) return;
      lastThemeMode = current;
      loadConfig().then((config) => {
        if (!isCurrent()) return;
        restorePalette(config);
      }).catch(() => {});
    });
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme-mode'],
    });
  });
  return Promise.all([settingsReady, paletteReady]).then(() => {});
}
export function destroyPalette(): void {
  destroyPaletteEffects();
  destroyPaletteClasses();
  destroyPaletteMenuEvents();
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  lastThemeMode = null;
}
