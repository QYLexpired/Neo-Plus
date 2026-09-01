import { saveConfig, loadConfig, type Config } from '../main/data';
import { getCurrentThemeMode } from '../modules/thememode';
import { ensureCss, removeCssByPrefix } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { showCustomImageSettings, enableCustomImage, destroyCustomImage } from './customimage';
import { ensureTextureLayer, removeTextureLayer } from './layer';
import { createSettingsMenuLabel } from '../modules/menusettings';
import { createNeoLifecycleGuard } from '../main/lifecycle';
export interface Texture {
  key: string;
  nameKey: string;
}
const textures: Texture[] = [
  { key: 'newsprint', nameKey: 'textureNewsprint' },
  { key: 'embossedpaper', nameKey: 'textureEmbossedpaper' },
  { key: 'noise', nameKey: 'textureNoise' },
  { key: 'acrylic', nameKey: 'textureAcrylic' },
  { key: 'checkerboard', nameKey: 'textureCheckerboard' },
  { key: 'grid', nameKey: 'textureGrid' },
  { key: 'crossdot', nameKey: 'textureCrossdot' },
  { key: 'wood', nameKey: 'textureWood' },
  { key: 'camouflage', nameKey: 'textureCamouflage' },
  { key: 'granule', nameKey: 'textureGranule' },
  { key: 'feathery', nameKey: 'textureFeathery' },
  { key: 'velvet', nameKey: 'textureVelvet' },
  { key: 'customimage', nameKey: 'textureCustomImage' },
];
let neoActiveTextureKey: string | null = null;
let textureActionRevision = 0;
export { textures };
export function getTextureKey(mode: 'light' | 'dark'): 'texture-light' | 'texture-dark' {
  return mode === 'dark' ? 'texture-dark' : 'texture-light';
}
function buildTextureMenuItem(texture: Texture, i18n: Record<string, string>): any {
  if (texture.key === 'customimage') {
    return {
      id: `neo-texture-${texture.key}-button`,
      icon: 'iconNeoCustomImage',
      label: createSettingsMenuLabel(
        'customImage',
        i18n.textureCustomImage,
        i18n.customimageSettings,
        () => showCustomImageSettings(restoreTextureFromConfig),
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
            disableTexture();
            enableTexture(texture.key, config);
            saveTextureSelection(texture.key);
          }).catch(() => {});
        }
        return true;
      },
    };
  }
  return {
    id: `neo-texture-${texture.key}-button`,
    icon: 'iconNeoTexture',
    label: i18n[texture.nameKey],
    click: () => {
      textureActionRevision++;
      if (neoActiveTextureKey === texture.key) {
        disableTexture();
        saveTextureSelection('none');
      } else {
        disableTexture();
        enableTexture(texture.key);
        saveTextureSelection(texture.key);
      }
      return true;
    },
  };
}
export function getTextureMenuItems(i18n: Record<string, string>): any[] {
  const customimageItem = buildTextureMenuItem(
    textures.find(t => t.key === 'customimage')!,
    i18n,
  );
  const otherItems = textures
    .filter(t => t.key !== 'customimage')
    .map(t => buildTextureMenuItem(t, i18n));
  return [
    customimageItem,
    { type: 'separator' },
    ...otherItems,
  ];
}
function saveTextureSelection(textureKey: string): void {
  const texKey = getTextureKey(getCurrentThemeMode());
  saveConfig({ [texKey]: textureKey } as Partial<Config>);
}
function getCustomImagePreset(config: Config): Record<string, any> | undefined {
  const mode = getCurrentThemeMode();
  const currentKey = mode === 'dark' ? 'customimage-preset-current-dark' : 'customimage-preset-current-light';
  const presetName = config[currentKey as keyof Config] as string | undefined;
  if (!presetName) return undefined;
  const presetKey = `customimage-preset-${presetName}` as keyof Config;
  const preset = config[presetKey];
  return preset && typeof preset === 'object' ? preset as Record<string, any> : undefined;
}
function enableTexture(textureKey: string, config?: Config): void {
  if (neoActiveTextureKey === textureKey) return;
  ensureTextureLayer();
  ensureCss(`texture-${textureKey}`, featureCss[`texture-${textureKey}`]);
  if (textureKey === 'customimage') {
    enableCustomImage(config ? getCustomImagePreset(config) : undefined);
  } else {
    document.documentElement.classList.add(`neo-texture-${textureKey}`);
  }
  neoActiveTextureKey = textureKey;
}
function disableTexture(): void {
  neoActiveTextureKey = null;
  destroyCustomImage();
  removeCssByPrefix('texture-');
  document.documentElement.classList.remove(
    ...Array.from(document.documentElement.classList).filter((cls) => cls.startsWith('neo-texture-'))
  );
  removeTextureLayer();
}
export function applyTexture(config: Config): void {
  const mode = getCurrentThemeMode();
  const texKey = getTextureKey(mode);
  const textureKey = config[texKey];
  disableTexture();
  if (textureKey && textureKey !== 'none') {
    enableTexture(textureKey, config);
  }
}
function restoreTextureFromConfig(): Promise<void> {
  const isCurrent = createNeoLifecycleGuard();
  const revision = ++textureActionRevision;
  return loadConfig().then((config) => {
    if (!isCurrent() || revision !== textureActionRevision) return;
    applyTexture(config);
  });
}
let _mutationObserver: MutationObserver | null = null;
export function initTexture(): void {
  _mutationObserver = new MutationObserver(() => {
    restoreTextureFromConfig().catch(() => {});
  });
  _mutationObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme-mode'],
  });
  restoreTextureFromConfig().catch(() => {});
}
export function destroyTexture(): void {
  textureActionRevision++;
  disableTexture();
  if (_mutationObserver) {
    _mutationObserver.disconnect();
    _mutationObserver = null;
  }
}
