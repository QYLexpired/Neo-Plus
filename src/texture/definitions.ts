import type { PresetTextureSettingValue } from '../main/data';
export interface TextureSettingCssBinding {
  cssVar: `--${string}`;
  toCss: (value: PresetTextureSettingValue) => string;
}
interface TextureSettingBase {
  key: string;
  labelKey: string;
  tipKey: string;
  css?: readonly TextureSettingCssBinding[];
}
export interface TextureSelectSetting extends TextureSettingBase {
  type: 'select';
  defaultValue: string;
  options: readonly {
    value: string;
    labelKey: string;
  }[];
}
export interface TextureRangeSetting extends TextureSettingBase {
  type: 'range';
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  unit: string;
}
export type TextureSettingDefinition = TextureSelectSetting | TextureRangeSetting;
export interface PresetTextureDefinition {
  key: string;
  nameKey: string;
  settings: readonly TextureSettingDefinition[];
}
const zlevelSetting: TextureSelectSetting = {
  key: 'zlevel',
  type: 'select',
  labelKey: 'presetTextureZLevel',
  tipKey: 'presetTextureZLevelTip',
  defaultValue: 'topmost',
  options: [
    { value: 'content', labelKey: 'presetTextureZLevelContent' },
    { value: 'topmost', labelKey: 'presetTextureZLevelTopmost' },
  ],
  css: [
    {
      cssVar: '--neo-texture-zlevel',
      toCss: value => value === 'content' ? '1' : '99',
    },
  ],
};
const gridSizeSetting: TextureRangeSetting = {
  key: 'size',
  type: 'range',
  labelKey: 'textureGridSize',
  tipKey: 'textureGridSizeTip',
  defaultValue: 32,
  min: 5,
  max: 100,
  step: 1,
  unit: 'px',
  css: [
    {
      cssVar: '--_texture-grid-size',
      toCss: value => `${value}px`,
    },
  ],
};
const gridLineWidthSetting: TextureRangeSetting = {
  key: 'lineWidth',
  type: 'range',
  labelKey: 'textureGridLineWidth',
  tipKey: 'textureGridLineWidthTip',
  defaultValue: 1,
  min: 0.5,
  max: 5,
  step: 0.5,
  unit: 'px',
  css: [
    {
      cssVar: '--_texture-grid-line-width',
      toCss: value => `${value}px`,
    },
  ],
};
const gridAngleSetting: TextureRangeSetting = {
  key: 'angle',
  type: 'range',
  labelKey: 'textureGridAngle',
  tipKey: 'textureGridAngleTip',
  defaultValue: 0,
  min: 0,
  max: 90,
  step: 1,
  unit: 'deg',
  css: [
    {
      cssVar: '--_texture-grid-angle',
      toCss: value => `${value}deg`,
    },
  ],
};
const checkerboardSizeSetting: TextureRangeSetting = {
  key: 'size',
  type: 'range',
  labelKey: 'textureCheckerboardSize',
  tipKey: 'textureCheckerboardSizeTip',
  defaultValue: 32,
  min: 5,
  max: 100,
  step: 1,
  unit: 'px',
  css: [
    {
      cssVar: '--_texture-checkerboard-size',
      toCss: value => `${value}px`,
    },
  ],
};
const checkerboardAngleSetting: TextureRangeSetting = {
  key: 'angle',
  type: 'range',
  labelKey: 'textureCheckerboardAngle',
  tipKey: 'textureCheckerboardAngleTip',
  defaultValue: 0,
  min: 0,
  max: 90,
  step: 1,
  unit: 'deg',
  css: [
    {
      cssVar: '--_texture-checkerboard-angle',
      toCss: value => `${value}deg`,
    },
  ],
};
const crossdotSpacingSetting: TextureRangeSetting = {
  key: 'spacing',
  type: 'range',
  labelKey: 'textureCrossdotSpacing',
  tipKey: 'textureCrossdotSpacingTip',
  defaultValue: 40,
  min: 5,
  max: 100,
  step: 1,
  unit: 'px',
  css: [
    {
      cssVar: '--_texture-crossdot-spacing',
      toCss: value => `${value}px`,
    },
  ],
};
const crossdotAngleSetting: TextureRangeSetting = {
  key: 'angle',
  type: 'range',
  labelKey: 'textureCrossdotAngle',
  tipKey: 'textureCrossdotAngleTip',
  defaultValue: 0,
  min: 0,
  max: 90,
  step: 1,
  unit: 'deg',
  css: [
    {
      cssVar: '--_texture-crossdot-angle',
      toCss: value => `${value}deg`,
    },
  ],
};
const crossdotSizeSetting: TextureRangeSetting = {
  key: 'size',
  type: 'range',
  labelKey: 'textureCrossdotSize',
  tipKey: 'textureCrossdotSizeTip',
  defaultValue: 3,
  min: 1,
  max: 10,
  step: 0.5,
  unit: 'px',
  css: [
    {
      cssVar: '--_texture-crossdot-size',
      toCss: value => `${value}px`,
    },
  ],
};
function definePresetTexture(
  key: string,
  nameKey: string,
  settings: readonly TextureSettingDefinition[] = [],
): PresetTextureDefinition {
  return {
    key,
    nameKey,
    settings: [zlevelSetting, ...settings],
  };
}
export const presetTextures: readonly PresetTextureDefinition[] = [
  definePresetTexture('newsprint', 'textureNewsprint'),
  definePresetTexture('embossedpaper', 'textureEmbossedpaper'),
  definePresetTexture('noise', 'textureNoise'),
  definePresetTexture('acrylic', 'textureAcrylic'),
  definePresetTexture('checkerboard', 'textureCheckerboard', [checkerboardSizeSetting, checkerboardAngleSetting]),
  definePresetTexture('grid', 'textureGrid', [gridSizeSetting, gridAngleSetting, gridLineWidthSetting]),
  definePresetTexture('crossdot', 'textureCrossdot', [crossdotSpacingSetting, crossdotAngleSetting, crossdotSizeSetting]),
  definePresetTexture('wood', 'textureWood'),
  definePresetTexture('camouflage', 'textureCamouflage'),
  definePresetTexture('granule', 'textureGranule'),
  definePresetTexture('feathery', 'textureFeathery'),
  definePresetTexture('velvet', 'textureVelvet'),
];
export function getPresetTextureDefinition(textureKey: string): PresetTextureDefinition | undefined {
  return presetTextures.find(texture => texture.key === textureKey);
}
