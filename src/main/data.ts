import type { Plugin } from 'siyuan';
import { getPlugin } from './context';
export const configKey = 'config';
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
export type CustomImagePresetConfigKey = `customimage-preset-${string}`;
export type PresetTextureSettingValue = string | number | boolean;
export type PresetTextureSettings = Record<string, PresetTextureSettingValue>;
export type PresetTextureSettingsMap = Record<string, PresetTextureSettings>;
export function getCustomImagePresetConfigKey(name: string): CustomImagePresetConfigKey {
  return `customimage-preset-${name}`;
}
export interface Config {
  [key: CustomImagePresetConfigKey]: CustomImageSource | string | undefined;
  'custom-color-light'?: string;
  'custom-color-dark'?: string;
  'saturation-light'?: number;
  'saturation-dark'?: number;
  'brightness-light'?: number;
  'brightness-dark'?: number;
  'invert-light'?: boolean;
  'invert-dark'?: boolean;
  'highcontrast-light'?: boolean;
  'highcontrast-dark'?: boolean;
  'preset-light'?: string;
  'preset-dark'?: string;
  'color-plan-light'?: 'preset' | 'custom' | 'followbanner' | 'followsystem' | 'random';
  'color-plan-dark'?: 'preset' | 'custom' | 'followbanner' | 'followsystem' | 'random';
  'random-scope'?: 'all' | 'preset' | 'custom';
  'random-highcontrast'?: 'random' | 'on' | 'off';
  'random-invert'?: 'random' | 'on' | 'off';
  'random-saturation-min'?: number;
  'random-saturation-max'?: number;
  'random-brightness-min'?: number;
  'random-brightness-max'?: number;
  'texture-light'?: string;
  'texture-dark'?: string;
  'texture-settings'?: PresetTextureSettingsMap;
  'customimage-info'?: string;
  'customimage-opacity'?: string;
  'customimage-blur'?: string;
  'customimage-effect'?: string;
  'customimage-x'?: string;
  'customimage-y'?: string;
  'customimage-brightness'?: string;
  'customimage-saturation'?: string;
  'customimage-contrast'?: string;
  'customimage-grayscale'?: string;
  'customimage-hue-rotate'?: string;
  'customimage-fill-mode'?: string;
  'customimage-fill-width'?: string;
  'customimage-fill-height'?: string;
  'customimage-fill-unit'?: string;
  'customimage-fill-repeat'?: string;
  'customimage-background-blend-mode'?: string;
  'customimage-zlevel'?: string;
  'customimage-layout-opacity'?: string;
  'customimage-preset-current-light'?: string;
  'customimage-preset-current-dark'?: string;
  'smoothcaret'?: boolean;
  'smoothcaret-motion'?: 'static' | 'breathing' | 'stretch';
  'smoothcaret-ease'?: 'elegant' | 'shuttle' | 'drift' | 'spring';
  'smoothcaret-style'?: 'default' | 'neon' | 'rainbow' | 'block' | 'underline';
  'fluidcursor'?: boolean;
  'fluidcursor-trail'?: boolean;
  'fluidcursor-wave'?: boolean;
  'cardsearchlist'?: boolean;
  'listbulletline'?: boolean;
  'focusblockindicator'?: boolean;
  'focusblockindicator-effect'?: 'vertical-line' | 'shadow' | 'background';
  'coloredfolders'?: boolean;
  'coloredfolders-layout'?: 'partition' | 'simple' | 'card';
  'coloredfolders-colorstyle'?: 'soft' | 'default' | 'vivid';
  'coloredfolders-initial-hue-rule'?: 'theme' | 'fixed';
  'coloredfolders-initial-hue'?: number;
  'coloredlists'?: boolean;
  'coloredlists-colorstyle'?: 'soft' | 'default' | 'vivid';
  'coloredlists-initial-hue-rule'?: 'theme' | 'fixed';
  'coloredlists-initial-hue'?: number;
  'coloredheadings'?: boolean;
  'coloredheadings-colorstyle'?: 'soft' | 'default' | 'vivid';
  'coloredheadings-initial-hue-rule'?: 'theme' | 'fixed';
  'coloredheadings-initial-hue'?: number;
  'colorfulselection'?: boolean;
  'frostedglass'?: boolean;
  'frostedglass-scope'?: 'light' | 'global';
  'verticaltabs'?: boolean;
  'verticaltabs-mode'?: 'topLeftOnly' | 'all';
  'verticaltabs-width'?: number;
  'superfusion'?: boolean;
  'superfusion-mode'?: 'blur' | 'frostedGlass' | 'liquidGlass';
  'sidebarmute'?: boolean;
  'ide'?: boolean;
  'multicolumnslashmenu'?: boolean;
  'multicolumnslashmenu-arrowkeys'?: boolean;
}
let configCache: Config = {};
let pendingLoadConfig: Promise<Config> | null = null;
let configLoaded = false;
interface ConfigSaveWaiter {
  revision: number;
  resolve: () => void;
  reject: (reason?: unknown) => void;
}
let configRevision = 0;
let persistedConfigRevision = 0;
let configSaveLoop: Promise<void> | null = null;
let configSavePlugin: Plugin | null = null;
let configSaveWaiters: ConfigSaveWaiter[] = [];
function getPluginOrNull() {
  return getPlugin();
}
function resolveConfigSaveWaiters(): void {
  const pendingWaiters: ConfigSaveWaiter[] = [];
  for (const waiter of configSaveWaiters) {
    if (waiter.revision <= persistedConfigRevision) {
      waiter.resolve();
    } else {
      pendingWaiters.push(waiter);
    }
  }
  configSaveWaiters = pendingWaiters;
}
function rejectConfigSaveWaiters(revision: number, reason: unknown): void {
  const pendingWaiters: ConfigSaveWaiter[] = [];
  for (const waiter of configSaveWaiters) {
    if (waiter.revision <= revision) {
      waiter.reject(reason);
    } else {
      pendingWaiters.push(waiter);
    }
  }
  configSaveWaiters = pendingWaiters;
}
async function ensureConfigLoaded(): Promise<void> {
  const pendingLoad = pendingLoadConfig;
  if (pendingLoad) {
    await pendingLoad;
  } else if (!configLoaded) {
    await loadConfig();
  }
  if (!configLoaded) throw new Error('Config load unavailable');
}
async function flushConfigSaves(): Promise<void> {
  try {
    while (persistedConfigRevision < configRevision) {
      let revision = configRevision;
      try {
        await ensureConfigLoaded();
        revision = configRevision;
        const snapshot = { ...configCache };
        const plugin = configSavePlugin;
        if (!plugin) throw new Error('Config save plugin unavailable');
        await plugin.saveData(configKey, snapshot);
        persistedConfigRevision = revision;
        resolveConfigSaveWaiters();
      } catch (error) {
        rejectConfigSaveWaiters(revision, error);
        if (configRevision <= revision) break;
      }
    }
  } finally {
    configSaveLoop = null;
  }
}
function enqueueConfigSave(plugin: Plugin): Promise<void> {
  configRevision += 1;
  const revision = configRevision;
  configSavePlugin = plugin;
  const result = new Promise<void>((resolve, reject) => {
    configSaveWaiters.push({ revision, resolve, reject });
  });
  result.catch(() => {});
  if (!configSaveLoop) {
    configSaveLoop = Promise.resolve().then(flushConfigSaves);
    configSaveLoop.catch(() => {});
  }
  return result;
}
export function saveConfig(patch: Partial<Config>): Promise<void> {
  const plugin = getPluginOrNull();
  if (!plugin) return Promise.resolve();
  configCache = { ...configCache, ...patch };
  return enqueueConfigSave(plugin);
}
export function loadConfig(): Promise<Config> {
  if (pendingLoadConfig) return pendingLoadConfig;
  const plugin = getPluginOrNull();
  if (!plugin) {
    pendingLoadConfig = Promise.resolve(configCache);
    pendingLoadConfig.finally(() => { pendingLoadConfig = null; });
    return pendingLoadConfig;
  }
  pendingLoadConfig = plugin.loadData(configKey).then((data: Config | null) => {
    configCache = { ...(data || {}), ...configCache };
    configLoaded = true;
    return configCache;
  }).catch(() => {
    return configCache;
  });
  pendingLoadConfig.finally(() => { pendingLoadConfig = null; });
  return pendingLoadConfig;
}
export function deleteConfigKeys(keys: string[]): Promise<void> {
  const plugin = getPluginOrNull();
  if (!plugin) return Promise.resolve();
  const nextConfig = { ...configCache } as Record<string, unknown>;
  for (const k of keys) {
    delete nextConfig[k];
  }
  configCache = nextConfig as Config;
  return enqueueConfigSave(plugin);
}
