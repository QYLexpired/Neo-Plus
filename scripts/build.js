import { compile } from 'sass';
import { build } from 'esbuild';
import { writeFileSync, unlinkSync, readdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { generatePaletteMaps } from './palette.js';
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
await generatePaletteMaps(root, stylesDir);
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
