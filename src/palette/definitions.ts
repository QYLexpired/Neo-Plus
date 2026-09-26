import type { FreeColorKey } from '../main/data';
export const themeModes = ['light', 'dark'] as const;
export type ThemeMode = typeof themeModes[number];
export type PresetMode = ThemeMode | 'all';
export const presetGroups = {
  neuebrutalism: { nameKey: 'colorSchemeGroupNeuebrutalism', icon: 'iconNeoPalette', separator: false, chunked: true },
  library: { nameKey: 'freeLibrary', icon: 'iconNeoPaletteLibrary', separator: true, chunked: false },
} as const;
export type PresetGroup = keyof typeof presetGroups;
export const volChunkSize = 10;
export const pinnedPresetKeys: readonly string[] = ['default', 'classic'];
export const paletteColorVariables: Readonly<Record<FreeColorKey, `--${string}`>> = {
  base: '--b3-theme-base',
  accent: '--b3-theme-accent',
  background: '--b3-theme-background',
  surface: '--b3-theme-surface',
  onbackground: '--b3-theme-on-background',
};
export interface Preset {
  key: string;
  nameKey: string;
  mode: PresetMode;
  group?: PresetGroup;
}
export const presets: readonly Preset[] = [
  { key: 'default', nameKey: 'colorSchemeDefault', mode: 'all' },
  { key: 'classic', nameKey: 'colorSchemeClassic', mode: 'all' },
  { key: 'meridian', nameKey: 'colorSchemeMeridian', mode: 'all' },
  { key: 'amber', nameKey: 'colorSchemeAmber', mode: 'all' },
  { key: 'dusk', nameKey: 'colorSchemeDusk', mode: 'all' },
  { key: 'gingko', nameKey: 'colorSchemeGingko', mode: 'all' },
  { key: 'lavender', nameKey: 'colorSchemeLavender', mode: 'all' },
  { key: 'midnight', nameKey: 'colorSchemeMidnight', mode: 'all' },
  { key: 'ocean', nameKey: 'colorSchemeOcean', mode: 'all' },
  { key: 'opalite', nameKey: 'colorSchemeOpalite', mode: 'all' },
  { key: 'oxygen', nameKey: 'colorSchemeOxygen', mode: 'all' },
  { key: 'sakura', nameKey: 'colorSchemeSakura', mode: 'all' },
  { key: 'everbliss', nameKey: 'colorSchemeEverbliss', mode: 'all' },
  { key: 'aerisland', nameKey: 'colorSchemeAerisland', mode: 'all' },
  { key: 'zerith', nameKey: 'colorSchemeZerith', mode: 'all' },
  { key: 'stellula', nameKey: 'colorSchemeStellula', mode: 'all' },
  { key: 'vael', nameKey: 'colorSchemeVael', mode: 'all' },
  { key: 'twilight', nameKey: 'colorSchemeTwilight', mode: 'all' },
  { key: 'wilderness', nameKey: 'colorSchemeWilderness', mode: 'all' },
  { key: 'titaniumspace', nameKey: 'colorSchemeTitaniumspace', mode: 'all' },
  { key: 'sunriver', nameKey: 'colorSchemeSunriver', mode: 'all' },
  { key: 'starry', nameKey: 'colorSchemeStarry', mode: 'all' },
  { key: 'savor', nameKey: 'colorSchemeSavor', mode: 'all' },
  { key: 'sugar', nameKey: 'colorSchemeSugar', mode: 'all' },
  { key: 'salt', nameKey: 'colorSchemeSalt', mode: 'all' },
  { key: 'tundra', nameKey: 'colorSchemeTundra', mode: 'all' },
  { key: 'violet', nameKey: 'colorSchemeViolet', mode: 'all' },
  { key: 'firefly', nameKey: 'colorSchemeFirefly', mode: 'all' },
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
