import { isMobile } from '../modules/env';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { saveConfig, loadConfig, getConfig, type Config } from '../main/data';
import { getPlugin } from '../main/context';
import { Dialog } from '../modules/dialog';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { getThemeMode } from '../modules/thememode';
type WaveRefraction = {
  element: HTMLDivElement;
  filter: SVGFilterElement;
  image: SVGFEImageElement;
  displacements: SVGFEDisplacementMapElement[];
  frame: number;
  isCurrent: () => boolean;
};
type WaveDisplacementMap = { url: string; loaded: boolean; ready: Promise<boolean>; cancel: () => void };
type FluidCursorWave = { x: number; y: number; startTime: number; scale: number; strength: number; refraction: WaveRefraction | null };
type WaveGeometryPoint = { offset: number; radius: number; x: number; y: number; edge: number };
type FluidCursorTrailPoint = { x: number; y: number; angle: number; pressure: number; turn: number };
type FluidCursorTrailEdgePoint = { x: number; y: number };
type FluidCursorRainbowPoint = { x: number; y: number; distance: number };
let animationFrameId: number | null = null;
let resizeHandler: (() => void) | null = null;
let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
let mouseDownHandler: ((e: MouseEvent) => void) | null = null;
let mouseUpHandler: ((e: MouseEvent) => void) | null = null;
let mouseLeaveHandler: (() => void) | null = null;
let waveBlurHandler: (() => void) | null = null;
let hideCursorTimeout: number | null = null;
let points: FluidCursorTrailPoint[] = [];
let mouse = { x: -100, y: -100 };
let lastTime = 0;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let isFirstMouseMove = true;
let isMouseDown = false;
let isShrinking = false;
let shrinkStartTime = 0;
let waves: FluidCursorWave[] = [];
const wavePresses = new Map<number, number>();
let waveSurface: HTMLCanvasElement | null = null;
let waveContext: CanvasRenderingContext2D | null = null;
let wavePixels: ImageData | null = null;
let waveGeometry: WaveGeometryPoint[] = [];
let waveColorSource = '';
let waveColorValues: Uint8ClampedArray | null = null;
const pendingDisplacementMaps = new Set<WaveDisplacementMap>();
let waveFilters: SVGSVGElement | null = null;
let waveFilterDefinitions: SVGDefsElement | null = null;
let waveMapSurface: HTMLCanvasElement | null = null;
let waveMapContext: CanvasRenderingContext2D | null = null;
let waveMapPixels: ImageData | null = null;
const waveMaps = new Map<number, WaveDisplacementMap>();
let waveSequence = 0;
let currentHueOffset = 0;
let targetHueOffset = 0;
let cachedDisplayColor = '#f44336';
let cachedBaseColor = '';
let rainbowSurface: HTMLCanvasElement | null = null;
let rainbowContext: CanvasRenderingContext2D | null = null;
let rainbowColorSource = '';
let rainbowColors: string[] = [];
let gildedSurface: HTMLCanvasElement | null = null;
let gildedPattern: CanvasPattern | null = null;
let gildedColorSource = '';
let lastColorFetchTime = 0;
const colorRefreshInterval = 500;
const trailResetInterval = 200;
const waveDuration = 1;
const waveRadius = 36;
const waveMapFrames = 30;
const waveDispersion = 0.16;
let trailOn = true;
let trailColor: NonNullable<Config['fluidcursor-trail-color']> = 'aurora';
let waveOn = true;
let syncFluidCursorOptions: (() => void) | null = null;
let neoFeatureActive = false;
let configRevision = 0;
function normalizeFluidCursorTrailColor(value: unknown): typeof trailColor {
  return value === 'ink' || value === 'rainbow' || value === 'neon' || value === 'gilded' ? value : 'aurora';
}
function clearHideCursorTimeout(): void {
  if (hideCursorTimeout === null) return;
  clearTimeout(hideCursorTimeout);
  hideCursorTimeout = null;
}
function getCursorColor(): string {
  const computedStyle = getComputedStyle(document.documentElement);
  const color = computedStyle.getPropertyValue('--b3-theme-base').trim();
  return color || '#6a85e3';
}
function refreshBaseColor(force: boolean = false): string {
  const now = performance.now();
  if (force || !cachedBaseColor || now - lastColorFetchTime >= colorRefreshInterval) {
    cachedBaseColor = getCursorColor();
    lastColorFetchTime = now;
  }
  return cachedBaseColor;
}
function updateDisplayColor(): void {
  if (trailColor === 'ink') {
    cachedDisplayColor = getComputedStyle(document.documentElement).getPropertyValue('--b3-theme-on-background').trim();
    return;
  }
  const baseColor = refreshBaseColor();
  if (trailColor === 'rainbow' || trailColor === 'neon' || trailColor === 'gilded') {
    cachedDisplayColor = baseColor;
    return;
  }
  cachedDisplayColor = `oklch(from ${baseColor} l c calc(h + ${currentHueOffset}))`;
}
function randomCursorColor(): void {
  if (trailColor !== 'aurora') return;
  const modeRand = Math.random();
  let randomHue: number;
  if (modeRand < 0.10) {
    const rand = Math.random();
    if (rand < 0.8) {
      randomHue = Math.floor(Math.random() * 31) - 15;
    } else if (rand < 0.9) {
      const sign = Math.random() < 0.5 ? -1 : 1;
      randomHue = sign * (Math.floor(Math.random() * 31) + 30);
    } else {
      const sign = Math.random() < 0.5 ? -1 : 1;
      randomHue = sign * (Math.floor(Math.random() * 91) + 90);
    }
    currentHueOffset = randomHue;
    targetHueOffset = randomHue;
  } else {
    const rand = Math.random();
    if (rand < 0.6) {
      randomHue = Math.floor(Math.random() * 31) - 15;
    } else if (rand < 0.8) {
      const sign = Math.random() < 0.5 ? -1 : 1;
      randomHue = sign * (Math.floor(Math.random() * 31) + 30);
    } else {
      const sign = Math.random() < 0.5 ? -1 : 1;
      randomHue = sign * (Math.floor(Math.random() * 91) + 90);
    }
    targetHueOffset = randomHue;
  }
}
function getTrailAngleDelta(from: number, to: number): number {
  const angle = (to - from) * 2;
  return Math.atan2(Math.sin(angle), Math.cos(angle)) / 2;
}
function advanceFluidCursorTrail(deltaTime: number, shrinkProgress: number, targetPressure: number): void {
  if (points.length < 2 || deltaTime <= 0) return;
  const head = points[0];
  const dx = mouse.x - head.x;
  const dy = mouse.y - head.y;
  const timeFactor = Math.min(deltaTime * 60, 3);
  const turnEase = 1 - Math.exp(-deltaTime / 0.04);
  const neckX = head.x - points[1].x;
  const neckY = head.y - points[1].y;
  const neckLength = Math.hypot(dx, dy) * Math.hypot(neckX, neckY);
  const headTurn = neckLength > 0.25 ? (1 - Math.max(-1, Math.min(1, (dx * neckX + dy * neckY) / neckLength))) / 2 : 0;
  head.turn += (headTurn - head.turn) * turnEase;
  if (!isShrinking) {
    if (dx * dx + dy * dy > 0.04) {
      const direction = Math.atan2(dy, dx) * 2;
      const angle = Math.atan2(1.6 + Math.sin(direction), Math.cos(direction)) / 2;
      head.angle += getTrailAngleDelta(head.angle, angle) * (1 - Math.exp(-deltaTime / 0.065));
    }
    head.pressure += (targetPressure - head.pressure) * (1 - Math.exp(-deltaTime / 0.055));
  }
  const headEase = 1 - Math.pow(1 - 0.9, timeFactor);
  head.x += dx * headEase;
  head.y += dy * headEase;
  const settle = 1 - 0.2 * shrinkProgress * shrinkProgress * (3 - 2 * shrinkProgress);
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const previous = points[index - 1];
    const next = points[index + 1];
    const dx = previous.x - point.x;
    const dy = previous.y - point.y;
    let turn = 0;
    if (next) {
      const tailX = point.x - next.x;
      const tailY = point.y - next.y;
      const length = Math.hypot(dx, dy) * Math.hypot(tailX, tailY);
      if (length > 0.25) turn = (1 - Math.max(-1, Math.min(1, (dx * tailX + dy * tailY) / length))) / 2;
    }
    point.turn += (Math.max(turn, head.turn) - point.turn) * turnEase;
    const tailEase = 1 - Math.pow(1 - 0.4, timeFactor / ((1 + point.turn * 0.3) * settle));
    point.x += dx * tailEase;
    point.y += dy * tailEase;
    if (!isShrinking) {
      point.angle += getTrailAngleDelta(point.angle, previous.angle) * tailEase;
      point.pressure += (previous.pressure - point.pressure) * tailEase;
    }
  }
}
function releaseGildedTrail(): void {
  if (gildedSurface) {
    if (ctx) ctx.fillStyle = cachedDisplayColor;
    gildedSurface.width = 0;
    gildedSurface.height = 0;
  }
  gildedSurface = null;
  gildedPattern = null;
  gildedColorSource = '';
}
function drawGildedTrail(c: CanvasRenderingContext2D): void {
  if (gildedColorSource !== cachedDisplayColor || !gildedPattern) {
    if (!gildedSurface) gildedSurface = document.createElement('canvas');
    const size = 256;
    gildedSurface.width = size;
    gildedSurface.height = size;
    const context = gildedSurface.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    for (let index = 0; index < 128; index += 1) {
      const tone = index / 127;
      const chroma = (0.9 + 0.2 * Math.sin(tone * Math.PI)) * (1 - 0.68 * tone ** 6);
      context.fillStyle = `oklch(from ${cachedDisplayColor} clamp(0.12, calc(clamp(0.38, l, 0.78) - 0.24 + ${tone * 0.62}), 0.98) calc(c * ${chroma}) h)`;
      context.fillRect(index, 0, 1, 1);
    }
    const colors = context.getImageData(0, 0, 128, 1).data;
    const pixels = context.createImageData(size, size);
    function grain(x: number, y: number): number {
      let value = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
      value = Math.imul(value ^ value >>> 13, 1274126177);
      return ((value ^ value >>> 16) >>> 0) / 4294967295;
    }
    for (let y = 0; y < size; y += 1) {
      const v = y / size * Math.PI * 2;
      for (let x = 0; x < size; x += 1) {
        const u = x / size * Math.PI * 2;
        const fine = grain(x, y);
        const facet = grain((x >> 1) + 257, (y >> 1) + 97);
        const light = 0.52 + 0.1 * Math.sin(u + 0.5 * Math.sin(v)) + 0.06 * Math.cos(v - 0.4 * Math.sin(u));
        const tone = light + (fine - 0.5) * 0.65 + (facet - 0.5) * 0.3 + (fine > 0.95 ? 0.2 : 0);
        const color = Math.max(0, Math.min(127, Math.round(tone * 127))) * 4;
        const offset = (y * size + x) * 4;
        pixels.data[offset] = colors[color];
        pixels.data[offset + 1] = colors[color + 1];
        pixels.data[offset + 2] = colors[color + 2];
        pixels.data[offset + 3] = 255;
      }
    }
    context.putImageData(pixels, 0, 0);
    gildedPattern = c.createPattern(gildedSurface, 'repeat');
    gildedPattern?.setTransform(new DOMMatrix().scale(0.5));
    gildedColorSource = cachedDisplayColor;
  }
  if (!gildedPattern) return;
  c.fillStyle = gildedPattern;
  c.fill();
}
function releaseRainbowTrail(): void {
  if (rainbowSurface) {
    if (ctx) ctx.fillStyle = cachedDisplayColor;
    rainbowSurface.width = 0;
    rainbowSurface.height = 0;
  }
  rainbowSurface = null;
  rainbowContext = null;
  rainbowColorSource = '';
  rainbowColors = [];
}
function drawRainbowTrail(c: CanvasRenderingContext2D, centers: FluidCursorRainbowPoint[], scale: number): void {
  const length = centers[centers.length - 1]?.distance ?? 0;
  if (length < 0.0001) return;
  const padding = 8 * scale + 2;
  const left = Math.max(0, Math.floor(Math.min(...centers.map(point => point.x)) - padding));
  const top = Math.max(0, Math.floor(Math.min(...centers.map(point => point.y)) - padding));
  const right = Math.min(window.innerWidth, Math.ceil(Math.max(...centers.map(point => point.x)) + padding));
  const bottom = Math.min(window.innerHeight, Math.ceil(Math.max(...centers.map(point => point.y)) + padding));
  if (right <= left || bottom <= top) return;
  const resolution = canvas ? canvas.width / window.innerWidth : 1;
  const width = Math.ceil((right - left) * resolution);
  const height = Math.ceil((bottom - top) * resolution);
  const capacityWidth = Math.ceil(width / 32) * 32;
  const capacityHeight = Math.ceil(height / 32) * 32;
  if (!rainbowSurface) {
    rainbowSurface = document.createElement('canvas');
    rainbowSurface.width = capacityWidth;
    rainbowSurface.height = capacityHeight;
    rainbowContext = rainbowSurface.getContext('2d');
  }
  if (!rainbowContext) return;
  if (rainbowSurface.width < capacityWidth) rainbowSurface.width = capacityWidth;
  if (rainbowSurface.height < capacityHeight) rainbowSurface.height = capacityHeight;
  if (rainbowColorSource !== cachedDisplayColor) {
    rainbowColorSource = cachedDisplayColor;
    rainbowColors = Array.from({ length: 65 }, (_, index) => {
      const progress = index / 64;
      const hue = 90 * Math.sin(progress * Math.PI * 2) * Math.sin(progress * Math.PI);
      return `oklch(from ${cachedDisplayColor} l c calc(h + ${hue}))`;
    });
  }
  const context = rainbowContext;
  context.setTransform(resolution, 0, 0, resolution, -left * resolution, -top * resolution);
  context.clearRect(left, top, rainbowSurface.width / resolution, rainbowSurface.height / resolution);
  context.fillStyle = cachedDisplayColor;
  context.fillRect(left, top, width / resolution, height / resolution);
  context.lineCap = 'round';
  context.lineWidth = padding * 2;
  for (let index = centers.length - 1; index > 0; index -= 1) {
    const start = centers[index];
    const end = centers[index - 1];
    if (start.distance - end.distance < 0.0001) continue;
    const gradient = context.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, rainbowColors[Math.min(64, Math.round(start.distance / length * 64))]);
    gradient.addColorStop(1, rainbowColors[Math.min(64, Math.round(end.distance / length * 64))]);
    context.strokeStyle = gradient;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }
  const pattern = c.createPattern(rainbowSurface, 'no-repeat');
  if (!pattern) return;
  pattern.setTransform(new DOMMatrix().translate(left, top).scale(1 / resolution));
  c.fillStyle = pattern;
  c.fill();
}
function traceFluidCursorTrail(c: CanvasRenderingContext2D, left: readonly FluidCursorTrailEdgePoint[], right: readonly FluidCursorTrailEdgePoint[]): void {
  if (left.length === 0 || left.length !== right.length) return;
  c.beginPath();
  c.moveTo(left[0].x, left[0].y);
  for (let index = 1; index < left.length; index += 1) c.lineTo(left[index].x, left[index].y);
  for (let index = right.length - 1; index >= 0; index -= 1) c.lineTo(right[index].x, right[index].y);
  c.closePath();
}
function drawNeonTrail(c: CanvasRenderingContext2D, left: readonly FluidCursorTrailEdgePoint[], right: readonly FluidCursorTrailEdgePoint[], scale: number): void {
  const pixelScale = Math.hypot(c.getTransform().a, c.getTransform().b);
  const alpha = c.globalAlpha;
  c.save();
  c.shadowOffsetX = 0;
  c.shadowOffsetY = 0;
  c.fillStyle = `oklch(from ${cachedDisplayColor} clamp(0.8, calc(l + 0.18), 0.96) c h)`;
  c.shadowColor = `oklch(from ${cachedDisplayColor} clamp(0.72, calc(l + 0.1), 0.9) c h)`;
  c.shadowBlur = 14 * scale * pixelScale;
  c.globalAlpha = alpha * 0.8;
  c.fill();
  c.shadowBlur = 5.5 * scale * pixelScale;
  c.globalAlpha = alpha;
  c.fill();
  c.shadowBlur = 0;
  c.shadowColor = 'transparent';
  c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--b3-theme-background').trim();
  const inset = 0.18;
  const distances = [0];
  for (let index = 1; index < left.length; index += 1) {
    const dx = (left[index].x + right[index].x - left[index - 1].x - right[index - 1].x) / 2;
    const dy = (left[index].y + right[index].y - left[index - 1].y - right[index - 1].y) / 2;
    distances.push(distances[index - 1] + Math.hypot(dx, dy));
  }
  const length = distances[distances.length - 1];
  const cap = Math.min(1.5 * scale, length * 0.18);
  const coreLeft: FluidCursorTrailEdgePoint[] = [];
  const coreRight: FluidCursorTrailEdgePoint[] = [];
  function addCorePoint(index: number, progress: number): void {
    const leftX = left[index - 1].x + (left[index].x - left[index - 1].x) * progress;
    const leftY = left[index - 1].y + (left[index].y - left[index - 1].y) * progress;
    const rightX = right[index - 1].x + (right[index].x - right[index - 1].x) * progress;
    const rightY = right[index - 1].y + (right[index].y - right[index - 1].y) * progress;
    coreLeft.push({ x: leftX + (rightX - leftX) * inset, y: leftY + (rightY - leftY) * inset });
    coreRight.push({ x: rightX + (leftX - rightX) * inset, y: rightY + (leftY - rightY) * inset });
  }
  for (let index = 1; index < left.length; index += 1) {
    const start = distances[index - 1];
    const end = distances[index];
    if (end <= cap || start >= length - cap || end - start < 0.0001) continue;
    if (coreLeft.length === 0) addCorePoint(index, (Math.max(start, cap) - start) / (end - start));
    addCorePoint(index, (Math.min(end, length - cap) - start) / (end - start));
  }
  traceFluidCursorTrail(c, coreLeft, coreRight);
  c.fill();
  const tipRadius = 3.5 * scale;
  const tipVisibility = Math.min(1, length / (8 * scale)) ** 3;
  const tipColor = `oklch(from ${cachedDisplayColor} clamp(0.8, calc(l + 0.18), 0.96) c h`;
  c.globalAlpha = alpha * tipVisibility;
  c.lineWidth = scale;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.shadowColor = `oklch(from ${cachedDisplayColor} clamp(0.72, calc(l + 0.1), 0.9) c h)`;
  c.shadowBlur = 3 * scale * pixelScale;
  function strokeTip(from: number, end: number, step: number): void {
    const x = (left[end].x + right[end].x) / 2;
    const y = (left[end].y + right[end].y) / 2;
    const gradient = c.createRadialGradient(x, y, 0, x, y, tipRadius);
    gradient.addColorStop(0, `${tipColor} / 1)`);
    gradient.addColorStop(0.6, `${tipColor} / 0.7)`);
    gradient.addColorStop(1, `${tipColor} / 0)`);
    c.strokeStyle = gradient;
    c.beginPath();
    c.moveTo(left[from].x, left[from].y);
    for (let index = from + step; index !== end; index += step) c.lineTo(left[index].x, left[index].y);
    c.lineTo(left[end].x, left[end].y);
    for (let index = end; index !== from; index -= step) c.lineTo(right[index].x, right[index].y);
    c.lineTo(right[from].x, right[from].y);
    c.stroke();
  }
  let headEnd = 1;
  while (headEnd < distances.length - 1 && distances[headEnd] < tipRadius + scale) headEnd += 1;
  strokeTip(headEnd, 0, -1);
  c.restore();
}
function drawFluidCursorTrail(c: CanvasRenderingContext2D, scale: number): void {
  if (points.length < 2 || scale <= 0) return;
  const segmentCount = Math.min(10, points.length - 1);
  let length = 0;
  for (let index = 0; index < segmentCount; index += 1) {
    length += Math.hypot(points[index + 1].x - points[index].x, points[index + 1].y - points[index].y);
  }
  if (length < 0.0001) return;
  const tipLength = Math.min(8 * scale, length * 0.16);
  const majorRadius = 3.9 * scale;
  const minorRadius = 2.8 * scale;
  const left: FluidCursorTrailEdgePoint[] = [];
  const right: FluidCursorTrailEdgePoint[] = [];
  const rainbowPoints: FluidCursorRainbowPoint[] | null = trailColor === 'rainbow' ? [] : null;
  let tangentX = -Math.cos(points[0].angle);
  let tangentY = -Math.sin(points[0].angle);
  let distanceFromHead = 0;
  let previousX = points[0].x;
  let previousY = points[0].y;
  for (let index = 0; index < segmentCount; index += 1) {
    const control = points[index];
    const previous = points[Math.max(0, index - 1)];
    const next = points[index + 1];
    const startX = index === 0 ? control.x : (previous.x + control.x) / 2;
    const startY = index === 0 ? control.y : (previous.y + control.y) / 2;
    const endX = (control.x + next.x) / 2;
    const endY = (control.y + next.y) / 2;
    const startAngleDelta = index === 0 ? 0 : getTrailAngleDelta(control.angle, previous.angle) / 2;
    const endAngleDelta = getTrailAngleDelta(control.angle, next.angle) / 2;
    const startPressure = index === 0 ? control.pressure : (previous.pressure + control.pressure) / 2;
    const endPressure = (control.pressure + next.pressure) / 2;
    for (let step = index === 0 ? 0 : 1; step <= 4; step += 1) {
      const t = step / 4;
      const inverse = 1 - t;
      const x = inverse * inverse * startX + 2 * inverse * t * control.x + t * t * endX;
      const y = inverse * inverse * startY + 2 * inverse * t * control.y + t * t * endY;
      distanceFromHead += Math.hypot(x - previousX, y - previousY);
      previousX = x;
      previousY = y;
      let dx = inverse * (control.x - startX) + t * (endX - control.x);
      let dy = inverse * (control.y - startY) + t * (endY - control.y);
      let distance = Math.hypot(dx, dy);
      if (distance < 0.0001) {
        dx = endX - startX;
        dy = endY - startY;
        distance = Math.hypot(dx, dy);
      }
      if (distance >= 0.0001) {
        tangentX = dx / distance;
        tangentY = dy / distance;
      }
      const normalX = -tangentY;
      const normalY = tangentX;
      const angle = control.angle + inverse * inverse * startAngleDelta + t * t * endAngleDelta;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const majorNormal = normalX * cosine + normalY * sine;
      const minorNormal = -normalX * sine + normalY * cosine;
      const radius = Math.hypot(majorRadius * majorNormal, minorRadius * minorNormal);
      const progress = (index + t) / segmentCount;
      const pressure = inverse * inverse * startPressure + 2 * inverse * t * control.pressure + t * t * endPressure;
      const taper = (1 - progress) ** 0.85 * Math.min(1, distanceFromHead / tipLength) * pressure;
      const majorOffset = majorRadius * majorRadius * majorNormal / radius * taper;
      const minorOffset = minorRadius * minorRadius * minorNormal / radius * taper;
      const offsetX = cosine * majorOffset - sine * minorOffset;
      const offsetY = sine * majorOffset + cosine * minorOffset;
      left.push({ x: x + offsetX, y: y + offsetY });
      right.push({ x: x - offsetX, y: y - offsetY });
      rainbowPoints?.push({ x, y, distance: distanceFromHead });
    }
  }
  c.fillStyle = cachedDisplayColor;
  traceFluidCursorTrail(c, left, right);
  if (rainbowPoints) drawRainbowTrail(c, rainbowPoints, scale);
  else if (trailColor === 'gilded') drawGildedTrail(c);
  else if (trailColor === 'neon') drawNeonTrail(c, left, right, scale);
  else c.fill();
}
function getWaterWaveColors(): readonly [string, string] {
  const style = getComputedStyle(document.documentElement);
  const foreground = style.getPropertyValue('--b3-theme-on-background').trim();
  const background = style.getPropertyValue('--b3-theme-background').trim();
  return getThemeMode() === 'dark' ? [foreground, background] : [background, foreground];
}
function createWaterRefraction(x: number, y: number, scale: number, isCurrent: () => boolean): WaveRefraction | null {
  if (!waveOn || !canvas || !CSS.supports('backdrop-filter', 'url("#neo-fluidcursor-wave-filter")')) return null;
  const namespace = 'http://www.w3.org/2000/svg';
  if (!waveFilterDefinitions) {
    waveFilters = document.createElementNS(namespace, 'svg');
    waveFilters.classList.add('neo-fluidcursor-filters');
    waveFilters.dataset.name = 'neo-fluidcursor';
    waveFilters.setAttribute('width', '0');
    waveFilters.setAttribute('height', '0');
    waveFilters.setAttribute('aria-hidden', 'true');
    waveFilterDefinitions = document.createElementNS(namespace, 'defs');
    waveFilters.appendChild(waveFilterDefinitions);
    document.body.appendChild(waveFilters);
  }
  const filter = document.createElementNS(namespace, 'filter');
  filter.id = `neo-fluidcursor-wave-filter-${++waveSequence}`;
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  filter.setAttribute('width', '100%');
  filter.setAttribute('height', '100%');
  const image = document.createElementNS(namespace, 'feImage');
  const radius = waveRadius * scale;
  image.setAttribute('x', '0');
  image.setAttribute('y', '0');
  image.setAttribute('width', (radius * 2).toString());
  image.setAttribute('height', (radius * 2).toString());
  image.setAttribute('preserveAspectRatio', 'none');
  image.setAttribute('result', 'map');
  filter.appendChild(image);
  const channelMatrices = [
    '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
    '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
    '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
  ];
  const displacements: SVGFEDisplacementMapElement[] = [];
  const channelResults: string[] = [];
  channelMatrices.forEach((matrix, index) => {
    const displacement = document.createElementNS(namespace, 'feDisplacementMap');
    const displacedResult = `displaced-${index}`;
    const channelResult = `channel-${index}`;
    displacement.setAttribute('in', 'SourceGraphic');
    displacement.setAttribute('in2', 'map');
    displacement.setAttribute('scale', '0');
    displacement.setAttribute('xChannelSelector', 'R');
    displacement.setAttribute('yChannelSelector', 'G');
    displacement.setAttribute('result', displacedResult);
    const isolation = document.createElementNS(namespace, 'feColorMatrix');
    isolation.setAttribute('in', displacedResult);
    isolation.setAttribute('type', 'matrix');
    isolation.setAttribute('values', matrix);
    isolation.setAttribute('result', channelResult);
    filter.append(displacement, isolation);
    displacements.push(displacement);
    channelResults.push(channelResult);
  });
  const redGreen = document.createElementNS(namespace, 'feBlend');
  redGreen.setAttribute('in', channelResults[0]);
  redGreen.setAttribute('in2', channelResults[1]);
  redGreen.setAttribute('mode', 'screen');
  redGreen.setAttribute('result', 'red-green');
  const combine = document.createElementNS(namespace, 'feBlend');
  combine.setAttribute('in', 'red-green');
  combine.setAttribute('in2', channelResults[2]);
  combine.setAttribute('mode', 'screen');
  filter.append(redGreen, combine);
  waveFilterDefinitions.appendChild(filter);
  const element = document.createElement('div');
  element.classList.add('neo-fluidcursor-refraction');
  element.setAttribute('aria-hidden', 'true');
  element.style.width = `${radius * 2}px`;
  element.style.height = `${radius * 2}px`;
  element.style.translate = `${x - radius}px ${y - radius}px`;
  element.style.backdropFilter = `url("#${filter.id}")`;
  canvas.before(element);
  return { element, filter, image, displacements, frame: -1, isCurrent };
}
function removeWaterWave(wave: FluidCursorWave): void {
  wave.refraction?.element.remove();
  wave.refraction?.filter.remove();
  wave.refraction = null;
  removeUnusedWaterFilters();
}
function removeUnusedWaterFilters(): void {
  if (waveFilterDefinitions?.childElementCount) return;
  waveFilters?.remove();
  waveFilters = null;
  waveFilterDefinitions = null;
}
function updateWaterRefraction(wave: FluidCursorWave, frame: number, map: WaveDisplacementMap): void {
  const refraction = wave.refraction;
  if (!refraction) return;
  const scale = wave.scale;
  const strength = wave.strength;
  if (refraction.frame === frame) return;
  refraction.frame = frame;
  const apply = (): void => {
    if (!waveOn || !refraction.isCurrent() || !refraction.element.isConnected || !refraction.filter.isConnected || refraction.frame !== frame) return;
    refraction.image.setAttribute('href', map.url);
    const displacementScale = 6 * scale * strength;
    const spread = waveDispersion;
    const dispersionFactors = [1 - spread, 1, 1 + spread];
    refraction.displacements.forEach((displacement, index) => {
      displacement.setAttribute('scale', (displacementScale * dispersionFactors[index]).toFixed(2));
    });
  };
  if (map.loaded) {
    apply();
  } else {
    void map.ready.then(loaded => {
      if (loaded) apply();
    });
  }
}
function createWaterDisplacementMap(surface: HTMLCanvasElement): WaveDisplacementMap {
  const url = surface.toDataURL();
  const image = new Image();
  let active = true;
  const map: WaveDisplacementMap = {
    url,
    loaded: false,
    ready: Promise.resolve(false),
    cancel: () => {
      active = false;
      image.removeAttribute('src');
      pendingDisplacementMaps.delete(map);
    },
  };
  image.src = url;
  pendingDisplacementMaps.add(map);
  map.ready = image.decode().then(() => {
    if (!active) return false;
    map.loaded = true;
    return true;
  }, () => false).finally(() => pendingDisplacementMaps.delete(map));
  return map;
}
function releaseWaterWaves(): void {
  wavePresses.clear();
  waves.forEach(removeWaterWave);
  for (const map of [...pendingDisplacementMaps]) map.cancel();
  for (const map of waveMaps.values()) map.cancel();
  waveMaps.clear();
  waves = [];
  waveMapSurface = null;
  waveMapContext = null;
  waveMapPixels = null;
  waveSurface = null;
  waveContext = null;
  wavePixels = null;
  waveGeometry = [];
  waveColorSource = '';
  waveColorValues = null;
}
function getWaterWaveSlope(radius: number, progress: number): number {
  const age = progress * waveDuration;
  const strength = Math.sin(Math.min(1, age / 0.08) * Math.PI / 2) * (1 - progress) ** 1.1;
  const front = 3 + progress * 33;
  const distance = radius - front;
  const envelope = Math.exp(-distance * distance / 90);
  const phase = distance * 0.52;
  return (0.52 * Math.cos(phase) - distance / 45 * Math.sin(phase)) * envelope * strength * 1.7;
}
function drawWaterWave(c: CanvasRenderingContext2D, wave: FluidCursorWave, age: number, colors: readonly [string, string]): void {
  if (!waveSurface) {
    waveSurface = document.createElement('canvas');
    waveSurface.width = waveRadius * 2;
    waveSurface.height = waveRadius * 2;
    waveContext = waveSurface.getContext('2d');
    if (!waveContext) return;
    wavePixels = waveContext.createImageData(waveSurface.width, waveSurface.height);
    waveGeometry = [];
    for (let y = 0; y < waveSurface.height; y += 1) {
      for (let x = 0; x < waveSurface.width; x += 1) {
        const dx = x + 0.5 - waveRadius;
        const dy = y + 0.5 - waveRadius;
        const radius = Math.hypot(dx, dy);
        if (radius >= waveRadius) continue;
        const edge = Math.min(1, (waveRadius - radius) / 5);
        waveGeometry.push({
          offset: (y * waveSurface.width + x) * 4,
          radius,
          x: dx / radius,
          y: dy / radius,
          edge: edge * edge * (3 - 2 * edge),
        });
      }
    }
  }
  if (!waveContext || !wavePixels) return;
  const frame = Math.min(waveMapFrames, Math.floor(age / waveDuration * waveMapFrames));
  const needsMap = wave.refraction !== null && !waveMaps.has(frame);
  if (needsMap && !waveMapSurface) {
    waveMapSurface = document.createElement('canvas');
    waveMapSurface.width = waveRadius * 2;
    waveMapSurface.height = waveRadius * 2;
    waveMapContext = waveMapSurface.getContext('2d');
    if (waveMapContext) {
      waveMapPixels = waveMapContext.createImageData(waveMapSurface.width, waveMapSurface.height);
      for (let index = 0; index < waveMapPixels.data.length; index += 4) {
        waveMapPixels.data[index] = 128;
        waveMapPixels.data[index + 1] = 128;
        waveMapPixels.data[index + 2] = 128;
        waveMapPixels.data[index + 3] = 255;
      }
    }
  }
  const colorSource = colors.join('\n');
  if (!waveColorValues || waveColorSource !== colorSource) {
    waveContext.clearRect(0, 0, 2, 1);
    for (let index = 0; index < colors.length; index += 1) {
      waveContext.fillStyle = colors[index];
      waveContext.fillRect(index, 0, 1, 1);
    }
    waveColorValues = waveContext.getImageData(0, 0, 2, 1).data;
    waveColorSource = colorSource;
  }
  const progress = Math.min(1, age / waveDuration);
  const shadowStrength = 0.45 + (getThemeMode() === 'light' ? Math.max(0, 1.5 - wave.strength) * 0.4 : 0);
  const pixels = wavePixels.data;
  pixels.fill(0);
  for (const point of waveGeometry) {
    const slope = getWaterWaveSlope(point.radius, progress);
    if (needsMap && waveMapPixels) {
      const normalScale = 1 / Math.sqrt(1 + slope * slope);
      waveMapPixels.data[point.offset] = 128 - slope * point.x * normalScale * point.edge * 127;
      waveMapPixels.data[point.offset + 1] = 128 - slope * point.y * normalScale * point.edge * 127;
    }
    const waveSlope = slope * wave.strength;
    const normalScale = 1 / Math.sqrt(1 + waveSlope * waveSlope);
    const nx = -waveSlope * point.x * normalScale;
    const ny = -waveSlope * point.y * normalScale;
    const nz = normalScale;
    const diffuse = nx * -0.45 + ny * -0.6 + nz * 0.66 - 0.66;
    const reflection = Math.max(0, (Math.max(0, nx * -0.24 + ny * -0.32 + nz * 0.9165)) ** 24 - 0.9165 ** 24);
    const light = diffuse * 0.65 + reflection * 0.18;
    const colorOffset = light > 0 ? 0 : 4;
    pixels[point.offset] = waveColorValues[colorOffset];
    pixels[point.offset + 1] = waveColorValues[colorOffset + 1];
    pixels[point.offset + 2] = waveColorValues[colorOffset + 2];
    pixels[point.offset + 3] = Math.round(Math.min(0.32, Math.abs(light) * (light > 0 ? 1 : shadowStrength)) * point.edge * waveColorValues[colorOffset + 3]);
  }
  waveContext.putImageData(wavePixels, 0, 0);
  c.save();
  c.globalAlpha = 1;
  const radius = waveRadius * wave.scale;
  c.drawImage(waveSurface, wave.x - radius, wave.y - radius, radius * 2, radius * 2);
  c.restore();
  if (needsMap && waveMapSurface && waveMapContext && waveMapPixels) {
    waveMapContext.putImageData(waveMapPixels, 0, 0);
    waveMaps.set(frame, createWaterDisplacementMap(waveMapSurface));
  }
  const map = waveMaps.get(frame);
  if (wave.refraction && map) updateWaterRefraction(wave, frame, map);
}
function startFluidCursor(): void {
  if (canvas || (!trailOn && !waveOn)) return;
  const isCurrent = createNeoLifecycleGuard();
  const existingCanvas = document.getElementById('neo-fluidcursor-canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }
  canvas = document.createElement('canvas');
  canvas.id = 'neo-fluidcursor-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    pointerEvents: 'none',
    zIndex: '999999',
    opacity: '1',
  });
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  const activeCanvas = canvas;
  function isActive(): boolean {
    return neoFeatureActive && isCurrent() && canvas === activeCanvas && activeCanvas.isConnected;
  }
  isMouseDown = false;
  lastColorFetchTime = 0;
  mouse = { x: -100, y: -100 };
  points = [];
  isFirstMouseMove = true;
  isShrinking = false;
  shrinkStartTime = 0;
  waves = [];
  function resize(): void {
    if (!isActive() || !canvas) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const deviceScale = window.devicePixelRatio || 1;
    const maxCanvasPixels = 12_000_000;
    const maxScale = Math.max(1, Math.sqrt(maxCanvasPixels / (width * height)));
    const renderScale = Math.min(deviceScale, maxScale);
    canvas.width = Math.round(width * renderScale);
    canvas.height = Math.round(height * renderScale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx?.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  }
  resizeHandler = resize;
  resize();
  let resetTrailOnMove = false;
  let lastTrailInputTime = 0;
  let targetTrailPressure = 1.1;
  function resumeAnimation(): void {
    if (!isActive()) return;
    if (animationFrameId !== null) return;
    if (!canvas || !ctx) return;
    lastTime = performance.now();
    animationFrameId = window.requestAnimationFrame(animate);
  }
  function getMouseEventTime(e: MouseEvent): number {
    const now = performance.now();
    return Number.isFinite(e.timeStamp) && e.timeStamp >= 0 && e.timeStamp <= now ? e.timeStamp : now;
  }
  function scheduleHideCursor(startTime = performance.now()): void {
    clearHideCursorTimeout();
    if (isFirstMouseMove || points.length === 0) return;
    const hideTime = startTime + 200;
    hideCursorTimeout = window.setTimeout(() => {
      if (!isActive()) return;
      hideCursorTimeout = null;
      if (isFirstMouseMove || points.length === 0) {
        isShrinking = false;
        return;
      }
      isShrinking = true;
      shrinkStartTime = hideTime;
      resumeAnimation();
    }, Math.max(0, hideTime - performance.now()));
  }
  mouseMoveHandler = (e: MouseEvent) => {
    if (!isActive()) return;
    if (trailOn) {
      const eventTime = getMouseEventTime(e);
      if (performance.now() - eventTime > trailResetInterval) return;
      if (isFirstMouseMove || resetTrailOnMove) {
        resetTrailOnMove = false;
        points = [];
        isFirstMouseMove = false;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        targetTrailPressure = 1.1;
        for (let i = 0; i < 24; i++) {
          points.push({ x: mouse.x, y: mouse.y, angle: Math.PI / 4, pressure: targetTrailPressure, turn: 0 });
        }
      } else {
        const distance = Math.hypot(e.clientX - mouse.x, e.clientY - mouse.y);
        if (distance > 0 && eventTime > lastTrailInputTime) {
          const speed = distance / Math.max((eventTime - lastTrailInputTime) / 1000, 0.001);
          targetTrailPressure = 0.8 + 0.85 / (1 + (speed / 700) ** 2);
        }
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
      lastTrailInputTime = eventTime;
      randomCursorColor();
      isShrinking = false;
      scheduleHideCursor(eventTime);
      resumeAnimation();
    }
  };
  window.addEventListener('resize', resizeHandler);
  mouseDownHandler = (e: MouseEvent) => {
    if (!isActive()) return;
    const eventTime = getMouseEventTime(e);
    if (trailOn) {
      isMouseDown = true;
      isShrinking = false;
      if (performance.now() - eventTime <= trailResetInterval) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
    }
    if (waveOn && performance.now() - eventTime <= trailResetInterval) {
      wavePresses.set(e.button, eventTime);
    }
    clearHideCursorTimeout();
    if (trailOn) resumeAnimation();
  };
  mouseUpHandler = (e: MouseEvent) => {
    if (!isActive()) return;
    const eventTime = getMouseEventTime(e);
    const pressTime = wavePresses.get(e.button);
    wavePresses.delete(e.button);
    if (waveOn && pressTime !== undefined && eventTime >= pressTime && performance.now() - eventTime <= waveDuration * 1000) {
      const force = Math.min(1, (eventTime - pressTime) / 900);
      const scale = 2 / 3 + force;
      waves.push({
        x: e.clientX,
        y: e.clientY,
        startTime: eventTime,
        scale,
        strength: 0.5 + force,
        refraction: createWaterRefraction(e.clientX, e.clientY, scale, isActive),
      });
      if (waves.length > 12) {
        const oldest = waves.shift();
        if (oldest) removeWaterWave(oldest);
      }
      resumeAnimation();
    }
    isMouseDown = false;
    if (trailOn && !isShrinking && waves.length === 0 && hideCursorTimeout === null) {
      scheduleHideCursor();
    }
  };
  window.addEventListener('mousedown', mouseDownHandler, { capture: true, passive: true });
  window.addEventListener('mouseup', mouseUpHandler, { capture: true, passive: true });
  waveBlurHandler = () => wavePresses.clear();
  mouseLeaveHandler = () => {
    if (!isActive()) return;
    clearHideCursorTimeout();
    isShrinking = false;
    points = [];
    isFirstMouseMove = true;
    wavePresses.clear();
    resumeAnimation();
  };
  function animate(currentTime: number): void {
    if (!isActive() || !canvas || !ctx) return;
    const c = ctx;
    const deltaTime = Math.max(0, (currentTime - lastTime) / 1000);
    lastTime = currentTime;
    if (deltaTime * 1000 > trailResetInterval) {
      resetTrailOnMove = true;
      points.forEach(point => {
        point.x = mouse.x;
        point.y = mouse.y;
      });
    }
    const timeFactor = Math.min(deltaTime * 60, 3);
    if (trailOn) {
      if (trailColor === 'aurora') {
        const diff = targetHueOffset - currentHueOffset;
        if (Math.abs(diff) > 0.5) {
          currentHueOffset += diff * 0.08 * timeFactor;
        } else {
          currentHueOffset = targetHueOffset;
        }
      }
      updateDisplayColor();
    }
    c.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let trailScale = 1;
    if (trailOn) {
      if (!isFirstMouseMove) {
        if (isShrinking) {
          const elapsed = (currentTime - shrinkStartTime) / 1000;
          const shrinkProgress = Math.max(0, Math.min(elapsed / 0.35, 1));
          trailScale = 1 - shrinkProgress * shrinkProgress * (3 - 2 * shrinkProgress);
          advanceFluidCursorTrail(deltaTime, shrinkProgress, targetTrailPressure);
          if (shrinkProgress >= 1) {
            isShrinking = false;
            points = [];
            isFirstMouseMove = true;
          }
        } else {
          advanceFluidCursorTrail(deltaTime, 0, targetTrailPressure);
        }
      }
    }
    if (waveOn && waves.length > 0) {
      const colors = getWaterWaveColors();
      waves = waves.filter(wave => {
        const age = Math.max(0, (currentTime - wave.startTime) / 1000);
        if (age >= waveDuration) {
          removeWaterWave(wave);
          return false;
        }
        drawWaterWave(c, wave, age, colors);
        return true;
      });
      if (waves.length === 0 && trailOn && !isShrinking && !isMouseDown) {
        scheduleHideCursor();
      }
    }
    if (trailOn) drawFluidCursorTrail(c, trailScale);
    let trailMoving = false;
    if (trailOn && !isFirstMouseMove) {
      for (let i = 0; i < points.length; i++) {
        const dx = points[i].x - mouse.x;
        const dy = points[i].y - mouse.y;
        if (dx * dx + dy * dy > 2.25) {
          trailMoving = true;
          break;
        }
      }
    }
    if (waves.length > 0 || isShrinking || trailMoving) {
      animationFrameId = window.requestAnimationFrame(animate);
    } else {
      animationFrameId = null;
    }
  }
  let attachedTrail = false;
  let attachedWave = false;
  syncFluidCursorOptions = () => {
    if (!isActive()) return;
    if (trailOn !== attachedTrail) {
      if (trailOn) {
        if (trailColor !== 'ink') refreshBaseColor(true);
        randomCursorColor();
        if (mouseMoveHandler) window.addEventListener('mousemove', mouseMoveHandler, { capture: true, passive: true });
        if (mouseLeaveHandler) document.addEventListener('mouseleave', mouseLeaveHandler);
      } else {
        if (mouseMoveHandler) window.removeEventListener('mousemove', mouseMoveHandler, true);
        if (mouseLeaveHandler) document.removeEventListener('mouseleave', mouseLeaveHandler);
        clearHideCursorTimeout();
        points = [];
        isFirstMouseMove = true;
        isShrinking = false;
        isMouseDown = false;
      }
      attachedTrail = trailOn;
    }
    if (waveOn !== attachedWave) {
      if (waveOn) {
        if (waveBlurHandler) window.addEventListener('blur', waveBlurHandler);
      } else {
        if (waveBlurHandler) window.removeEventListener('blur', waveBlurHandler);
        releaseWaterWaves();
      }
      attachedWave = waveOn;
    }
    ctx?.clearRect(0, 0, window.innerWidth, window.innerHeight);
    resumeAnimation();
  };
  syncFluidCursorOptions();
}
function stopFluidCursor(): void {
  syncFluidCursorOptions = null;
  const existingCanvas = document.getElementById('neo-fluidcursor-canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  clearHideCursorTimeout();
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  if (mouseMoveHandler) {
    window.removeEventListener('mousemove', mouseMoveHandler, true);
    mouseMoveHandler = null;
  }
  if (mouseDownHandler) {
    window.removeEventListener('mousedown', mouseDownHandler, true);
    mouseDownHandler = null;
  }
  if (mouseUpHandler) {
    window.removeEventListener('mouseup', mouseUpHandler, true);
    mouseUpHandler = null;
  }
  if (mouseLeaveHandler) {
    document.removeEventListener('mouseleave', mouseLeaveHandler);
    mouseLeaveHandler = null;
  }
  if (waveBlurHandler) {
    window.removeEventListener('blur', waveBlurHandler);
    waveBlurHandler = null;
  }
  points = [];
  mouse = { x: 0, y: 0 };
  lastTime = 0;
  lastColorFetchTime = 0;
  cachedBaseColor = '';
  releaseGildedTrail();
  releaseRainbowTrail();
  releaseWaterWaves();
  waveFilters?.remove();
  waveFilters = null;
  waveFilterDefinitions = null;
  isFirstMouseMove = true;
  isMouseDown = false;
  isShrinking = false;
  shrinkStartTime = 0;
  canvas = null;
  ctx = null;
}
export function destroyFluidCursor(): void {
  neoFeatureActive = false;
  configRevision += 1;
  stopFluidCursor();
  removeCss('extension-fluidcursor');
  const htmlEl = document.documentElement;
  if (htmlEl) {
    htmlEl.classList.remove('neo-fluidcursor');
  }
}
function enableFluidCursor(): void {
  if (neoFeatureActive) return;
  ensureCss('extension-fluidcursor', featureCss['extension-fluidcursor']);
  document.documentElement.classList.add('neo-fluidcursor');
  neoFeatureActive = true;
  startFluidCursor();
}
function applyFluidCursorOptions(nextTrailOn: boolean, nextWaveOn: boolean, nextTrailColor: typeof trailColor): void {
  const colorChanged = trailColor !== nextTrailColor;
  trailOn = nextTrailOn;
  waveOn = nextWaveOn;
  trailColor = nextTrailColor;
  if (!trailOn || trailColor !== 'gilded') releaseGildedTrail();
  if (!trailOn || trailColor !== 'rainbow') releaseRainbowTrail();
  if (!neoFeatureActive) return;
  if (colorChanged && trailOn && canvas) {
    if (trailColor !== 'ink') refreshBaseColor(true);
    updateDisplayColor();
  }
  if (!trailOn && !waveOn) stopFluidCursor();
  else if (canvas) syncFluidCursorOptions?.();
  else startFluidCursor();
}
function buildFluidCursorSettingsHTML(i18n: Record<string, string>): string {
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.fluidCursorTrail}</div>
              <div class="b3-label__text">${i18n.fluidCursorTrailTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-fluidcursor-trail" type="checkbox">
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.fluidCursorTrailColor}</div>
              <div class="b3-label__text">${i18n.fluidCursorTrailColorTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-fluidcursor-trail-color">
              <option value="aurora">${i18n.fluidCursorTrailColorAurora}</option>
              <option value="ink">${i18n.fluidCursorTrailColorInk}</option>
              <option value="rainbow">${i18n.fluidCursorTrailColorRainbow}</option>
              <option value="neon">${i18n.fluidCursorTrailColorNeon}</option>
              <option value="gilded">${i18n.fluidCursorTrailColorGilded}</option>
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.fluidCursorWave}</div>
              <div class="b3-label__text">${i18n.fluidCursorWaveTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-fluidcursor-wave" type="checkbox">
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-fluidcursor-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-fluidcursor-confirm">${i18n.confirm}</button>
  </div>`;
}
export async function showFluidCursorSettings(): Promise<void> {
  const plugin = getPlugin();
  if (!plugin) return;
  const isCurrent = createNeoLifecycleGuard();
  await loadConfig();
  if (!isCurrent()) return;
  const config = getConfig();
  const initialTrailOn = config['fluidcursor-trail'] !== false;
  const initialWaveOn = config['fluidcursor-wave'] !== false;
  const initialTrailColor = normalizeFluidCursorTrailColor(config['fluidcursor-trail-color']);
  const dialog = new Dialog({
    title: plugin.i18n.fluidCursorSettings,
    content: buildFluidCursorSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const trailCheckbox = dialog.element.querySelector('#neo-fluidcursor-trail') as HTMLInputElement;
  const waveCheckbox = dialog.element.querySelector('#neo-fluidcursor-wave') as HTMLInputElement;
  const trailColorSelect = dialog.element.querySelector('#neo-fluidcursor-trail-color') as HTMLSelectElement;
  if (trailCheckbox) trailCheckbox.checked = initialTrailOn;
  if (waveCheckbox) waveCheckbox.checked = initialWaveOn;
  if (trailColorSelect) trailColorSelect.value = initialTrailColor;
  const updateTrailColorVisibility = (): void => {
    trailColorSelect?.closest('.config-item')?.classList.toggle('fn__none', !trailCheckbox?.checked);
  };
  trailCheckbox?.addEventListener('change', updateTrailColorVisibility);
  updateTrailColorVisibility();
  dialog.element.querySelector('#neo-fluidcursor-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-fluidcursor-confirm')?.addEventListener('click', () => {
    if (!isCurrent() || !dialog.element.isConnected) {
      dialog.destroy();
      return;
    }
    if (trailCheckbox && waveCheckbox && trailColorSelect) {
      const editedTrail = trailCheckbox.checked !== initialTrailOn;
      const editedWave = waveCheckbox.checked !== initialWaveOn;
      const nextTrailColor = normalizeFluidCursorTrailColor(trailColorSelect.value);
      const editedColor = nextTrailColor !== initialTrailColor;
      if (editedTrail || editedWave || editedColor) {
        const patch: Partial<Config> = {};
        if (editedTrail) patch['fluidcursor-trail'] = trailCheckbox.checked;
        if (editedWave) patch['fluidcursor-wave'] = waveCheckbox.checked;
        if (editedColor) patch['fluidcursor-trail-color'] = nextTrailColor;
        applyFluidCursorOptions(
          editedTrail ? trailCheckbox.checked : trailOn,
          editedWave ? waveCheckbox.checked : waveOn,
          editedColor ? nextTrailColor : trailColor
        );
        saveConfig(patch);
      }
    }
    dialog.destroy();
  });
}
export function initFluidCursor(): Promise<void> | void {
  if (isMobile()) return;
  const revision = ++configRevision;
  const isCurrent = createNeoLifecycleGuard();
  return loadConfig().then(() => {
    if (!isCurrent()) return;
    const config = getConfig();
    applyFluidCursorOptions(
      config['fluidcursor-trail'] !== false,
      config['fluidcursor-wave'] !== false,
      normalizeFluidCursorTrailColor(config['fluidcursor-trail-color'])
    );
    if (!neoFeatureActive && revision === configRevision && config['fluidcursor'] === true) {
      enableFluidCursor();
    }
  });
}
export function onFluidCursorClick(): void {
  if (isMobile()) return;
  configRevision += 1;
  if (neoFeatureActive) {
    destroyFluidCursor();
    saveConfig({ 'fluidcursor': false });
  } else {
    saveConfig({ 'fluidcursor': true });
    enableFluidCursor();
  }
}
