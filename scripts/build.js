import { compile } from 'sass';
import { build } from 'esbuild';
import { writeFileSync, unlinkSync, readdirSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const codegenEntry = resolve(__dirname, 'liquidglass.ts');
const codegenOut = resolve(__dirname, '.gen-liquidglass.mjs');
await build({
  entryPoints: [codegenEntry],
  outfile: codegenOut,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
});
await import(pathToFileURL(codegenOut).href);
unlinkSync(codegenOut);
const stylesDir = resolve(root, 'styles');
const presetsSource = readFileSync(resolve(root, 'src/palette/presets.ts'), 'utf8');
const presetEntryRegex = /\{\s*key:\s*'([a-z0-9-]+)'[^}]*\}/g;
const presetKeys = [];
const presetGroupMap = new Map();
let entryMatch;
while ((entryMatch = presetEntryRegex.exec(presetsSource)) !== null) {
  const key = entryMatch[1];
  presetKeys.push(key);
  const groupMatch = entryMatch[0].match(/group:\s*'([a-z0-9-]+)'/);
  if (groupMatch) {
    presetGroupMap.set(key, groupMatch[1]);
  }
}
const pinnedKeys = ['default', 'classic'];
const volKeys = presetKeys.filter((k) => !pinnedKeys.includes(k) && !presetGroupMap.has(k));
const sizeMatch = presetsSource.match(/volChunkSize\s*=\s*(\d+)/);
const volChunkSize = sizeMatch ? Number(sizeMatch[1]) : 10;
const volEntries = [];
for (let i = 0; i < volKeys.length; i += volChunkSize) {
  const vol = Math.floor(i / volChunkSize) + 1;
  const chunk = volKeys.slice(i, i + volChunkSize);
  for (const key of chunk) {
    volEntries.push(`    '${key}': ${vol},`);
  }
}
const volmapSource = `$palette-vol-map: (
${volEntries.join('\n')}
);
`;
writeFileSync(resolve(stylesDir, 'palette/_volmap.scss'), volmapSource);
const groupEntries = [];
for (const [key, group] of presetGroupMap) {
  groupEntries.push(`    '${key}': '${group}',`);
}
const groupmapSource = `$palette-group-map: (
${groupEntries.join('\n')}
);
`;
writeFileSync(resolve(stylesDir, 'palette/_groupmap.scss'), groupmapSource);
function scanFeatureEntries(dir, prefix) {
  const files = readdirSync(resolve(stylesDir, dir)).sort().filter((f) => {
    if (!f.endsWith('.scss')) return false;
    if (f.startsWith('_')) return false;
    if (f === 'manager.scss') return false;
    return true;
  });
  return files.map((f) => {
    const name = f.slice(0, -5);
    const key = files.length === 1 ? prefix : `${prefix}-${name}`;
    return [key, `${dir}/${f}`];
  });
}
const featureEntries = [
  ...scanFeatureEntries('appearance', 'appearance'),
  ...scanFeatureEntries('extension', 'extension'),
  ...scanFeatureEntries('interface', 'interface'),
  ...scanFeatureEntries('texture', 'texture'),
];
const featureCss = {};
for (const [key, rel] of featureEntries) {
  const scssPath = resolve(stylesDir, rel);
  const result = compile(scssPath, { style: 'compressed' });
  featureCss[key] = result.css;
}
const baseCss = [
  compile(resolve(stylesDir, 'modules/_index.scss'), { style: 'compressed' }).css,
  compile(resolve(stylesDir, 'palette/_index.scss'), { style: 'compressed' }).css,
].join('');
const chunkSource = `export const baseCss: string = ${JSON.stringify(baseCss)};
export const featureCss: Record<string, string> = ${JSON.stringify(featureCss)};
`;
writeFileSync(resolve(root, 'src/modules/csschunks.ts'), chunkSource);
writeFileSync(resolve(root, 'index.css'), '');
console.log(`Build complete: ${Object.keys(featureCss).length} css chunks + base`);
const tsEntry = resolve(root, 'src/index.ts');
const jsOut = resolve(root, 'index.js');
await build({
  entryPoints: [tsEntry],
  outfile: jsOut,
  bundle: true,
  format: 'cjs',
  platform: 'neutral',
  mainFields: ['module', 'main'],
  external: ['siyuan'],
  target: 'es2020',
  minify: true,
});
console.log('Build complete: index.js');
