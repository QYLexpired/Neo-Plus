import type { MenuItem } from 'siyuan';
import { getPlugin } from '../main/context';
import { loadConfig, saveConfig, flushConfigSave, type Config } from '../main/data';
import {
  type ThemeMode,
  type Preset,
  type PresetGroup,
  getThemeMode,
  getPresetsByMode,
  getCurrentPlan,
  getBaseCustomColorKey,
  getSaturationKey,
  getBrightnessKey,
  applyPreset,
  applyCurrentPlan,
  destroyPaletteClasses,
  volChunkSize,
} from './presets';
import { getLibraryPresets } from './library';
import { pinnedPresetKeys, presetGroups } from './definitions';
import { initFree, destroyFree, scheduleFreeColorRestore } from './free';
import { initBaseCustom, destroyBaseCustom } from './basecustom';
import { initBaseFollowBanner, destroyBaseFollowBanner } from './basefollowbanner';
import { initBaseFollowSystem, destroyBaseFollowSystem } from './basefollowsystem';
import { initSaturation, destroySaturation } from './saturation';
import { initBrightness, destroyBrightness } from './brightness';
import { initInvert, destroyInvert } from './invert';
import { initHighContrast, destroyHighContrast } from './highcontrast';
import { initRandom, destroyRandom, initRandomSettings, refreshRandom } from './random';
import { withViewTransition } from '../modules/viewtransition';
import { createNeoLifecycleGuard } from '../main/lifecycle';
export type { ThemeMode, Preset, Config };
type Plan = 'basecustom' | 'basefollowbanner' | 'basefollowsystem' | 'random' | 'free';
let paletteActionRevision = 0;
let paletteInitialization: Promise<void> | null = null;
let mutationObserver: MutationObserver | null = null;
let lastThemeMode: string | null = null;
function createPaletteActionGuard(): () => boolean {
  const isCurrent = createNeoLifecycleGuard();
  const mode = getThemeMode();
  lastThemeMode = document.documentElement.getAttribute('data-theme-mode');
  const revision = ++paletteActionRevision;
  return () => isCurrent() && revision === paletteActionRevision && getThemeMode() === mode;
}
function initPlan(plan: Plan, config: Config): void {
  switch (plan) {
    case 'free': initFree(config); break;
    case 'basecustom': initBaseCustom(config); break;
    case 'basefollowbanner': initBaseFollowBanner(config); break;
    case 'basefollowsystem': initBaseFollowSystem(); break;
    case 'random': initRandom(config); break;
  }
}
function destroyPaletteEffects(): void {
  destroyFree();
  destroyRandom();
  destroyBaseCustom();
  destroyBaseFollowBanner();
  destroyBaseFollowSystem();
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
    scheduleFreeColorRestore();
  }
}
export function switchToPreset(key: string): void {
  const canApply = createPaletteActionGuard();
  loadConfig().then((config) => {
    if (!canApply()) return;
    withViewTransition(() => {
      if (!canApply()) return;
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
  const canApply = createPaletteActionGuard();
  const mode = getThemeMode();
  const configKey: 'color-plan-light' | 'color-plan-dark' = mode === 'dark' ? 'color-plan-dark' : 'color-plan-light';
  saveConfig({ [configKey]: plan }).then(() => {
    if (!canApply()) return;
    return loadConfig().then((config) => {
      if (!canApply()) return;
      withViewTransition(() => {
        if (!canApply()) return;
        restorePalette(config);
      });
    });
  }).catch(() => {});
}
let lastShuffledPresetKey: string | null = null;
function pickShuffledPreset(presets: readonly Preset[]): Preset | undefined {
  const presetCandidates = presets.filter(preset => preset.group !== 'library');
  const libraryCandidates = presets.filter(preset => preset.group === 'library');
  const pool = presetCandidates.length && libraryCandidates.length
    ? (Math.random() < 0.5 ? presetCandidates : libraryCandidates)
    : (presetCandidates.length ? presetCandidates : libraryCandidates);
  if (!pool.length) return undefined;
  const candidates = pool.filter(preset => preset.key !== lastShuffledPresetKey);
  const available = candidates.length ? candidates : pool;
  return available[Math.floor(Math.random() * available.length)];
}
function getPresetIcon(preset: Preset): string {
  return preset.group ? presetGroups[preset.group].icon : 'iconNeoPalette';
}
function createPresetSearch(presets: Preset[], i18n: Record<string, string>, onClose: () => void): [MenuItem, MenuItem] {
  const isCurrent = createNeoLifecycleGuard();
  const mode = getThemeMode();
  let results: HTMLElement | null = null;
  const searchItem: MenuItem = {
    type: 'readonly',
    iconHTML: '',
    label: '<div class="fn__flex"><input class="b3-text-field fn__flex-1" style="min-width: 0; box-sizing: border-box" type="search" autocomplete="off" spellcheck="false"><span class="fn__space"></span><span class="block__icon block__icon--show fn__flex-center ariaLabel" id="neo-presets-search-shuffle" role="button" tabindex="0"><svg><use xlink:href="#iconDices"></use></svg></span></div>',
    bind: (element) => {
      const input = element.querySelector('input')!;
      const randomButton = element.querySelector<HTMLElement>('#neo-presets-search-shuffle')!;
      randomButton.setAttribute('aria-label', i18n.colorSchemeRandom);
      input.placeholder = i18n.colorSchemeSearch;
      input.setAttribute('aria-label', i18n.colorSchemeSearch);
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-expanded', 'false');
      input.setAttribute('aria-controls', 'neo-presets-search-results');
      const hiddenStates = new Map<Element, boolean>();
      let matched: Preset[] = [];
      let focused = 0;
      const choose = (preset: Preset): void => {
        if (!isCurrent() || getThemeMode() !== mode) return;
        switchToPreset(preset.key);
        focused = matched.indexOf(preset);
        updateFocus();
      };
      const updateFocus = (): void => {
        if (!results) return;
        Array.from(results.querySelectorAll<HTMLElement>('[role="option"]')).forEach((row, index) => {
          row.classList.toggle('b3-menu__item--current', index === focused);
          row.setAttribute('aria-selected', String(index === focused));
        });
        const row = matched.length ? results.children[focused] : null;
        if (row) input.setAttribute('aria-activedescendant', row.id);
        else input.removeAttribute('aria-activedescendant');
      };
      const filterItems = (): void => {
        if (!isCurrent() || getThemeMode() !== mode || !results) return;
        const query = input.value.trim().toLocaleLowerCase();
        for (const sibling of Array.from(element.parentElement?.children ?? [])) {
          if (sibling === element || !sibling.matches('[data-id^="neo-palette-"], .b3-menu__separator')) continue;
          if (!hiddenStates.has(sibling)) hiddenStates.set(sibling, sibling.classList.contains('fn__none'));
          sibling.classList.toggle('fn__none', !!query || hiddenStates.get(sibling)!);
        }
        results.classList.toggle('fn__none', !query);
        input.setAttribute('aria-expanded', String(!!query));
        results.replaceChildren();
        matched = query ? presets.filter(preset => `${i18n[preset.nameKey] ?? preset.key} ${preset.key}`.toLocaleLowerCase().includes(query)) : [];
        focused = 0;
        for (const [index, preset] of matched.entries()) {
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'b3-menu__item';
          row.id = `neo-presets-search-option-${index}`;
          row.dataset.id = `neo-palette-${preset.key}-button`;
          row.setAttribute('role', 'option');
          row.tabIndex = -1;
          row.innerHTML = `<svg class="b3-menu__icon"><use xlink:href="#${getPresetIcon(preset)}"></use></svg><span class="b3-menu__label"></span>`;
          row.querySelector('span')!.textContent = i18n[preset.nameKey] ?? preset.key;
          row.addEventListener('click', () => choose(preset));
          results.append(row);
        }
        if (query && !matched.length) {
          const empty = document.createElement('div');
          empty.className = 'b3-label__text';
          empty.setAttribute('role', 'status');
          empty.textContent = i18n.colorSchemeSearchEmpty;
          results.append(empty);
        }
        updateFocus();
      };
      randomButton.addEventListener('click', () => {
        if (!isCurrent() || getThemeMode() !== mode) return;
        const preset = pickShuffledPreset(presets);
        if (!preset) return;
        lastShuffledPresetKey = preset.key;
        switchToPreset(preset.key);
      });
      randomButton.addEventListener('keydown', event => {
        event.stopPropagation();
        if (event.isComposing || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        randomButton.click();
      });
      element.addEventListener('click', event => event.stopPropagation());
      input.addEventListener('input', filterItems);
      element.addEventListener('keydown', event => {
        event.stopPropagation();
        if (event.isComposing) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (!matched.length) return;
          focused = (focused + (event.key === 'ArrowDown' ? 1 : -1) + matched.length) % matched.length;
          updateFocus();
          results?.children[focused]?.scrollIntoView({ block: 'nearest' });
        } else if (event.key === 'Enter') {
          event.preventDefault();
          if (matched[focused]) choose(matched[focused]);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          if (input.value) {
            input.value = '';
            filterItems();
          } else {
            onClose();
          }
        }
      });
    },
  };
  const resultsItem: MenuItem = {
    type: 'empty',
    label: '<div class="neo-presets-search-results fn__none" id="neo-presets-search-results" style="margin-top: 4px; max-height: 50vh; overflow-y: auto" role="listbox"></div>',
    bind: (element) => {
      results = element.querySelector<HTMLElement>('.neo-presets-search-results')!;
      results.setAttribute('aria-label', i18n.colorScheme);
    },
  };
  return [searchItem, resultsItem];
}
export function getPresetMenuItems(i18n: Record<string, string>, onClose: () => void): MenuItem[] {
  const mode = getThemeMode();
  const libraryPresets = getLibraryPresets(mode).sort((a, b) =>
    (i18n[a.nameKey] ?? a.key).localeCompare(i18n[b.nameKey] ?? b.key, undefined, { sensitivity: 'base' }));
  const availablePresets = [...getPresetsByMode(mode), ...libraryPresets];
  const topLevelPresets = availablePresets.filter((p) => pinnedPresetKeys.includes(p.key));
  const restPresets = availablePresets.filter((p) => !pinnedPresetKeys.includes(p.key));
  const makeItem = (preset: Preset): MenuItem => ({
    id: `neo-palette-${preset.key}-button`,
    icon: getPresetIcon(preset),
    label: i18n[preset.nameKey] ?? preset.key,
    click: () => {
      if (getThemeMode() === mode) switchToPreset(preset.key);
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
  const items: MenuItem[] = [...createPresetSearch(availablePresets, i18n, onClose), ...topLevelPresets.map(makeItem)];
  items.push({ type: 'separator' });
  const groupedPresets = new Map<PresetGroup, Preset[]>();
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
  for (const groupKey of Object.keys(presetGroups) as PresetGroup[]) {
    const groupPresets = groupedPresets.get(groupKey);
    if (!groupPresets?.length) continue;
    const group = presetGroups[groupKey];
    if (group.separator) items.push({ type: 'separator' });
    items.push({
      id: `neo-palette-group-${groupKey}-button`,
      icon: group.icon,
      label: i18n[group.nameKey],
      submenu: group.chunked ? makeSubmenu(groupPresets) : groupPresets.map(makeItem),
    });
  }
  return items;
}
export function handleColorInput(value: string, cssVar: string, colorKey: ReturnType<typeof getBaseCustomColorKey>, plan: Plan): void {
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
    if (dataId === 'neo-basecustom-button' && target instanceof HTMLInputElement && target.type === 'color') {
      handleColorInput(target.value, '--neo-base', getBaseCustomColorKey(getThemeMode()), 'basecustom');
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
      || (target.type === 'color' && dataId === 'neo-basecustom-button')) flushConfigSave();
  };
  clickHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLInputElement && target.type === 'color')) return;
    const menuItem = target.closest('[data-id]') as HTMLElement | null;
    if (!menuItem) return;
    const dataId = menuItem.getAttribute('data-id');
    if (dataId !== 'neo-basecustom-button') return;
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
export { createBaseCustomPickerHTML, getBaseCustomColor } from './basecustom';
export { createSliderHTML } from './saturation';
export { createBrightnessSliderHTML } from './brightness';
export { onInvertClick } from './invert';
export { onHighContrastClick } from './highcontrast';
export function initPalette(): Promise<void> | void {
  const plugin = getPlugin();
  if (!plugin) return;
  if (paletteInitialization) return paletteInitialization;
  const isCurrent = createNeoLifecycleGuard();
  const revision = ++paletteActionRevision;
  initPaletteMenuEvents(plugin.i18n);
  const settingsReady = initRandomSettings();
  const paletteReady = loadConfig().then((config) => {
    if (!isCurrent() || paletteInitialization !== initialization) return;
    if (revision === paletteActionRevision) restorePalette(config);
    lastThemeMode = document.documentElement.getAttribute('data-theme-mode');
    mutationObserver = new MutationObserver(() => {
      if (!isCurrent() || paletteInitialization !== initialization) return;
      const current = document.documentElement.getAttribute('data-theme-mode');
      if (current === lastThemeMode) return;
      lastThemeMode = current;
      const canApply = createPaletteActionGuard();
      loadConfig().then((config) => {
        if (!canApply() || paletteInitialization !== initialization) return;
        restorePalette(config);
      }).catch(() => {});
    });
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme-mode'],
    });
  });
  const initialization: Promise<void> = Promise.all([settingsReady, paletteReady]).then(() => {}).catch((error) => {
    if (paletteInitialization === initialization) destroyPalette();
    throw error;
  });
  paletteInitialization = initialization;
  return initialization;
}
export function destroyPalette(): void {
  paletteActionRevision += 1;
  paletteInitialization = null;
  lastShuffledPresetKey = null;
  destroyPaletteEffects();
  destroyPaletteClasses();
  destroyPaletteMenuEvents();
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  lastThemeMode = null;
}
