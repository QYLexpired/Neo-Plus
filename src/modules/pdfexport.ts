import { loadConfig, type Config } from '../main/data';
import { normalizeColorStyle, normalizeInitialHue, normalizeInitialHueRule } from '../appearance/color';
import { coreColorVariables, type Preset } from '../palette/definitions';
import { getCurrentPlan, getBuiltinPresets, getPresetKey } from '../palette/presets';
import { getLibraryPresets } from '../palette/library';
import { baseCss, featureCss } from './csschunks';
import { isDesktop } from './env';
interface ExportWebContents {
  id: number;
  getURL(): string;
  isDestroyed(): boolean;
  isLoadingMainFrame(): boolean;
  once(event: string, listener: () => void): void;
  removeListener(event: string, listener: () => void): void;
  executeJavaScript(code: string): Promise<unknown>;
}
interface ExportWindow {
  webContents: ExportWebContents;
}
type WindowCreatedHandler = (event: unknown, window: ExportWindow) => void;
interface ExportRemote {
  app: {
    on(event: string, listener: WindowCreatedHandler): void;
    removeListener(event: string, listener: WindowCreatedHandler): void;
  };
  getCurrentWebContents(): ExportWebContents;
}
interface PdfAppearanceSnapshot {
  classes: string[];
  styles: { key: string; css: string }[];
  variables: { name: string; value: string }[];
}
let remote: ExportRemote | null = null;
let windowCreatedHandler: WindowCreatedHandler | null = null;
let pdfExportRevision = 0;
const pendingWindows = new Map<ExportWebContents, () => void>();
function isPdfExportPage(sourceId: number): boolean {
  if (document.documentElement.hasAttribute('data-neo-pdfexport')) return false;
  if (document.documentElement.getAttribute('data-light-theme') !== 'Neo') return false;
  if (document.body?.getAttribute('data-export-pdf') !== 'true') return false;
  const parentPattern = new RegExp(`\\bparentWindowId\\s*:\\s*${sourceId}\\b`);
  return Array.from(document.scripts).some(script => parentPattern.test(script.textContent ?? ''));
}
function collectPdfAppearance(config: Config): PdfAppearanceSnapshot {
  const snapshot: PdfAppearanceSnapshot = {
    classes: ['neo-enabled', 'neo-mode-light'],
    styles: [{ key: 'base', css: baseCss }],
    variables: [],
  };
  const addPreset = (preset: Preset): void => {
    snapshot.classes.push(`neo-palette-${preset.key}`);
    if (preset.group) snapshot.classes.push(`neo-palette-group-${preset.group}`);
  };
  const plan = getCurrentPlan(config, 'light');
  if (plan !== 'free' && plan !== 'basecustom') {
    const key = plan === 'preset' ? getPresetKey(config, 'light') ?? 'default' : 'default';
    const preset = [...getBuiltinPresets('light'), ...getLibraryPresets('light')].find(item => item.key === key)!;
    addPreset(preset);
  } else {
    snapshot.classes.push(`neo-palette-${plan}`);
    if (plan === 'free') {
      snapshot.classes.push('neo-palette-default');
      const presets = config['free-presets-light'];
      const name = config['free-preset-current-light'] ?? '';
      const colors = presets && Object.prototype.hasOwnProperty.call(presets, name) ? presets[name] : undefined;
      for (const key of Object.keys(coreColorVariables) as Array<keyof typeof coreColorVariables>) {
        const value = colors?.[key];
        if (typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)) {
          snapshot.variables.push({ name: coreColorVariables[key], value });
        }
      }
    } else if (plan === 'basecustom' && config['basecustom-color-light']) {
      snapshot.variables.push({ name: '--neo-base', value: config['basecustom-color-light'] });
    }
  }
  if (plan === 'preset' || plan === 'free' || plan === 'basecustom') {
    snapshot.variables.push(
      { name: '--neo-saturation', value: String(config['saturation-light'] ?? 1) },
      { name: '--neo-brightness', value: String(config['brightness-light'] ?? 0) },
    );
    if (config['highcontrast-light'] === true) snapshot.classes.push('neo-palette-highcontrast');
  }
  for (const feature of ['coloredheadings', 'coloredlists'] as const) {
    if (config[feature] !== true) continue;
    snapshot.classes.push(`neo-${feature}`);
    snapshot.styles.push({ key: `appearance-${feature}`, css: featureCss[`appearance-${feature}`] });
    const rule = normalizeInitialHueRule(config[`${feature}-initial-hue-rule`]);
    const colorStyle = normalizeColorStyle(config[`${feature}-colorstyle`]);
    if (rule === 'accent') snapshot.classes.push(`neo-${feature}-accent`);
    if (rule === 'fixed') {
      snapshot.variables.push({ name: `--_${feature}-initial-hue`, value: String(normalizeInitialHue(config[`${feature}-initial-hue`])) });
    }
    if (colorStyle !== 'default') {
      snapshot.variables.push({ name: `--_${feature}-c`, value: colorStyle === 'soft' ? '0.05' : '0.2' });
    }
  }
  return snapshot;
}
function applyPdfAppearance(snapshot: PdfAppearanceSnapshot): void {
  const html = document.documentElement;
  if (html.hasAttribute('data-neo-pdfexport')) return;
  html.classList.add(...snapshot.classes);
  for (const { name, value } of snapshot.variables) {
    html.style.setProperty(name, value);
  }
  for (const { key, css } of snapshot.styles) {
    const style = document.createElement('style');
    style.dataset.neoCss = key;
    style.textContent = css;
    document.head.appendChild(style);
  }
  html.setAttribute('data-neo-pdfexport', 'true');
  if (!navigator.platform.includes('Mac')) return;
  const scrollbarStyle = document.createElement('style');
  scrollbarStyle.id = 'neo-hidescrollbar-style';
  scrollbarStyle.dataset.neoCss = 'modules-hidescrollbar';
  scrollbarStyle.textContent = 'body{scrollbar-width:thin!important;scrollbar-color:var(--b3-scroll-color) transparent !important}';
  document.head.appendChild(scrollbarStyle);
  for (const sheet of Array.from(document.styleSheets)) {
    const owner = sheet.ownerNode as HTMLElement | null;
    if (owner && (owner.dataset.neoCss || owner.id === 'themeStyle')) continue;
    try {
      for (let index = sheet.cssRules.length - 1; index >= 0; index--) {
        const rule = sheet.cssRules[index] as CSSStyleRule;
        if (!rule.selectorText?.includes('::-webkit-scrollbar') || rule.selectorText.includes('.exporting')) continue;
        if (rule.style.width || rule.style.height || rule.style.backgroundColor) sheet.deleteRule(index);
      }
    } catch {}
  }
}
function watchExportWindow(window: ExportWindow, bridge: ExportRemote, isCurrent: () => boolean): void {
  const contents = window.webContents;
  if (contents.isDestroyed() || pendingWindows.has(contents)) return;
  const sourceId = bridge.getCurrentWebContents().id;
  if (contents.id === sourceId) return;
  const detach = (): void => {
    pendingWindows.delete(contents);
    if (contents.isDestroyed()) return;
    contents.removeListener('did-finish-load', handleLoad);
    contents.removeListener('destroyed', detach);
  };
  const handleLoad = (): void => {
    detach();
    if (!isCurrent() || contents.isDestroyed()) return;
    try {
      const url = new URL(contents.getURL());
      if (url.origin !== location.origin || !url.pathname.startsWith('/export/temp/')) return;
      contents.executeJavaScript(`(${isPdfExportPage.toString()})(${sourceId})`).then(async matches => {
        if (matches !== true || !isCurrent() || contents.isDestroyed()) return;
        const config = await loadConfig();
        if (!isCurrent() || contents.isDestroyed()) return;
        const snapshot = collectPdfAppearance(config);
        return contents.executeJavaScript(`(${applyPdfAppearance.toString()})(${JSON.stringify(snapshot)})`);
      }).catch(() => {});
    } catch {}
  };
  pendingWindows.set(contents, detach);
  contents.once('did-finish-load', handleLoad);
  contents.once('destroyed', detach);
  if (contents.getURL() && !contents.isLoadingMainFrame()) handleLoad();
}
export function initPdfExport(): void {
  if (windowCreatedHandler) return;
  try {
    if (!isDesktop()) return;
    const bridge = require('@electron/remote') as ExportRemote;
    const revision = ++pdfExportRevision;
    const isCurrent = (): boolean => revision === pdfExportRevision && windowCreatedHandler !== null;
    windowCreatedHandler = (_event, window) => {
      if (!isCurrent()) return;
      try { watchExportWindow(window, bridge, isCurrent); } catch {}
    };
    remote = bridge;
    bridge.app.on('browser-window-created', windowCreatedHandler);
  } catch {
    destroyPdfExport();
  }
}
export function destroyPdfExport(): void {
  pdfExportRevision += 1;
  if (remote && windowCreatedHandler) {
    try { remote.app.removeListener('browser-window-created', windowCreatedHandler); } catch {}
  }
  windowCreatedHandler = null;
  remote = null;
  for (const detach of pendingWindows.values()) {
    try { detach(); } catch {}
  }
  pendingWindows.clear();
}
