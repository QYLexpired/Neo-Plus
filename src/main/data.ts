import { getPlugin } from './guard';
export const configKey = 'config';
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
  'preset-light'?: string;
  'preset-dark'?: string;
  'color-plan-light'?: 'preset' | 'custom' | 'followtime' | 'followbanner' | 'followsystem' | 'random';
  'color-plan-dark'?: 'preset' | 'custom' | 'followtime' | 'followbanner' | 'followsystem' | 'random';
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
function getPluginOrNull() {
  return getPlugin();
}
export async function saveConfig(patch: Partial<Config>): Promise<void> {
  const plugin = getPluginOrNull();
  if (!plugin) return;
  configCache = { ...configCache, ...patch };
  await plugin.saveData(configKey, configCache);
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
export async function deleteConfigKeys(keys: string[]): Promise<void> {
  const plugin = getPluginOrNull();
  if (!plugin) return;
  for (const k of keys) {
    delete (configCache as Record<string, any>)[k];
  }
  await plugin.saveData(configKey, configCache);
}
