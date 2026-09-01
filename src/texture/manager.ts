import { saveConfig, loadConfig, type Config } from '../main/data';
import { getCurrentThemeMode } from '../modules/thememode';
import { ensureCss, removeCssByPrefix } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { toggleCustomImage, showCustomImageSettings, applyCustomImageCss, clearCustomImageCss } from './customimage';
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
export { textures };
export function getTextureKey(mode: 'light' | 'dark'): 'texture-light' | 'texture-dark' {
  return mode === 'dark' ? 'texture-dark' : 'texture-light';
}
function buildTextureMenuItem(texture: Texture, i18n: Record<string, string>): any {
  const html = document.documentElement;
  const className = `neo-texture-${texture.key}`;
  if (texture.key === 'customimage') {
    return {
      id: `neo-texture-${texture.key}-button`,
      icon: 'iconNeoCustomImage',
      label: createSettingsMenuLabel(
        'customImage',
        i18n.textureCustomImage,
        i18n.customimageSettings,
        showCustomImageSettings,
      ),
      click: () => {
        const isCurrentlyActive = document.documentElement.classList.contains('neo-texture-customimage');
        toggleCustomImage(!isCurrentlyActive);
        return true;
      },
    };
  }
  return {
    id: `neo-texture-${texture.key}-button`,
    icon: 'iconNeoTexture',
    label: i18n[texture.nameKey],
    click: () => {
      if (html.classList.contains(className)) {
        html.classList.remove(className);
        removeCssByPrefix('texture-');
        removeTextureLayer();
        const mode = getCurrentThemeMode();
        const texKey = getTextureKey(mode);
        saveConfig({ [texKey]: 'none' } as Partial<Config>);
      } else {
        html.classList.remove(
          ...Array.from(html.classList).filter((cls) => cls.startsWith('neo-texture-'))
        );
        html.classList.add(className);
        removeCssByPrefix('texture-');
        clearCustomImageCss();
        ensureTextureLayer();
        ensureCss(`texture-${texture.key}`, featureCss[`texture-${texture.key}`]);
        const mode = getCurrentThemeMode();
        const texKey = getTextureKey(mode);
        saveConfig({ [texKey]: texture.key } as Partial<Config>);
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
export function applyTexture(config: Config): void {
  const mode = getCurrentThemeMode();
  const texKey = getTextureKey(mode);
  const textureKey = config[texKey];
  const html = document.documentElement;
  html.classList.remove(
    ...Array.from(html.classList).filter((cls) => cls.startsWith('neo-texture-'))
  );
  removeCssByPrefix('texture-');
  if (textureKey && textureKey !== 'none') {
    ensureTextureLayer();
    ensureCss(`texture-${textureKey}`, featureCss[`texture-${textureKey}`]);
  }
  if (textureKey && textureKey !== 'none') {
    if (textureKey === 'customimage') {
      html.classList.add('neo-texture-customimage');
      const currentKey = mode === 'dark' ? 'customimage-preset-current-dark' : 'customimage-preset-current-light';
      const presetName = config[currentKey as keyof Config] as string | undefined;
      if (presetName) {
        const presetKey = `customimage-preset-${presetName}` as keyof Config;
        const preset = config[presetKey] as Record<string, any> | undefined;
        if (preset && typeof preset === 'object') {
          applyCustomImageCss(preset);
        } else {
          clearCustomImageCss();
        }
      } else {
        clearCustomImageCss();
      }
    } else {
      html.classList.add(`neo-texture-${textureKey}`);
      clearCustomImageCss();
    }
  } else {
    clearCustomImageCss();
    removeTextureLayer();
  }
}
let _mutationObserver: MutationObserver | null = null;
export function initTexture(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    applyTexture(config);
    _mutationObserver = new MutationObserver(() => {
      if (!isCurrent()) return;
      loadConfig().then((config) => {
        if (!isCurrent()) return;
        applyTexture(config);
      });
    });
    _mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme-mode'],
    });
  });
}
export function destroyTexture(): void {
  removeCssByPrefix('texture-');
  const html = document.documentElement;
  html.classList.remove(
    ...Array.from(html.classList).filter((cls) => cls.startsWith('neo-texture-'))
  );
  clearCustomImageCss();
  removeTextureLayer();
  if (_mutationObserver) {
    _mutationObserver.disconnect();
    _mutationObserver = null;
  }
}
