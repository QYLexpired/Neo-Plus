import type { Config } from '../main/data';
import { getColor } from 'colorthief';
import { fetchListener } from '../modules/fetchmonitor';
import { isMobile } from '../modules/env';
let lastValidHex: string | null = null;
let neoFeatureActive = false;
let _initTimer: ReturnType<typeof setTimeout> | null = null;
let _extractTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleExtract(): void {
  if (!neoFeatureActive) return;
  if (_extractTimer !== null) {
    clearTimeout(_extractTimer);
    _extractTimer = null;
  }
  _extractTimer = setTimeout(() => {
    _extractTimer = null;
    requestAnimationFrame(() => {
      try { extractBannerAverageColor(); } catch {}
    });
  }, 200);
}
const _fetchListener = fetchListener();
_fetchListener.onNotify('setUILayout', () => { scheduleExtract(); });
_fetchListener.onNotify('setBlockAttrs', () => { scheduleExtract(); });
_fetchListener.onNotify('getDocInfo', () => {
  if (isMobile()) scheduleExtract();
});
const fallbackHex = 'var(--neo-default-base-color)';
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
function applyColor(hex: string): void {
  document.documentElement.style.setProperty('--neo-followbanner-base-color', hex);
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
function checkElementBackgroundForGradient(el: HTMLElement): boolean {
  const style = el.style;
  const bgImage = style.backgroundImage || style.background || '';
  const gradientMatch = bgImage.match(/(?:repeating-)?(?:linear|radial|conic)-gradient\([^)]+\)/);
  if (gradientMatch) {
    const gradientHex = extractMainColorFromGradient(gradientMatch[0]);
    if (gradientHex) {
      const rgb = parseHex(gradientHex);
      if (rgb && !isInvalidColor(rgb.r, rgb.g, rgb.b) && !isNaN(rgb.r)) {
        lastValidHex = gradientHex;
        applyColor(gradientHex);
        return true;
      }
    }
  }
  return false;
}
async function extractBannerAverageColor(): Promise<void> {
  if (!neoFeatureActive) return;
  const selector = isMobile()
    ? '#editor .protyle-background__img'
    : '.layout__wnd--active > .layout-tab-container > .protyle:not(.fn__none) .protyle-background__img';
  const bannerImg = document.querySelector<HTMLElement>(selector);
  if (!bannerImg) {
    applyFallback();
    return;
  }
  if (checkElementBackgroundForGradient(bannerImg)) return;
  const containerBgHex = extractBackgroundColor(bannerImg);
  if (containerBgHex) {
    const rgb = parseHex(containerBgHex);
    if (rgb && !isInvalidColor(rgb.r, rgb.g, rgb.b) && !isNaN(rgb.r)) {
      lastValidHex = containerBgHex;
      applyColor(containerBgHex);
      return;
    }
  }
  let source: HTMLVideoElement | HTMLImageElement | null =
    bannerImg.querySelector<HTMLVideoElement>('video');
  if (!source) {
    source = bannerImg.querySelector<HTMLImageElement>('img');
  }
  if (!source) {
    applyFallback();
    return;
  }
  if (source instanceof HTMLImageElement) {
    const style = source.style;
    const bgImage = style.backgroundImage || style.background || '';
    const gradientMatch = bgImage.match(/(?:repeating-)?(?:linear|radial|conic)-gradient\([^)]+\)/);
    if (gradientMatch) {
      const gradientHex = extractMainColorFromGradient(gradientMatch[0]);
      if (gradientHex) {
        const rgb = parseHex(gradientHex);
        if (rgb && !isInvalidColor(rgb.r, rgb.g, rgb.b) && !isNaN(rgb.r)) {
          lastValidHex = gradientHex;
          applyColor(gradientHex);
          return;
        }
      }
    }
    const bgColorHex = extractBackgroundColor(source);
    if (bgColorHex) {
      const rgb = parseHex(bgColorHex);
      if (rgb && !isInvalidColor(rgb.r, rgb.g, rgb.b) && !isNaN(rgb.r)) {
        lastValidHex = bgColorHex;
        applyColor(bgColorHex);
        return;
      }
    }
    if (gradientMatch) {
      applyFallback();
      return;
    }
  }
  if (source instanceof HTMLVideoElement && source.readyState < 2) {
    try {
      await new Promise<void>((resolve) => {
        source!.addEventListener('loadeddata', () => resolve(), { once: true });
      });
    } catch {}
    if (!neoFeatureActive) return;
  }
  if (source instanceof HTMLImageElement && !source.complete) {
    try {
      await new Promise<void>((resolve) => {
        source!.addEventListener('load', () => resolve(), { once: true });
      });
    } catch {}
    if (!neoFeatureActive) return;
  }
  try {
    const result = await getColor(source, { ignoreWhite: true, minSaturation: 0.01 });
    if (!neoFeatureActive) return;
    if (!result) {
      applyFallback();
      return;
    }
    const { r, g, b } = result.rgb();
    if (isInvalidColor(r, g, b)) {
      applyFallback();
    } else {
      const hex = result.hex();
      lastValidHex = hex;
      applyColor(hex);
    }
  } catch {
    if (neoFeatureActive) applyFallback();
  }
}
function enableFollowBanner(): void {
  if (neoFeatureActive) return;
  neoFeatureActive = true;
  _fetchListener.attach();
  _initTimer = setTimeout(() => {
    _initTimer = null;
    requestAnimationFrame(() => {
      try { extractBannerAverageColor(); } catch {}
    });
  }, 500);
}
export function initFollowBanner(config: Config): void {
  enableFollowBanner();
}
export function destroyFollowBanner(): void {
  neoFeatureActive = false;
  if (_initTimer !== null) {
    clearTimeout(_initTimer);
    _initTimer = null;
  }
  if (_extractTimer !== null) {
    clearTimeout(_extractTimer);
    _extractTimer = null;
  }
  _fetchListener.detach();
  document.documentElement.style.removeProperty('--neo-followbanner-base-color');
  lastValidHex = null;
}
