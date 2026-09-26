import { saveConfig, type Config } from '../main/data';
import { getThemeMode } from '../modules/thememode';
import { presets, type Preset, type ThemeMode } from './definitions';
import { getLibraryPresets } from './library';
export type { ThemeMode, PresetMode, PresetGroup, Preset } from './definitions';
export { volChunkSize } from './definitions';
export function getPresetsByMode(mode: ThemeMode): Preset[] {
  return presets.filter((p) => p.mode === 'all' || p.mode === mode);
}
export { getThemeMode };
export function getBaseCustomColorKey(mode: ThemeMode): 'basecustom-color-light' | 'basecustom-color-dark' {
  return mode === 'dark' ? 'basecustom-color-dark' : 'basecustom-color-light';
}
export function getSaturationKey(mode: ThemeMode): 'saturation-light' | 'saturation-dark' {
  return mode === 'dark' ? 'saturation-dark' : 'saturation-light';
}
export function getBrightnessKey(mode: ThemeMode): 'brightness-light' | 'brightness-dark' {
  return mode === 'dark' ? 'brightness-dark' : 'brightness-light';
}
export function getInvertKey(mode: ThemeMode): 'invert-light' | 'invert-dark' {
  return mode === 'dark' ? 'invert-dark' : 'invert-light';
}
export function getHighContrastKey(mode: ThemeMode): 'highcontrast-light' | 'highcontrast-dark' {
  return mode === 'dark' ? 'highcontrast-dark' : 'highcontrast-light';
}
export function getCurrentPlan(config: Config, mode: ThemeMode): 'preset' | 'basecustom' | 'basefollowbanner' | 'basefollowsystem' | 'random' | 'free' {
  const plan = mode === 'dark' ? config['color-plan-dark'] : config['color-plan-light'];
  switch (plan) {
    case 'basecustom':
    case 'basefollowbanner':
    case 'basefollowsystem':
    case 'random':
    case 'free':
      return plan;
    default:
      return 'preset';
  }
}
function resolvePresetKey(key: unknown, mode: ThemeMode): string {
  const available = [...getPresetsByMode(mode), ...getLibraryPresets(mode)];
  return available.find(preset => preset.key === key)?.key ?? 'default';
}
export function getPresetKey(config: Config, mode: ThemeMode): string | undefined {
  const key = mode === 'dark' ? config['preset-dark'] : config['preset-light'];
  return key === undefined ? undefined : resolvePresetKey(key, mode);
}
function removePaletteClasses(html: HTMLElement): void {
  const classesToRemove = Array.from(html.classList).filter((cls) => cls.startsWith('neo-palette-'));
  html.classList.remove(...classesToRemove);
}
export function applyPreset(key: string): void {
  const mode = getThemeMode();
  const presetKey = resolvePresetKey(key, mode);
  const html = document.documentElement;
  removePaletteClasses(html);
  html.classList.add(`neo-palette-${presetKey}`);
  const patch: Partial<Config> = {};
  if (mode === 'dark') {
    patch['color-plan-dark'] = 'preset';
    patch['preset-dark'] = presetKey;
  } else {
    patch['color-plan-light'] = 'preset';
    patch['preset-light'] = presetKey;
  }
  saveConfig(patch);
}
export function destroyPaletteClasses(): void {
  const html = document.documentElement;
  removePaletteClasses(html);
}
export function applyCurrentPlan(config: Config): void {
  const mode = getThemeMode();
  const plan = getCurrentPlan(config, mode);
  const html = document.documentElement;
  removePaletteClasses(html);
  if (plan === 'preset') {
    const presetKey = getPresetKey(config, mode) ?? 'default';
    html.classList.add(`neo-palette-${presetKey}`);
  } else if (plan === 'free') {
    html.classList.add('neo-palette-free');
  } else if (plan === 'basefollowbanner') {
    html.classList.add('neo-palette-basefollowbanner');
  } else if (plan === 'basefollowsystem') {
    html.classList.add('neo-palette-basefollowsystem');
  } else if (plan === 'random') {
    html.classList.add('neo-palette-random');
  } else {
    html.classList.add('neo-palette-basecustom');
  }
}
