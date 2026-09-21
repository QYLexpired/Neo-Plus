import type { Config } from '../main/data';
import { getColor, getSwatches } from 'colorthief';
import { loadConfig, saveConfig } from '../main/data';
import { getPlugin } from '../main/context';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { Dialog } from '../modules/dialog';
import { fetchListener } from '../modules/fetchmonitor';
import { isMobile } from '../modules/env';
type ColorStyle = NonNullable<Config['basefollowbanner-colorstyle']>;
let colorStyle: ColorStyle = 'default';
function applySettings(): void {
  lastValidHex = null;
  scheduleExtract(0);
}
let lastValidHex: string | null = null;
let neoFeatureActive = false;
let extractTimer: ReturnType<typeof setTimeout> | null = null;
let extractFrame = 0;
let extractController: AbortController | null = null;
const mediaReadyTimeout = 10000;
function cancelExtractionWork(): void {
  if (extractTimer !== null) {
    clearTimeout(extractTimer);
    extractTimer = null;
  }
  if (extractFrame) {
    cancelAnimationFrame(extractFrame);
    extractFrame = 0;
  }
  extractController?.abort();
  extractController = null;
}
function scheduleExtract(delay = 200): void {
  if (!neoFeatureActive) return;
  cancelExtractionWork();
  extractTimer = setTimeout(() => {
    extractTimer = null;
    extractFrame = requestAnimationFrame(() => {
      extractFrame = 0;
      startBannerExtraction();
    });
  }, delay);
}
const fetchMonitor = fetchListener();
fetchMonitor.onNotify('setUILayout', () => { scheduleExtract(); });
fetchMonitor.onNotify('setBlockAttrs', () => { scheduleExtract(); });
fetchMonitor.onNotify('getDocInfo', () => {
  if (isMobile()) scheduleExtract();
});
const fallbackHex = 'var(--neo-default-base)';
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  let m = hex.match(/^#?([0-9a-fA-F]{6})$/);
  if (m) {
    return {
      r: parseInt(m[1].slice(0, 2), 16),
      g: parseInt(m[1].slice(2, 4), 16),
      b: parseInt(m[1].slice(4, 6), 16),
    };
  }
  m = hex.match(/^#?([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
  if (m) {
    return {
      r: parseInt(m[1] + m[1], 16),
      g: parseInt(m[2] + m[2], 16),
      b: parseInt(m[3] + m[3], 16),
    };
  }
  return null;
}
function parseRgb(str: string): { r: number; g: number; b: number } | null {
  const m = str.match(/rgb(a?)\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  return { r: +m[2], g: +m[3], b: +m[4] };
}
function parseColorToRGB(color: string): { r: number; g: number; b: number } | null {
  return parseHex(color) || parseRgb(color);
}
function calculateSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  return max === 0 ? 0 : delta / max;
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
function extractMainColorFromGradient(gradientString: string): string | null {
  const colorRegex = /(#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\))/g;
  const colors: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = colorRegex.exec(gradientString)) !== null) {
    colors.push(match[1]);
  }
  if (colors.length === 0) return null;
  let mostVibrant = colors[0];
  let maxSat = 0;
  for (const c of colors) {
    const rgb = parseColorToRGB(c);
    if (rgb) {
      const sat = calculateSaturation(rgb.r, rgb.g, rgb.b);
      if (sat > maxSat) {
        maxSat = sat;
        mostVibrant = c;
      }
    }
  }
  const parsed = parseColorToRGB(mostVibrant);
  return parsed ? rgbToHex(parsed.r, parsed.g, parsed.b) : null;
}
function isInvalidColor(r: number, g: number, b: number): boolean {
  return (r === 0 && g === 0 && b === 0) || (r === 255 && g === 255 && b === 255);
}
function getValidHex(hex: string | null): string | null {
  if (!hex) return null;
  const rgb = parseHex(hex);
  return rgb && !isInvalidColor(rgb.r, rgb.g, rgb.b) ? hex : null;
}
function applyColor(hex: string): void {
  document.documentElement.style.setProperty('--neo-basefollowbanner-color', hex);
}
function applyFallback(): void {
  applyColor(lastValidHex || fallbackHex);
}
function extractBackgroundColor(el: HTMLElement): string | null {
  const bgColor = getComputedStyle(el).backgroundColor || '';
  if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') return null;
  const hslMatch = bgColor.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*[\d.]+)?\s*\)/);
  if (hslMatch) {
    const s = +hslMatch[2] / 100;
    const l = +hslMatch[3] / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((+hslMatch[1] / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    const h = +hslMatch[1] / 60;
    if (h < 1) { r = c; g = x; }
    else if (h < 2) { r = x; g = c; }
    else if (h < 3) { g = c; b = x; }
    else if (h < 4) { g = x; b = c; }
    else if (h < 5) { r = x; b = c; }
    else { r = c; b = x; }
    const rgb = {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }
  const parsed = parseColorToRGB(bgColor);
  if (parsed) return rgbToHex(parsed.r, parsed.g, parsed.b);
  return null;
}
function extractGradient(background: string): string | null {
  const match = /(?:repeating-)?(?:linear|radial|conic)-gradient\(/.exec(background);
  if (!match) return null;
  let depth = 1;
  for (let index = match.index + match[0].length; index < background.length; index++) {
    if (background[index] === '(') depth += 1;
    else if (background[index] === ')') {
      depth -= 1;
      if (depth === 0) return background.slice(match.index, index + 1);
    }
  }
  return null;
}
function extractGradientColor(el: HTMLElement): string | null {
  const style = el.style;
  const bgImage = style.backgroundImage || style.background || '';
  const gradient = extractGradient(bgImage);
  return gradient ? getValidHex(extractMainColorFromGradient(gradient)) : null;
}
type BannerSource = HTMLVideoElement | HTMLImageElement;
type MediaReadyResult = 'ready' | 'failed' | 'cancelled';
interface BannerTarget {
  banner: HTMLElement | null;
  source: BannerSource | null;
  sourceUrl: string;
}
function getBannerSourceUrl(source: BannerSource | null): string {
  if (!source) return '';
  const nestedSource = source instanceof HTMLVideoElement
    ? source.querySelector<HTMLSourceElement>('source')?.getAttribute('src')
    : null;
  return source.getAttribute('src') || nestedSource || source.currentSrc || source.src || '';
}
function getBannerTarget(): BannerTarget {
  const selector = isMobile()
    ? '#editor .protyle-background__img'
    : '.layout__wnd--active > .layout-tab-container > .protyle:not(.fn__none) .protyle-background__img';
  const banner = document.querySelector<HTMLElement>(selector);
  const source = banner?.querySelector<HTMLVideoElement>('video')
    || banner?.querySelector<HTMLImageElement>('img')
    || null;
  return {
    banner,
    source,
    sourceUrl: getBannerSourceUrl(source),
  };
}
function getMediaReadyResult(source: BannerSource): MediaReadyResult | null {
  if (source instanceof HTMLImageElement && source.complete) {
    return source.naturalWidth > 0 ? 'ready' : 'failed';
  }
  if (source instanceof HTMLVideoElement) {
    if (source.error) return 'failed';
    if (source.readyState >= 2) return 'ready';
  }
  return null;
}
function waitForMediaReady(source: BannerSource, signal: AbortSignal): Promise<MediaReadyResult> {
  if (signal.aborted) return Promise.resolve('cancelled');
  const initialResult = getMediaReadyResult(source);
  if (initialResult) return Promise.resolve(initialResult);
  return new Promise((resolve) => {
    const readyEvent = source instanceof HTMLVideoElement ? 'loadeddata' : 'load';
    let timer: ReturnType<typeof setTimeout> | null = null;
    let settled = false;
    const cleanup = (): void => {
      source.removeEventListener(readyEvent, onReady);
      source.removeEventListener('error', onError);
      signal.removeEventListener('abort', onAbort);
      if (timer !== null) clearTimeout(timer);
    };
    const finish = (result: MediaReadyResult): void => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };
    const onReady = (): void => finish(getMediaReadyResult(source) || 'ready');
    const onError = (): void => finish('failed');
    const onAbort = (): void => finish('cancelled');
    source.addEventListener(readyEvent, onReady);
    source.addEventListener('error', onError);
    signal.addEventListener('abort', onAbort, { once: true });
    timer = setTimeout(() => finish('failed'), mediaReadyTimeout);
    const currentResult = getMediaReadyResult(source);
    if (currentResult) finish(currentResult);
  });
}
function isCurrentTarget(controller: AbortController, target: BannerTarget): boolean {
  if (!neoFeatureActive || controller.signal.aborted || extractController !== controller) return false;
  const current = getBannerTarget();
  return current.banner === target.banner
    && current.source === target.source
    && current.sourceUrl === target.sourceUrl;
}
async function resolveBannerColor(target: BannerTarget, signal: AbortSignal): Promise<string | null | undefined> {
  const isCurrent = createNeoLifecycleGuard();
  const style = colorStyle;
  const { banner, source } = target;
  if (!isCurrent() || signal.aborted) return undefined;
  if (!banner) return null;
  const bannerGradient = extractGradientColor(banner);
  if (bannerGradient) return bannerGradient;
  const containerColor = getValidHex(extractBackgroundColor(banner));
  if (containerColor) return containerColor;
  if (!source) return null;
  if (source instanceof HTMLImageElement) {
    const style = source.style;
    const bgImage = style.backgroundImage || style.background || '';
    const hasGradient = extractGradient(bgImage) !== null;
    const sourceGradient = extractGradientColor(source);
    if (sourceGradient) return sourceGradient;
    const sourceBackground = getValidHex(extractBackgroundColor(source));
    if (sourceBackground) return sourceBackground;
    if (hasGradient) return null;
  }
  const readyResult = await waitForMediaReady(source, signal);
  if (!isCurrent() || !neoFeatureActive || signal.aborted || readyResult === 'cancelled') return undefined;
  if (readyResult === 'failed') return null;
  try {
    if (style === 'vivid') {
      const swatches = await getSwatches(source, { ignoreWhite: true, signal });
      if (!isCurrent() || !neoFeatureActive || signal.aborted) return undefined;
      const swatch = swatches?.Vibrant ?? swatches?.LightVibrant ?? swatches?.DarkVibrant;
      const hex = getValidHex(swatch?.color.hex() ?? null);
      if (hex) return hex;
    }
    const result = await getColor(source, { ignoreWhite: true, minSaturation: 0.01, signal });
    if (!isCurrent() || !neoFeatureActive || signal.aborted) return undefined;
    if (!result) return null;
    const { r, g, b } = result.rgb();
    return isInvalidColor(r, g, b) ? null : result.hex();
  } catch {
    return null;
  }
}
async function extractBannerAverageColor(controller: AbortController, target: BannerTarget): Promise<void> {
  const isCurrent = createNeoLifecycleGuard();
  let hex: string | null | undefined;
  try {
    hex = await resolveBannerColor(target, controller.signal);
  } catch {
    hex = null;
  }
  if (!isCurrent() || hex === undefined || !isCurrentTarget(controller, target)) return;
  if (hex) {
    lastValidHex = hex;
    applyColor(hex);
  } else {
    applyFallback();
  }
}
function startBannerExtraction(): void {
  if (!neoFeatureActive) return;
  const controller = new AbortController();
  const target = getBannerTarget();
  extractController = controller;
  void extractBannerAverageColor(controller, target).finally(() => {
    if (extractController === controller) extractController = null;
  });
}
function enableBaseFollowBanner(): void {
  if (neoFeatureActive) return;
  neoFeatureActive = true;
  applyFallback();
  fetchMonitor.attach();
  scheduleExtract(500);
}
export function initBaseFollowBanner(config: Config): void {
  colorStyle = config['basefollowbanner-colorstyle'] || 'default';
  if (neoFeatureActive) {
    applySettings();
  } else {
    enableBaseFollowBanner();
  }
}
export function destroyBaseFollowBanner(): void {
  neoFeatureActive = false;
  cancelExtractionWork();
  fetchMonitor.detach();
  document.documentElement.style.removeProperty('--neo-basefollowbanner-color');
  lastValidHex = null;
}
export async function showBaseFollowBannerSettings(): Promise<void> {
  const isCurrent = createNeoLifecycleGuard();
  const plugin = getPlugin();
  if (!plugin) return;
  const config = await loadConfig();
  if (!isCurrent()) return;
  const { i18n } = plugin;
  const dialog = new Dialog({
    title: i18n.basefollowbannerSettings,
    content: `<div class="b3-dialog__content">
      <div class="config__tab-container">
        <div class="config-group">
          <div class="config-items">
            <label class="fn__flex b3-label config-item">
              <div class="fn__flex-1 config-item__main">
                <div class="config-name">${i18n.basefollowbannerColorStyle}</div>
                <div class="b3-label__text">${i18n.basefollowbannerColorStyleTip}</div>
              </div>
              <span class="fn__space"></span>
              <select class="b3-select fn__flex-center fn__size200" id="neo-basefollowbanner-colorstyle">
                <option value="default">${i18n.basefollowbannerColorStyleDefault}</option>
                <option value="vivid">${i18n.basefollowbannerColorStyleVivid}</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
    <div class="b3-dialog__action">
      <button class="b3-button b3-button--cancel" id="neo-basefollowbanner-cancel">${i18n.cancel}</button>
      <span class="fn__space"></span>
      <button class="b3-button b3-button--text" id="neo-basefollowbanner-confirm">${i18n.confirm}</button>
    </div>`,
  });
  dialog.element.classList.add('neo-settings-dialog');
  const styleSelect = dialog.element.querySelector<HTMLSelectElement>('#neo-basefollowbanner-colorstyle')!;
  styleSelect.value = config['basefollowbanner-colorstyle'] || 'default';
  dialog.element.querySelector('#neo-basefollowbanner-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-basefollowbanner-confirm')?.addEventListener('click', () => {
    if (!isCurrent()) return;
    colorStyle = styleSelect.value as ColorStyle;
    saveConfig({ 'basefollowbanner-colorstyle': colorStyle });
    if (neoFeatureActive) applySettings();
    dialog.destroy();
  });
}
