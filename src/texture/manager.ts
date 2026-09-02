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
import { getPlugin } from '../main/context';
import { Dialog } from 'siyuan';
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
type PresetTextureZLevel = 'content' | 'topmost';
let presetTextureZLevels: Record<string, PresetTextureZLevel> = {};
const presetTextureZLevelMap: Record<PresetTextureZLevel, string> = {
  content: '1',
  topmost: '99',
};
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
        () => showCustomImageSettings(reloadAndApplyTexture),
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
    label: createSettingsMenuLabel(
      `presetTexture-${texture.key}`,
      i18n[texture.nameKey],
      i18n.presetTextureSettings,
      () => showPresetTextureSettings(texture.key, i18n[texture.nameKey]),
    ),
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
function getCustomImagePreset(config: Config): CustomImageSource | undefined {
  const mode = getCurrentThemeMode();
  const currentKey = mode === 'dark' ? 'customimage-preset-current-dark' : 'customimage-preset-current-light';
  const presetName = config[currentKey];
  if (!presetName) return undefined;
  const preset = config[getCustomImagePresetConfigKey(presetName)];
  return preset && typeof preset === 'object' ? preset : undefined;
}
function getPresetTextureZLevel(textureKey: string): PresetTextureZLevel {
  return presetTextureZLevels[textureKey] === 'content' ? 'content' : 'topmost';
}
function loadPresetTextureZLevels(config: Config): void {
  const values = config['texture-zlevels'];
  presetTextureZLevels = {};
  if (!values || typeof values !== 'object') return;
  for (const [textureKey, value] of Object.entries(values)) {
    if (value === 'content' || value === 'topmost') presetTextureZLevels[textureKey] = value;
  }
}
function applyPresetTextureZLevel(textureKey: string): void {
  const zlevel = getPresetTextureZLevel(textureKey);
  document.documentElement.style.setProperty('--neo-texture-zlevel', presetTextureZLevelMap[zlevel]);
}
function enableTexture(textureKey: string, config?: Config): void {
  if (neoActiveTextureKey === textureKey) return;
  ensureTextureLayer();
  ensureCss(`texture-${textureKey}`, featureCss[`texture-${textureKey}`]);
  if (textureKey === 'customimage') {
    enableCustomImage(config ? getCustomImagePreset(config) : undefined);
  } else {
    applyPresetTextureZLevel(textureKey);
    document.documentElement.classList.add(`neo-texture-${textureKey}`);
  }
  neoActiveTextureKey = textureKey;
}
function disableTexture(): void {
  neoActiveTextureKey = null;
  destroyCustomImage();
  document.documentElement.style.removeProperty('--neo-texture-zlevel');
  removeCssByPrefix('texture-');
  document.documentElement.classList.remove(
    ...Array.from(document.documentElement.classList).filter((cls) => cls.startsWith('neo-texture-'))
  );
  removeTextureLayer();
}
export function applyTexture(config: Config): void {
  loadPresetTextureZLevels(config);
  const mode = getCurrentThemeMode();
  const texKey = getTextureKey(mode);
  const textureKey = config[texKey];
  disableTexture();
  if (textureKey && textureKey !== 'none') {
    enableTexture(textureKey, config);
  }
}
function buildPresetTextureSettingsHTML(i18n: Record<string, string>): string {
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.presetTextureZLevel}</div>
              <div class="b3-label__text">${i18n.presetTextureZLevelTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-preset-texture-zlevel">
              <option value="content">${i18n.presetTextureZLevelContent}</option>
              <option value="topmost">${i18n.presetTextureZLevelTopmost}</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-preset-texture-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-preset-texture-confirm">${i18n.confirm}</button>
  </div>`;
}
function showPresetTextureSettings(textureKey: string, textureLabel: string): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: `${plugin.i18n.presetTextureSettings} · ${textureLabel}`,
    content: buildPresetTextureSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const zlevelSelect = dialog.element.querySelector('#neo-preset-texture-zlevel') as HTMLSelectElement | null;
  if (zlevelSelect) zlevelSelect.value = getPresetTextureZLevel(textureKey);
  dialog.element.querySelector('#neo-preset-texture-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-preset-texture-confirm')?.addEventListener('click', () => {
    const zlevel: PresetTextureZLevel = zlevelSelect?.value === 'content' ? 'content' : 'topmost';
    presetTextureZLevels = { ...presetTextureZLevels, [textureKey]: zlevel };
    saveConfig({ 'texture-zlevels': { ...presetTextureZLevels } } as Partial<Config>);
    if (neoActiveTextureKey === textureKey) applyPresetTextureZLevel(textureKey);
    dialog.destroy();
  });
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
