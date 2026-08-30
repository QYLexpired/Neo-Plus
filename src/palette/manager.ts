import { getPlugin } from '../main/guard';
import { loadConfig, saveConfig } from '../main/data';
import type { Config } from '../main/data';
import {
  type ThemeMode,
  type Preset,
  getCurrentThemeMode,
  getPresetsByMode,
  getCurrentPlan,
  getCustomColorKey,
  getSaturationKey,
  getBrightnessKey,
  getFollowTimeBaseColorKey,
  applyPreset,
  applyCurrentPlan,
  destroyPaletteClasses,
  volChunkSize,
} from './presets';
import { initCustomColor, destroyCustomColor } from './customcolor';
import { initFollowTime, destroyFollowTime } from './followtime';
import { initFollowBanner, destroyFollowBanner } from './followbanner';
import { initFollowSystem, destroyFollowSystem } from './followsystem';
import { initSaturation, destroySaturation } from './saturation';
import { initBrightness, destroyBrightness } from './brightness';
import { initInvert, destroyInvert } from './invert';
import { initHighContrast, destroyHighContrast } from './highcontrast';
import { initRandom, destroyRandom, initRandomSettings } from './random';
import { withViewTransition } from '../modules/viewtransition';
export type { ThemeMode, Preset, Config };
type Plan = 'custom' | 'followtime' | 'followbanner' | 'followsystem' | 'random';
function initPlan(plan: Plan, config: Config): void {
  switch (plan) {
    case 'custom': initCustomColor(config); break;
    case 'followtime': initFollowTime(config); break;
    case 'followbanner': initFollowBanner(config); break;
    case 'followsystem': initFollowSystem(config); break;
    case 'random': initRandom(config); break;
  }
}
function restorePalette(config: Config): void {
  const mode = getCurrentThemeMode();
  const plan = getCurrentPlan(config, mode);
  destroyRandom();
  destroyCustomColor();
  destroyFollowTime();
  destroyFollowBanner();
  destroyFollowSystem();
  destroySaturation();
  destroyBrightness();
  destroyInvert();
  destroyHighContrast();
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
}
export function switchToPreset(key: string): void {
  loadConfig().then((config) => {
    withViewTransition(() => {
      destroyRandom();
      destroyCustomColor();
      destroyFollowTime();
      destroyFollowBanner();
      destroyFollowSystem();
      destroySaturation();
      destroyBrightness();
      destroyInvert();
      destroyHighContrast();
      applyPreset(key);
      initSaturation(config);
      initBrightness(config);
      initInvert(config);
      initHighContrast(config);
    });
  }).catch(() => {});
}
export function switchToPlan(plan: Plan): void {
  const mode = getCurrentThemeMode();
  const configKey: 'color-plan-light' | 'color-plan-dark' = mode === 'dark' ? 'color-plan-dark' : 'color-plan-light';
  saveConfig({ [configKey]: plan }).then(() => {
    loadConfig().then((config) => {
      withViewTransition(() => {
        restorePalette(config);
      });
    });
  }).catch(() => {});
}
export function getPresetMenuItems(i18n: Record<string, string>): any[] {
  const mode = getCurrentThemeMode();
  const availablePresets = getPresetsByMode(mode);
  const pinnedKeys = ['default', 'classic'];
  const topLevelPresets = availablePresets.filter((p) => pinnedKeys.includes(p.key));
  const restPresets = availablePresets.filter((p) => !pinnedKeys.includes(p.key));
  const makeItem = (preset: Preset): any => ({
    id: `neo-palette-${preset.key}-button`,
    icon: 'iconNeoPalette',
    label: i18n[preset.nameKey],
    click: () => {
      switchToPreset(preset.key);
      return true;
    },
  });
  const makeSubmenu = (presets: Preset[]): any[] => {
    const submenuItems: any[] = [];
    for (let i = 0; i < presets.length; i += 5) {
      submenuItems.push(...presets.slice(i, i + 5).map(makeItem));
      if (i + 5 < presets.length) {
        submenuItems.push({ type: 'separator' });
      }
    }
    return submenuItems;
  };
  const items: any[] = topLevelPresets.map(makeItem);
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
export function handleColorInput(value: string, cssVar: string, colorKey: string, plan: string): void {
  document.documentElement.style.setProperty(cssVar, value);
  const mode = getCurrentThemeMode();
  const configKey: 'color-plan-light' | 'color-plan-dark' = mode === 'dark' ? 'color-plan-dark' : 'color-plan-light';
  saveConfig({ [colorKey]: value, [configKey]: plan } as Partial<Config>);
}
let _menuListenerInitialized = false;
let _inputHandler: ((e: Event) => void) | null = null;
let _clickHandler: ((e: Event) => void) | null = null;
let _dblclickHandler: ((e: Event) => void) | null = null;
function handleSliderInput(target: HTMLInputElement, cssVar: string, configKey: string, label: string): void {
  const num = parseFloat(target.value);
  document.documentElement.style.setProperty(cssVar, target.value);
  const tooltip = target.closest('.b3-tooltips') as HTMLElement | null;
  if (tooltip) {
    tooltip.setAttribute('aria-label', `${label}：${num.toFixed(2)}`);
  }
  saveConfig({ [configKey]: num } as Partial<Config>);
}
export function initPaletteMenuEvents(i18n: Record<string, string>): void {
  if (_menuListenerInitialized) return;
  _menuListenerInitialized = true;
  _inputHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    const menuItem = target.closest('[data-id]') as HTMLElement | null;
    if (!menuItem) return;
    const dataId = menuItem.getAttribute('data-id');
    if (dataId === 'neo-custom-color-button' && target instanceof HTMLInputElement && target.type === 'color') {
      handleColorInput(target.value, '--neo-custom-base-color', getCustomColorKey(getCurrentThemeMode()), 'custom');
    } else if (dataId === 'neo-followtime-button' && target instanceof HTMLInputElement && target.type === 'color') {
      handleColorInput(target.value, '--neo-followtime-base-color', getFollowTimeBaseColorKey(getCurrentThemeMode()), 'followtime');
    } else if (dataId === 'neo-saturation-button' && target instanceof HTMLInputElement && target.type === 'range') {
      handleSliderInput(target, '--neo-saturation', getSaturationKey(getCurrentThemeMode()), i18n.saturation ?? 'Saturation');
    } else if (dataId === 'neo-brightness-button' && target instanceof HTMLInputElement && target.type === 'range') {
      handleSliderInput(target, '--neo-brightness', getBrightnessKey(getCurrentThemeMode()), i18n.brightness ?? 'Brightness');
    }
  };
  _clickHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLInputElement && target.type === 'color')) return;
    const menuItem = target.closest('[data-id]') as HTMLElement | null;
    if (!menuItem) return;
    const dataId = menuItem.getAttribute('data-id');
    if (dataId !== 'neo-custom-color-button' && dataId !== 'neo-followtime-button') return;
    e.stopPropagation();
  };
  _dblclickHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    const menuItem = target.closest('[data-id]') as HTMLElement | null;
    if (!menuItem) return;
    const dataId = menuItem.getAttribute('data-id');
    if (dataId === 'neo-saturation-button' && target instanceof HTMLInputElement && target.type === 'range') {
      target.value = '1';
      handleSliderInput(target, '--neo-saturation', getSaturationKey(getCurrentThemeMode()), i18n.saturation ?? 'Saturation');
    } else if (dataId === 'neo-brightness-button' && target instanceof HTMLInputElement && target.type === 'range') {
      target.value = '0';
      handleSliderInput(target, '--neo-brightness', getBrightnessKey(getCurrentThemeMode()), i18n.brightness ?? 'Brightness');
    }
  };
  document.addEventListener('input', _inputHandler, true);
  document.addEventListener('click', _clickHandler, true);
  document.addEventListener('dblclick', _dblclickHandler, true);
}
export function destroyPaletteMenuEvents(): void {
  if (_inputHandler) {
    document.removeEventListener('input', _inputHandler, true);
    _inputHandler = null;
  }
  if (_clickHandler) {
    document.removeEventListener('click', _clickHandler, true);
    _clickHandler = null;
  }
  if (_dblclickHandler) {
    document.removeEventListener('dblclick', _dblclickHandler, true);
    _dblclickHandler = null;
  }
  _menuListenerInitialized = false;
}
export { createColorPickerHTML, getThemeColor } from './customcolor';
export { createSliderHTML } from './saturation';
export { createBrightnessSliderHTML } from './brightness';
export { createFollowTimeColorPickerHTML } from './followtime';
export { onInvertClick } from './invert';
export { onHighContrastClick } from './highcontrast';
let _mutationObserver: MutationObserver | null = null;
let _lastThemeMode: string | null = null;
export function initPalette(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  initRandomSettings();
  loadConfig().then((config) => {
    restorePalette(config);
    _lastThemeMode = document.documentElement.getAttribute('data-theme-mode');
    _mutationObserver = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-theme-mode');
      if (current === _lastThemeMode) return;
      _lastThemeMode = current;
      loadConfig().then((config) => {
        restorePalette(config);
      });
    });
    _mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme-mode'],
    });
  });
}
export function destroyPalette(): void {
  destroyRandom();
  destroyCustomColor();
  destroyFollowTime();
  destroyFollowBanner();
  destroyFollowSystem();
  destroySaturation();
  destroyBrightness();
  destroyInvert();
  destroyHighContrast();
  destroyPaletteClasses();
  destroyPaletteMenuEvents();
  if (_mutationObserver) {
    _mutationObserver.disconnect();
    _mutationObserver = null;
  }
  _lastThemeMode = null;
}
