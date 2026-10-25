import type { MenuItem } from 'siyuan';
import {
  saveConfig,
  loadConfig,
  getConfig,
  type Config,
  type CustomImageSource,
} from '../main/data';
import { getThemeMode } from '../modules/thememode';
import { ensureCss, removeCssByPrefix } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { showCustomImageSettings, enableCustomImage, destroyCustomImage } from './customimage';
import { ensureTextureLayer, removeTextureLayer } from './layer';
import { createSettingsMenuLabel } from '../modules/menusettings';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { closeNeoDialogs } from '../modules/dialog';
import {
  getPresetTextureDefinition,
  presetTextures,
  type PresetTextureDefinition,
} from './definitions';
import {
  applyPresetTextureSettings,
  clearAppliedPresetTextureSettings,
  loadPresetTextureSettings,
  showPresetTextureSettings,
} from './presetsettings';
const customImageTexture = {
  key: 'customimage',
  nameKey: 'textureCustomImage',
} as const;
let neoActiveTextureKey: string | null = null;
let textureActionRevision = 0;
function createTextureActionGuard(): () => boolean {
  closeNeoDialogs('texture');
  const isCurrent = createNeoLifecycleGuard();
  const mode = getThemeMode();
  const revision = ++textureActionRevision;
  return () => isCurrent() && revision === textureActionRevision && getThemeMode() === mode;
}
export const textures = [customImageTexture, ...presetTextures];
export function getTextureKey(mode: 'light' | 'dark'): 'texture-light' | 'texture-dark' {
  return mode === 'dark' ? 'texture-dark' : 'texture-light';
}
function buildCustomImageMenuItem(i18n: Record<string, string>): MenuItem {
  return {
    id: `neo-texture-${customImageTexture.key}-button`,
    icon: 'iconNeoCustomImage',
    label: createSettingsMenuLabel(
      'customImage',
      i18n.textureCustomImage,
      i18n.customimageSettings,
      () => showCustomImageSettings(),
    ),
    click: () => {
      const canApply = createTextureActionGuard();
      if (neoActiveTextureKey === customImageTexture.key) {
        disableTexture();
        saveTextureSelection('none');
      } else {
        loadConfig().then(() => {
          if (!canApply()) return;
          disableTexture();
          enableCustomImageTexture(getConfig());
          saveTextureSelection(customImageTexture.key);
        }).catch(() => {});
      }
      return true;
    },
  };
}
function openPresetTextureSettings(texture: PresetTextureDefinition, textureLabel: string): Promise<void> {
  return showPresetTextureSettings(texture, textureLabel, () => {
    if (neoActiveTextureKey === texture.key) applyPresetTextureSettings(texture);
  });
}
function buildPresetTextureMenuItem(texture: PresetTextureDefinition, i18n: Record<string, string>): MenuItem {
  return {
    id: `neo-texture-${texture.key}-button`,
    icon: 'iconNeoTexture',
    label: createSettingsMenuLabel(
      `presetTexture-${texture.key}`,
      i18n[texture.nameKey],
      i18n.presetTextureSettings,
      () => openPresetTextureSettings(texture, i18n[texture.nameKey]),
    ),
    click: () => {
      const canApply = createTextureActionGuard();
      if (neoActiveTextureKey === texture.key) {
        disableTexture();
        saveTextureSelection('none');
      } else {
        loadConfig().then(() => {
          if (!canApply()) return;
          loadPresetTextureSettings(getConfig());
          disableTexture();
          enablePresetTexture(texture);
          saveTextureSelection(texture.key);
        }).catch(() => {});
      }
      return true;
    },
  };
}
export function getTextureMenuItems(i18n: Record<string, string>): MenuItem[] {
  return [
    buildCustomImageMenuItem(i18n),
    { type: 'separator' },
    ...presetTextures.map(texture => buildPresetTextureMenuItem(texture, i18n)),
  ];
}
function saveTextureSelection(textureKey: string): void {
  const texKey = getTextureKey(getThemeMode());
  saveConfig({ [texKey]: textureKey });
}
function getCustomImagePreset(config: Config): CustomImageSource | undefined {
  const mode = getThemeMode();
  const currentKey = mode === 'dark' ? 'customimage-preset-current-dark' : 'customimage-preset-current-light';
  const presetName = config[currentKey];
  if (!presetName) return undefined;
  const presets = config[`customimage-presets-${mode}`];
  const preset = presets && typeof presets === 'object'
    ? presets[presetName]
    : undefined;
  return preset && typeof preset === 'object' ? preset : undefined;
}
function enablePresetTexture(texture: PresetTextureDefinition): void {
  if (neoActiveTextureKey === texture.key) return;
  ensureTextureLayer();
  ensureCss(`texture-${texture.key}`, featureCss[`texture-${texture.key}`]);
  applyPresetTextureSettings(texture);
  document.documentElement.classList.add(`neo-texture-${texture.key}`);
  neoActiveTextureKey = texture.key;
}
function enableCustomImageTexture(config: Config): void {
  if (neoActiveTextureKey === customImageTexture.key) return;
  ensureTextureLayer();
  ensureCss(`texture-${customImageTexture.key}`, featureCss[`texture-${customImageTexture.key}`]);
  enableCustomImage(getCustomImagePreset(config));
  neoActiveTextureKey = customImageTexture.key;
}
function disableTexture(): void {
  neoActiveTextureKey = null;
  destroyCustomImage();
  clearAppliedPresetTextureSettings();
  removeCssByPrefix('texture-');
  document.documentElement.classList.remove(
    ...Array.from(document.documentElement.classList).filter((cls) => cls.startsWith('neo-texture-'))
  );
  removeTextureLayer();
}
export function applyTexture(config: Config): void {
  loadPresetTextureSettings(config);
  const mode = getThemeMode();
  const texKey = getTextureKey(mode);
  const textureKey = config[texKey];
  disableTexture();
  if (!textureKey || textureKey === 'none') return;
  if (textureKey === customImageTexture.key) {
    enableCustomImageTexture(config);
    return;
  }
  const texture = getPresetTextureDefinition(textureKey);
  if (texture) enablePresetTexture(texture);
}
async function reloadAndApplyTexture(): Promise<void> {
  const canApply = createTextureActionGuard();
  await loadConfig();
  if (!canApply()) return;
  applyTexture(getConfig());
}
let mutationObserver: MutationObserver | null = null;
export function initTexture(): Promise<void> {
  if (mutationObserver) return reloadAndApplyTexture();
  mutationObserver = new MutationObserver(() => {
    reloadAndApplyTexture().catch(() => {});
  });
  mutationObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme-mode'],
  });
  return reloadAndApplyTexture();
}
export function destroyTexture(): void {
  closeNeoDialogs('texture');
  textureActionRevision++;
  disableTexture();
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
}
