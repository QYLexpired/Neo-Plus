import { build } from 'esbuild';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
export function createPaletteMaps(data, locales) {
  const { presets, presetGroups, pinnedPresetKeys, volChunkSize, themeModes, paletteColorVariables, paletteLibrary, libraryPresetPrefix, getLibraryPresetKey } = data;
  const validKey = key => typeof key === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key);
  const checkName = nameKey => {
    if (typeof nameKey !== 'string' || !/^[a-z][a-zA-Z0-9]*$/.test(nameKey)) throw new Error(`Invalid palette name key: ${nameKey}`);
    for (const [language, locale] of Object.entries(locales)) {
      if (!Object.hasOwn(locale, nameKey) || typeof locale[nameKey] !== 'string' || !locale[nameKey].trim()) {
        throw new Error(`Missing palette translation: ${language}/${nameKey}`);
      }
    }
  };
  if (!Number.isInteger(volChunkSize) || volChunkSize < 1) throw new Error('Invalid palette volume size');
  if (typeof libraryPresetPrefix !== 'string' || !libraryPresetPrefix.endsWith('-') || !validKey(libraryPresetPrefix.slice(0, -1))) throw new Error('Invalid palette library namespace');
  if (!themeModes.length || new Set(themeModes).size !== themeModes.length || !themeModes.every(validKey)) throw new Error('Invalid palette modes');
  if (!Object.keys(locales).length) throw new Error('Palette translations unavailable');
  if (Object.keys(paletteLibrary).length !== themeModes.length || themeModes.some(mode => !Array.isArray(paletteLibrary[mode]))) {
    throw new Error('Palette library modes do not match theme modes');
  }
  for (const [groupKey, group] of Object.entries(presetGroups)) {
    if (!validKey(groupKey) || typeof group.separator !== 'boolean' || typeof group.chunked !== 'boolean') throw new Error(`Invalid palette group: ${groupKey}`);
    checkName(group.nameKey);
  }
  const presetKeys = new Set();
  for (const preset of presets) {
    if (!validKey(preset.key) || preset.key.startsWith(libraryPresetPrefix) || presetKeys.has(preset.key)) {
      throw new Error(`Invalid, reserved or duplicate preset key: ${preset.key}`);
    }
    if (preset.mode !== 'all' && !themeModes.includes(preset.mode)) throw new Error(`Invalid preset mode: ${preset.key}/${preset.mode}`);
    if (preset.group !== undefined && (preset.group === 'library' || !Object.hasOwn(presetGroups, preset.group))) {
      throw new Error(`Invalid preset group: ${preset.key}/${preset.group}`);
    }
    checkName(preset.nameKey);
    presetKeys.add(preset.key);
  }
  if (!presets.some(preset => preset.key === 'default' && preset.mode === 'all')) throw new Error('Default preset must support every theme mode');
  if (new Set(pinnedPresetKeys).size !== pinnedPresetKeys.length || pinnedPresetKeys.some(key => !presetKeys.has(key))) throw new Error('Invalid pinned preset keys');
  const fields = Object.entries(paletteColorVariables);
  if (!fields.length || new Set(fields.map(([, variable]) => variable)).size !== fields.length) throw new Error('Invalid palette color bindings');
  for (const [field, variable] of fields) {
    if (!/^[a-z][a-z0-9]*$/.test(field) || !/^--[a-z0-9]+(?:-[a-z0-9]+)*$/.test(variable)) throw new Error(`Invalid palette color binding: ${field}/${variable}`);
  }
  const libraryModes = [];
  for (const mode of themeModes) {
    const keys = new Set();
    const entries = [];
    for (const { key, nameKey, colors } of paletteLibrary[mode]) {
      const presetKey = getLibraryPresetKey(key);
      if (!validKey(key) || !validKey(presetKey) || !presetKey.startsWith(libraryPresetPrefix) || presetKeys.has(presetKey) || keys.has(presetKey)) {
        throw new Error(`Invalid, conflicting or duplicate palette library key: ${mode}/${key}`);
      }
      checkName(nameKey);
      if (!colors || Object.keys(colors).length !== fields.length) throw new Error(`Invalid palette library fields: ${mode}/${key}`);
      const values = fields.map(([field, variable]) => {
        const color = colors[field];
        if (!Object.hasOwn(colors, field) || typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color)) throw new Error(`Invalid palette library color: ${mode}/${key}/${field}`);
        return `            '${variable}': ${color},`;
      });
      keys.add(presetKey);
      entries.push(`        '${presetKey}': (\n${values.join('\n')}\n        ),`);
    }
    libraryModes.push(`    '${mode}': (\n${entries.join('\n')}\n    ),`);
  }
  const volPresets = presets.filter(preset => !pinnedPresetKeys.includes(preset.key) && !preset.group);
  const volEntries = volPresets.map((preset, index) => `    '${preset.key}': ${Math.floor(index / volChunkSize) + 1},`);
  const groupEntries = presets.filter(preset => preset.group).map(preset => `    '${preset.key}': '${preset.group}',`);
  return {
    '_volmap.scss': `$palette-vol-map: (\n${volEntries.join('\n')}\n);\n`,
    '_groupmap.scss': `$palette-group-map: (\n${groupEntries.join('\n')}\n);\n`,
    '_librarymap.scss': `$palette-library: (\n${libraryModes.join('\n')}\n);\n`,
  };
}
export async function generatePaletteMaps(root, stylesDir) {
  const bundle = await build({
    stdin: {
      contents: "export * from './src/palette/definitions'; export * from './src/palette/library';",
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    target: 'node18',
  });
  const data = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
  const locales = {};
  for (const file of readdirSync(resolve(root, 'i18n')).filter(file => file.endsWith('.json')).sort()) {
    locales[file.slice(0, -5)] = JSON.parse(readFileSync(resolve(root, 'i18n', file), 'utf8'));
  }
  const maps = createPaletteMaps(data, locales);
  for (const preset of data.presets) {
    if (!existsSync(resolve(stylesDir, 'palette', `${preset.key}.scss`))) throw new Error(`Missing preset stylesheet: ${preset.key}`);
  }
  for (const [file, source] of Object.entries(maps)) writeFileSync(resolve(stylesDir, 'palette', file), source);
}
