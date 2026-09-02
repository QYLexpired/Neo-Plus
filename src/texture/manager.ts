import {
  saveConfig,
  loadConfig,
  getCustomImagePresetConfigKey,
  type Config,
  type CustomImageSource,
} from '../main/data';
import { getCurrentThemeMode } from '../modules/thememode';
import { ensureCss, removeCssByPrefix } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { showCustomImageSettings, enableCustomImage, destroyCustomImage } from './customimage';
import { ensureTextureLayer, removeTextureLayer } from './layer';
import { createSettingsMenuLabel } from '../modules/menusettings';
import { createNeoLifecycleGuard } from '../main/lifecycle';
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
export const textures = [customImageTexture, ...presetTextures];
export function getTextureKey(mode: 'light' | 'dark'): 'texture-light' | 'texture-dark' {
  return mode === 'dark' ? 'texture-dark' : 'texture-light';
}
function buildCustomImageMenuItem(i18n: Record<string, string>): any {
  return {
    id: `neo-texture-${customImageTexture.key}-button`,
    icon: 'iconNeoCustomImage',
    label: createSettingsMenuLabel(
      'customImage',
      i18n.textureCustomImage,
      i18n.customimageSettings,
      () => showCustomImageSettings(reloadAndApplyTexture),
    ),
    click: () => {
      const revision = ++textureActionRevision;
      if (neoActiveTextureKey === customImageTexture.key) {
        disableTexture();
        saveTextureSelection('none');
      } else {
        const isCurrent = createNeoLifecycleGuard();
        loadConfig().then((config) => {
          if (!isCurrent() || revision !== textureActionRevision) return;
          disableTexture();
          enableCustomImageTexture(config);
          saveTextureSelection(customImageTexture.key);
        }).catch(() => {});
      }
      return true;
    },
  };
}
function openPresetTextureSettings(texture: PresetTextureDefinition, textureLabel: string): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    loadPresetTextureSettings(config);
    showPresetTextureSettings(texture, textureLabel, () => {
      if (neoActiveTextureKey === texture.key) applyPresetTextureSettings(texture);
    });
  }).catch(() => {});
}
function buildPresetTextureMenuItem(texture: PresetTextureDefinition, i18n: Record<string, string>): any {
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
      const revision = ++textureActionRevision;
      if (neoActiveTextureKey === texture.key) {
        disableTexture();
        saveTextureSelection('none');
      } else {
        const isCurrent = createNeoLifecycleGuard();
        loadConfig().then((config) => {
          if (!isCurrent() || revision !== textureActionRevision) return;
          loadPresetTextureSettings(config);
          disableTexture();
          enablePresetTexture(texture);
          saveTextureSelection(texture.key);
        }).catch(() => {});
      }
      return true;
    },
  };
}
export function getTextureMenuItems(i18n: Record<string, string>): any[] {
  return [
    buildCustomImageMenuItem(i18n),
    { type: 'separator' },
    ...presetTextures.map(texture => buildPresetTextureMenuItem(texture, i18n)),
  ];
}
function saveTextureSelection(textureKey: string): void {
  const texKey = getTextureKey(getCurrentThemeMode());
  saveConfig({ [texKey]: textureKey } as Partial<Config>);
}
function getCustomImagePreset(config: Config): CustomImageSource | undefined {
  const mode = getCurrentThemeMode();
  const currentKey = mode === 'dark' ? 'customimage-preset-current-dark' : 'customimage-preset-current-light';
  const presetName = config[currentKey];
  if (!presetName) return undefined;
  const preset = config[getCustomImagePresetConfigKey(presetName)];
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
  const mode = getCurrentThemeMode();
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
  const isCurrent = createNeoLifecycleGuard();
  const revision = ++textureActionRevision;
  const config = await loadConfig();
  if (!isCurrent() || revision !== textureActionRevision) return;
  applyTexture(config);
}
let _mutationObserver: MutationObserver | null = null;
export function initTexture(): void {
  _mutationObserver = new MutationObserver(() => {
    reloadAndApplyTexture().catch(() => {});
  });
  _mutationObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme-mode'],
  });
  reloadAndApplyTexture().catch(() => {});
}
export function destroyTexture(): void {
  textureActionRevision++;
  disableTexture();
  if (_mutationObserver) {
    _mutationObserver.disconnect();
    _mutationObserver = null;
  }
}
