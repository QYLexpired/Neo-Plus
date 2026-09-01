import type { Plugin } from 'siyuan';
import { getPlugin } from './guard';
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
  'color-plan-light'?: 'preset' | 'custom' | 'followtime' | 'followbanner' | 'followsystem' | 'random';
  'color-plan-dark'?: 'preset' | 'custom' | 'followtime' | 'followbanner' | 'followsystem' | 'random';
  'random-scope'?: 'all' | 'preset' | 'custom';
  'random-highcontrast'?: 'random' | 'on' | 'off';
  'random-invert'?: 'random' | 'on' | 'off';
  'random-saturation-min'?: number;
  'random-saturation-max'?: number;
  'random-brightness-min'?: number;
  'random-brightness-max'?: number;
  'followtime-base-color-light'?: string;
  'followtime-base-color-dark'?: string;
  'texture-light'?: string;
  'texture-dark'?: string;
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
  'smooth-caret'?: boolean;
  'smooth-caret-motion'?: 'static' | 'breathing' | 'stretch';
  'smooth-caret-ease'?: 'elegant' | 'shuttle' | 'drift' | 'spring';
  'smooth-caret-style'?: 'default' | 'neon' | 'rainbow' | 'block' | 'underline';
  'fluid-cursor'?: boolean;
  'fluid-cursor-trail'?: boolean;
  'fluid-cursor-wave'?: boolean;
  'list-bullet-line'?: boolean;
  'focus-block-indicator'?: boolean;
  'focus-block-effect'?: 'vertical-line' | 'shadow' | 'background';
  'colored-folders'?: boolean;
  'colored-folders-style'?: 'partition' | 'simple' | 'card';
  'colored-lists'?: boolean;
  'colored-headings'?: boolean;
  'colorful-selection'?: boolean;
  'frosted-glass'?: boolean;
  'frosted-glass-scope'?: 'light' | 'global';
  'scroll-effect'?: boolean;
  'vertical-tabs'?: boolean;
  'vertical-tabs-mode'?: 'topLeftOnly' | 'all';
  'vertical-tabs-width'?: number;
  'immersive-mode'?: boolean;
  'immersive-typewriter'?: boolean;
  'immersive-highlight'?: boolean;
  'super-fusion'?: boolean;
  'super-fusion-mode'?: 'blur' | 'frostedGlass' | 'liquidGlass';
  'pinned-toolbar'?: boolean;
  'pinned-toolbar-position'?: 'top' | 'bottom' | 'left' | 'right';
  'pinned-toolbar-liquid-glass'?: boolean;
  'card-searchlist'?: boolean;
  'sidebar-mute'?: boolean;
  'ide'?: boolean;
  'multicolumn-slash-menu'?: boolean;
  'multicolumn-slash-menu-arrowkeys'?: boolean;
  'sidememo'?: boolean;
  'sidememo-position'?: 'left' | 'right';
  'sidememo-connector'?: boolean;
}
let configCache: Config = {};
let pendingLoadConfig: Promise<Config> | null = null;
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
function rejectConfigSaveWaiters(reason: unknown): void {
  const waiters = configSaveWaiters;
  configSaveWaiters = [];
  waiters.forEach((waiter) => waiter.reject(reason));
}
async function flushConfigSaves(): Promise<void> {
  try {
    while (persistedConfigRevision < configRevision) {
      const pendingLoad = pendingLoadConfig;
      if (pendingLoad) await pendingLoad;
      const revision = configRevision;
      const snapshot = { ...configCache };
      const plugin = configSavePlugin;
      if (!plugin) throw new Error('Config save plugin unavailable');
      await plugin.saveData(configKey, snapshot);
      persistedConfigRevision = revision;
      resolveConfigSaveWaiters();
    }
  } catch (error) {
    rejectConfigSaveWaiters(error);
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
