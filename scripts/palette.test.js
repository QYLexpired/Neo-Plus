import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { compile } from 'sass';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createPaletteMaps } from './palette.js';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bundle = await build({
  stdin: { contents: "export * from './src/palette/definitions'; export * from './src/palette/library';", resolveDir: root, loader: 'ts' },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const source = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const locales = Object.fromEntries(['en', 'zh-CN', 'zh-TW'].map(language => [language, JSON.parse(readFileSync(resolve(root, 'i18n', `${language}.json`), 'utf8'))]));
const fixture = () => ({
  ...source,
  presets: structuredClone(source.presets),
  presetGroups: structuredClone(source.presetGroups),
  pinnedPresetKeys: [...source.pinnedPresetKeys],
  themeModes: [...source.themeModes],
  paletteColorVariables: { ...source.paletteColorVariables },
  paletteLibrary: structuredClone(source.paletteLibrary),
});
test('generated palette maps agree with all modes, shared bindings and grouping', () => {
  const maps = createPaletteMaps(source, locales);
  for (const mode of source.themeModes) {
    for (const item of source.paletteLibrary[mode]) {
      assert.ok(maps['_librarymap.scss'].includes(`'${source.getLibraryPresetKey(item.key)}': (`));
      for (const [field, variable] of Object.entries(source.paletteColorVariables)) {
        assert.ok(maps['_librarymap.scss'].includes(`'${variable}': ${item.colors[field]},`));
      }
    }
  }
  assert.match(maps['_groupmap.scss'], /'zine': 'neuebrutalism'/);
  assert.doesNotMatch(maps['_volmap.scss'], /'zine'|'classic'|'default'|'library-/);
});
const invalidCases = [
  ['duplicate builtin key', data => { data.presets.push({ ...data.presets[0] }); }],
  ['reserved library namespace', data => { data.presets[2].key = 'library-future'; }],
  ['missing default', data => { data.presets = data.presets.filter(item => item.key !== 'default'); }],
  ['default missing a mode', data => { data.presets[0].mode = 'light'; }],
  ['unknown preset mode', data => { data.presets[2].mode = 'unknown'; }],
  ['reserved builtin group', data => { data.presets[2].group = 'library'; }],
  ['unknown preset group', data => { data.presets[2].group = 'unknown'; }],
  ['unknown pinned key', data => { data.pinnedPresetKeys.push('missing'); }],
  ['invalid group identifier', data => { data.presetGroups['invalid group'] = { ...data.presetGroups.library }; }],
  ['zero volume size', data => { data.volChunkSize = 0; }],
  ['fractional volume size', data => { data.volChunkSize = 1.5; }],
  ['duplicate mode', data => { data.themeModes.push('light'); }],
  ['missing library mode', data => { delete data.paletteLibrary.dark; }],
  ['duplicate library key', data => { data.paletteLibrary.light.push({ ...data.paletteLibrary.light[0] }); }],
  ['invalid library key', data => { data.paletteLibrary.light[0].key = 'invalid key'; }],
  ['cross source key collision', data => { data.getLibraryPresetKey = () => 'classic'; }],
  ['missing color field', data => { delete data.paletteLibrary.light[0].colors.accent; }],
  ['extra color field', data => { data.paletteLibrary.light[0].colors.extra = '#ffffff'; }],
  ['invalid color', data => { data.paletteLibrary.light[0].colors.base = 'red'; }],
  ['duplicate CSS variable binding', data => { data.paletteColorVariables.base = data.paletteColorVariables.accent; }],
  ['invalid CSS variable binding', data => { data.paletteColorVariables.base = '--invalid variable'; }],
  ['missing localized name', data => { data.paletteLibrary.light[0].nameKey = 'missingTranslation'; }],
];
for (const [name, mutate] of invalidCases) {
  test(`rejects ${name} before emitting palette maps`, () => {
    const data = fixture();
    mutate(data);
    assert.throws(() => createPaletteMaps(data, locales));
  });
}
test('the same library key can have different colors in different modes', () => {
  const data = fixture();
  data.paletteLibrary.dark[0].key = data.paletteLibrary.light[0].key;
  const maps = createPaletteMaps(data, locales);
  const key = source.getLibraryPresetKey(data.paletteLibrary.light[0].key);
  assert.equal(maps['_librarymap.scss'].split(`'${key}': (`).length - 1, 2);
});
test('missing names in any one language fail validation', () => {
  for (const language of Object.keys(locales)) {
    const missing = structuredClone(locales);
    delete missing[language][source.paletteLibrary.dark[0].nameKey];
    assert.throws(() => createPaletteMaps(source, missing), new RegExp(language));
  }
});
test('library styles compile with either mode empty or both modes empty', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'neo-palette-styles-'));
  try {
    copyFileSync(resolve(root, 'styles/palette/library.scss'), resolve(directory, 'library.scss'));
    copyFileSync(resolve(root, 'styles/palette/manager.scss'), resolve(directory, 'manager.scss'));
    for (const modes of [['light'], ['dark'], ['light', 'dark']]) {
      const data = fixture();
      for (const mode of modes) data.paletteLibrary[mode] = [];
      const maps = createPaletteMaps(data, locales);
      for (const [file, contents] of Object.entries(maps)) writeFileSync(resolve(directory, file), contents);
      const css = compile(resolve(directory, 'library.scss'), { style: 'compressed' }).css;
      assert.ok(!css.includes(':is()'));
      if (modes.length === 2) assert.equal(css, '');
      else assert.ok(css.includes('.neo-palette-library-'));
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
