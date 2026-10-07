import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const files = [
  'i18n',
  'icon.png',
  'preview.png',
  'index.css',
  'index.js',
  'plugin.json',
  'README.zh-CN.md',
  'README.zh-TW.md',
  'README.md'
];
for (const file of files) {
  const fullPath = resolve(root, file);
  if (!existsSync(fullPath)) {
    console.error(`Error: ${file} not found at ${fullPath}`);
    process.exit(1);
  }
}
rmSync(resolve(root, 'package.zip'), { force: true });
console.log('Creating package.zip...');
execSync(`zip -r package.zip ${files.join(' ')}`, { cwd: root, stdio: 'inherit' });
console.log('Package created: package.zip');
