import { showMessage, type Plugin } from 'siyuan';
import { getPlugin } from './context';
import { createNeoLifecycleGuard } from './lifecycle';
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
export type PresetTextureSettingValue = string | number | boolean;
export type PresetTextureSettings = Record<string, PresetTextureSettingValue>;
export type PresetTextureSettingsMap = Record<string, PresetTextureSettings>;
export type FreeColorKey = 'base' | 'accent' | 'background' | 'surface' | 'onbackground';
export type FreeColors = Partial<Record<FreeColorKey, string>>;
export interface Config {
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
  'free-presets-light'?: Record<string, FreeColors>;
  'free-presets-dark'?: Record<string, FreeColors>;
  'free-preset-current-light'?: string;
  'free-preset-current-dark'?: string;
  'preset-light'?: string;
  'preset-dark'?: string;
  'color-plan-light'?: 'preset' | 'custom' | 'followbanner' | 'followsystem' | 'random' | 'free';
  'color-plan-dark'?: 'preset' | 'custom' | 'followbanner' | 'followsystem' | 'random' | 'free';
  'random-scope'?: Array<'preset' | 'free' | 'custom' | 'library'>;
  'random-highcontrast'?: 'random' | 'on' | 'off';
  'random-invert'?: 'random' | 'on' | 'off';
  'random-saturation-min'?: number;
  'random-saturation-max'?: number;
  'random-brightness-min'?: number;
  'random-brightness-max'?: number;
  'texture-light'?: string;
  'texture-dark'?: string;
  'texture-settings'?: PresetTextureSettingsMap;
  'customimage-presets-light'?: Record<string, CustomImageSource>;
  'customimage-presets-dark'?: Record<string, CustomImageSource>;
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
  'coloredfolders-initial-hue-rule'?: 'theme' | 'fixed' | 'accent';
  'coloredfolders-initial-hue'?: number;
  'coloredlists'?: boolean;
  'coloredlists-colorstyle'?: 'soft' | 'default' | 'vivid';
  'coloredlists-initial-hue-rule'?: 'theme' | 'fixed' | 'accent';
  'coloredlists-initial-hue'?: number;
  'coloredheadings'?: boolean;
  'coloredheadings-outline'?: boolean;
  'coloredheadings-colorstyle'?: 'soft' | 'default' | 'vivid';
  'coloredheadings-initial-hue-rule'?: 'theme' | 'fixed' | 'accent';
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
export type ConfigSaveResult = 'saved' | 'temporary' | false;
let configCache: Config = {};
let configFileContent: string | null = null;
const configKeyRevisions = new Map<keyof Config, number>();
let pendingLoadConfig: Promise<Config> | null = null;
let configLoaded = false;
interface ConfigSaveWaiter {
  revision: number;
  resolve: (result: ConfigSaveResult) => void;
  isCurrent: () => boolean;
}
let configRevision = 0;
let persistedConfigRevision = 0;
let configSaveLoop: Promise<void> | null = null;
let configSaveTimer: ReturnType<typeof setTimeout> | null = null;
let configSavePlugin: Plugin | null = null;
let configSaveWaiters: ConfigSaveWaiter[] = [];
function serializeConfig(value: unknown): string {
  return JSON.stringify(value, (_, item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    return Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]]));
  });
}
function getPluginOrNull() {
  return getPlugin();
}
function resolveConfigSaveWaiters(revision: number, result: ConfigSaveResult): void {
  const pendingWaiters: ConfigSaveWaiter[] = [];
  for (const waiter of configSaveWaiters) {
    if (waiter.revision <= revision) {
      waiter.resolve(result);
    } else {
      pendingWaiters.push(waiter);
    }
  }
  configSaveWaiters = pendingWaiters;
}
async function flushConfigSaves(): Promise<void> {
  try {
    while (persistedConfigRevision < configRevision && configSaveTimer === null) {
      let revision = configRevision;
      try {
        await readConfig();
        if (persistedConfigRevision >= configRevision || configSaveTimer !== null) break;
        revision = configRevision;
        const snapshot = { ...configCache };
        const content = serializeConfig(snapshot);
        const plugin = configSavePlugin;
        if (!plugin) throw new Error('Config save plugin unavailable');
        await plugin.saveData(configKey, snapshot);
        configFileContent = content;
        persistedConfigRevision = revision;
        for (const [key, changedAt] of configKeyRevisions) {
          if (changedAt <= revision) configKeyRevisions.delete(key);
        }
        resolveConfigSaveWaiters(revision, 'saved');
      } catch {
        const plugin = configSavePlugin;
        if (plugin && configSaveWaiters.some(waiter => waiter.revision <= revision && waiter.isCurrent())) {
          showMessage(plugin.i18n.configSaveFailed);
        }
        resolveConfigSaveWaiters(revision, 'temporary');
        if (configRevision <= revision) break;
      }
    }
  } finally {
    configSaveLoop = null;
  }
}
function enqueueConfigSave(plugin: Plugin, keys: Array<keyof Config>, delay = 0): Promise<ConfigSaveResult> {
  configRevision += 1;
  const revision = configRevision;
  keys.forEach(key => configKeyRevisions.set(key, revision));
  configSavePlugin = plugin;
  const result = new Promise<ConfigSaveResult>((resolve) => {
    configSaveWaiters.push({ revision, resolve, isCurrent: createNeoLifecycleGuard() });
  });
  if (configSaveTimer !== null) clearTimeout(configSaveTimer);
  if (delay > 0) configSaveTimer = setTimeout(flushConfigSave, delay);
  else flushConfigSave();
  return result;
}
export function flushConfigSave(): void {
  if (configSaveTimer !== null) {
    clearTimeout(configSaveTimer);
    configSaveTimer = null;
  }
  if (configSaveLoop || configSaveWaiters.length === 0) return;
  configSaveLoop = Promise.resolve().then(flushConfigSaves);
  configSaveLoop.catch(() => {});
}
export function saveConfig(patch: Partial<Config>, delay = 0): Promise<ConfigSaveResult> {
  const plugin = getPluginOrNull();
  if (!plugin) return Promise.resolve(false);
  configCache = { ...configCache, ...patch };
  return enqueueConfigSave(plugin, Object.keys(patch) as Array<keyof Config>, delay);
}
export async function saveConfigIfUnchanged(patch: Partial<Config>, expected: Partial<Config>): Promise<ConfigSaveResult> {
  await loadConfig();
  if (!configLoaded) throw new Error('Config load unavailable');
  if (!getPluginOrNull() || (Object.keys(expected) as Array<keyof Config>).some(key => configCache[key] !== expected[key])) return false;
  return saveConfig(patch);
}
export function getConfig(): Config {
  return configCache;
}
function readConfig(): Promise<Config> {
  if (pendingLoadConfig) return pendingLoadConfig;
  const plugin = getPluginOrNull();
  if (!plugin) return Promise.reject(new Error('Config load unavailable'));
  pendingLoadConfig = plugin.loadData(configKey).then((data: Config | null) => {
    const loaded = { ...(data || {}) };
    const content = serializeConfig(loaded);
    if (configFileContent === content) return configCache;
    if (configFileContent !== null) {
      configKeyRevisions.clear();
      persistedConfigRevision = configRevision;
      resolveConfigSaveWaiters(configRevision, false);
    }
    configFileContent = content;
    for (const key of Object.keys(loaded) as Array<keyof Config>) {
      if (serializeConfig(loaded[key]) === serializeConfig(configCache[key])) {
        Object.assign(loaded, { [key]: configCache[key] });
      }
    }
    for (const key of configKeyRevisions.keys()) {
      if (Object.prototype.hasOwnProperty.call(configCache, key)) {
        Object.assign(loaded, { [key]: configCache[key] });
      } else {
        delete loaded[key];
      }
    }
    configCache = loaded;
    configLoaded = true;
    return configCache;
  }).finally(() => { pendingLoadConfig = null; });
  return pendingLoadConfig;
}
export function loadConfig(): Promise<Config> {
  if (configLoaded && configSaveLoop && !pendingLoadConfig) return Promise.resolve(configCache);
  return readConfig().catch(() => configCache);
}
export function deleteConfigKeys(keys: string[]): Promise<ConfigSaveResult> {
  const plugin = getPluginOrNull();
  if (!plugin) return Promise.resolve(false);
  const nextConfig = { ...configCache } as Record<string, unknown>;
  for (const k of keys) {
    delete nextConfig[k];
  }
  configCache = nextConfig as Config;
  return enqueueConfigSave(plugin, keys as Array<keyof Config>);
}
