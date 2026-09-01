import { saveConfig, type Config } from '../main/data';
import { getCurrentThemeMode } from '../modules/thememode';
export type ThemeMode = 'light' | 'dark';
export type PresetMode = ThemeMode | 'all';
export type PresetGroup = 'neuebrutalism';
export const volChunkSize = 10;
export interface Preset {
  key: string;
  nameKey: string;
  mode: PresetMode;
  group?: PresetGroup;
}
const presets: Preset[] = [
  { key: 'default', nameKey: 'colorSchemeDefault', mode: 'all' },
  { key: 'classic', nameKey: 'colorSchemeClassic', mode: 'all' },
  { key: 'meridian', nameKey: 'colorSchemeMeridian', mode: 'all' },
  { key: 'amber',  nameKey: 'colorSchemeAmber',  mode: 'all' },
  { key: 'dusk',   nameKey: 'colorSchemeDusk',   mode: 'all' },
  { key: 'gingko',   nameKey: 'colorSchemeGingko',   mode: 'all' },
  { key: 'lavender', nameKey: 'colorSchemeLavender',  mode: 'all' },
  { key: 'midnight', nameKey: 'colorSchemeMidnight',  mode: 'all' },
  { key: 'ocean',    nameKey: 'colorSchemeOcean',     mode: 'all' },
  { key: 'opalite',  nameKey: 'colorSchemeOpalite',   mode: 'all' },
  { key: 'oxygen',   nameKey: 'colorSchemeOxygen',    mode: 'all' },
  { key: 'sakura',   nameKey: 'colorSchemeSakura',    mode: 'all' },
  { key: 'everbliss', nameKey: 'colorSchemeEverbliss', mode: 'all' },
  { key: 'aerisland', nameKey: 'colorSchemeAerisland', mode: 'all' },
  { key: 'zerith', nameKey: 'colorSchemeZerith', mode: 'all' },
  { key: 'stellula', nameKey: 'colorSchemeStellula', mode: 'all' },
  { key: 'vael', nameKey: 'colorSchemeVael', mode: 'all' },
  { key: 'twilight',   nameKey: 'colorSchemeTwilight',   mode: 'all' },
  { key: 'wilderness', nameKey: 'colorSchemeWilderness', mode: 'all' },
  { key: 'titaniumspace', nameKey: 'colorSchemeTitaniumspace', mode: 'all' },
  { key: 'sunriver', nameKey: 'colorSchemeSunriver', mode: 'all' },
  { key: 'starry', nameKey: 'colorSchemeStarry', mode: 'all' },
  { key: 'savor', nameKey: 'colorSchemeSavor', mode: 'all' },
  { key: 'sugar', nameKey: 'colorSchemeSugar', mode: 'all' },
  { key: 'salt', nameKey: 'colorSchemeSalt', mode: 'all' },
  { key: 'tundra', nameKey: 'colorSchemeTundra', mode: 'all' },
  { key: 'violet', nameKey: 'colorSchemeViolet', mode: 'all' },
  { key: 'firefly',  nameKey: 'colorSchemeFirefly',  mode: 'all' },
  { key: 'songyan', nameKey: 'colorSchemeSongyan', mode: 'all' },
  { key: 'oldmagazine', nameKey: 'colorSchemeOldmagazine', mode: 'all' },
  { key: 'lakeside', nameKey: 'colorSchemeLakeside', mode: 'all' },
  { key: 'voyage', nameKey: 'colorSchemeVoyage', mode: 'all' },
  { key: 'zine', nameKey: 'colorSchemeZine', mode: 'all', group: 'neuebrutalism' },
  { key: 'retroconsole', nameKey: 'colorSchemeRetroconsole', mode: 'all', group: 'neuebrutalism' },
  { key: 'bumblebee', nameKey: 'colorSchemeBumblebee', mode: 'all', group: 'neuebrutalism' },
  { key: 'glitch', nameKey: 'colorSchemeGlitch', mode: 'all', group: 'neuebrutalism' },
  { key: 'acid', nameKey: 'colorSchemeAcid', mode: 'all', group: 'neuebrutalism' },
];
export function getPresetsByMode(mode: ThemeMode): Preset[] {
  return presets.filter((p) => p.mode === 'all' || p.mode === mode);
}
export { getCurrentThemeMode };
export function getCustomColorKey(mode: ThemeMode): 'custom-color-light' | 'custom-color-dark' {
  return mode === 'dark' ? 'custom-color-dark' : 'custom-color-light';
}
export function getSaturationKey(mode: ThemeMode): 'saturation-light' | 'saturation-dark' {
  return mode === 'dark' ? 'saturation-dark' : 'saturation-light';
}
export function getBrightnessKey(mode: ThemeMode): 'brightness-light' | 'brightness-dark' {
  return mode === 'dark' ? 'brightness-dark' : 'brightness-light';
}
export function getFollowTimeBaseColorKey(mode: ThemeMode): 'followtime-base-color-light' | 'followtime-base-color-dark' {
  return mode === 'dark' ? 'followtime-base-color-dark' : 'followtime-base-color-light';
}
export function getInvertKey(mode: ThemeMode): 'invert-light' | 'invert-dark' {
  return mode === 'dark' ? 'invert-dark' : 'invert-light';
}
export function getHighContrastKey(mode: ThemeMode): 'highcontrast-light' | 'highcontrast-dark' {
  return mode === 'dark' ? 'highcontrast-dark' : 'highcontrast-light';
}
export function getCurrentPlan(config: Config, mode: ThemeMode): 'preset' | 'custom' | 'followtime' | 'followbanner' | 'followsystem' | 'random' {
  return mode === 'dark'
    ? (config['color-plan-dark'] ?? 'preset')
    : (config['color-plan-light'] ?? 'preset');
}
export function getPresetKey(config: Config, mode: ThemeMode): string | undefined {
  return mode === 'dark' ? config['preset-dark'] : config['preset-light'];
}
function removePaletteClasses(html: HTMLElement): void {
  const classesToRemove = Array.from(html.classList).filter((cls) => cls.startsWith('neo-palette-'));
  html.classList.remove(...classesToRemove);
}
export function applyPreset(key: string): void {
  const mode = getCurrentThemeMode();
  const html = document.documentElement;
  removePaletteClasses(html);
  html.classList.add(`neo-palette-${key}`);
  const patch: Partial<Config> = {};
  if (mode === 'dark') {
    patch['color-plan-dark'] = 'preset';
    patch['preset-dark'] = key;
  } else {
    patch['color-plan-light'] = 'preset';
    patch['preset-light'] = key;
  }
  saveConfig(patch);
}
export function destroyPaletteClasses(): void {
  const html = document.documentElement;
  removePaletteClasses(html);
}
export function applyCurrentPlan(config: Config): void {
  const mode = getCurrentThemeMode();
  const plan = getCurrentPlan(config, mode);
  const html = document.documentElement;
  removePaletteClasses(html);
  if (plan === 'preset') {
    const presetKey = getPresetKey(config, mode) ?? 'default';
    html.classList.add(`neo-palette-${presetKey}`);
  } else if (plan === 'followtime') {
    html.classList.add('neo-palette-followtime');
  } else if (plan === 'followbanner') {
    html.classList.add('neo-palette-followbanner');
  } else if (plan === 'followsystem') {
    html.classList.add('neo-palette-followsystem');
  } else if (plan === 'random') {
    html.classList.add('neo-palette-random');
  } else {
    html.classList.add('neo-palette-custom');
  }
}
