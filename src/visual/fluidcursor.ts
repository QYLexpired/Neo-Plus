import { isMobile } from '../modules/env';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { saveConfig, loadConfig, type Config } from '../main/data';
import { getPlugin } from '../main/context';
import { Dialog } from 'siyuan';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let animationFrameId: number | null = null;
let resizeHandler: (() => void) | null = null;
let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
let mouseDownHandler: ((e: MouseEvent) => void) | null = null;
let mouseUpHandler: ((e: MouseEvent) => void) | null = null;
let mouseLeaveHandler: (() => void) | null = null;
let hideCursorTimeout: number | null = null;
let points: { x: number; y: number }[] = [];
let mouse = { x: -100, y: -100 };
let lastTime = 0;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let isFirstMouseMove = true;
let isMouseDown = false;
let isShrinking = false;
let shrinkStartTime = 0;
let waves: { x: number; y: number; startTime: number; colors: [string, string, string]; scale: number; duration: number }[] = [];
let currentHueOffset = 0;
let targetHueOffset = 0;
let cachedDisplayColor = '#f44336';
let cachedBaseColor = '';
let lastColorFetchTime = 0;
const colorRefreshInterval = 500;
let trailOn = true;
let waveOn = true;
let neoFeatureActive = false;
function clearHideCursorTimeout(): void {
  if (hideCursorTimeout === null) return;
  clearTimeout(hideCursorTimeout);
  hideCursorTimeout = null;
}
function getCursorColor(): string {
  const computedStyle = getComputedStyle(document.documentElement);
  const color = computedStyle.getPropertyValue('--b3-base-color').trim();
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
function waveColor(invert: boolean, noChangeProb = 0.5): string {
  const base = refreshBaseColor();
  const offset = invert ? '180' : '0';
  if (Math.random() < noChangeProb) return `oklch(from ${base} l c calc(h + ${offset}))`;
  const rand = Math.random();
  let hue: number;
  if (rand < 0.5) {
    hue = Math.floor(Math.random() * 121) - 60;
  } else if (rand < 0.8) {
    const sign = Math.random() < 0.5 ? -1 : 1;
    hue = sign * (Math.floor(Math.random() * 61) + 60);
  } else {
    const sign = Math.random() < 0.5 ? -1 : 1;
    hue = sign * (Math.floor(Math.random() * 61) + 120);
  }
  return `oklch(from ${base} l c calc(h + ${offset} + ${hue}))`;
}
function updateDisplayColor(): void {
  const baseColor = refreshBaseColor();
  const baseHue = isMouseDown ? 180 : 0;
  cachedDisplayColor = `oklch(from ${baseColor} l c calc(h + ${baseHue} + ${currentHueOffset}))`;
}
function randomCursorColor(): void {
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
function startFluidCursor(): void {
  if (!trailOn && !waveOn) return;
  const existingCanvas = document.getElementById('neo-fluid-cursor-canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }
  canvas = document.createElement('canvas');
  canvas.id = 'neo-fluid-cursor-canvas';
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
  isMouseDown = false;
  lastColorFetchTime = 0;
  refreshBaseColor(true);
  randomCursorColor();
  mouse = { x: -100, y: -100 };
  points = [];
  isFirstMouseMove = true;
  isShrinking = false;
  shrinkStartTime = 0;
  waves = [];
  function resize(): void {
    if (!canvas) return;
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
  function resumeAnimation(): void {
    if (animationFrameId !== null) return;
    if (!canvas || !ctx) return;
    lastTime = performance.now();
    animationFrameId = window.requestAnimationFrame(animate);
  }
  function scheduleHideCursor(): void {
    clearHideCursorTimeout();
    hideCursorTimeout = window.setTimeout(() => {
      hideCursorTimeout = null;
      if (isFirstMouseMove || points.length === 0) {
        isShrinking = false;
        return;
      }
      isShrinking = true;
      shrinkStartTime = performance.now();
      resumeAnimation();
    }, 200);
  }
  mouseMoveHandler = (e: MouseEvent) => {
    if (trailOn) {
      if (isFirstMouseMove) {
        isFirstMouseMove = false;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        for (let i = 0; i < 24; i++) {
          points.push({ x: mouse.x, y: mouse.y });
        }
      } else {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
      randomCursorColor();
      isShrinking = false;
      scheduleHideCursor();
      resumeAnimation();
    }
  };
  window.addEventListener('resize', resizeHandler);
  if (trailOn) {
    window.addEventListener('mousemove', mouseMoveHandler, { passive: true });
  }
  mouseDownHandler = (e: MouseEvent) => {
    isMouseDown = true;
    isShrinking = false;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (waveOn) {
      const invert = e.button !== 0;
      waves.push({
        x: e.clientX,
        y: e.clientY,
        startTime: performance.now(),
        colors: [waveColor(invert, 0.7), waveColor(invert, 0.7), waveColor(invert, 0.7)],
        scale: 0.55 + Math.random() * 1.3,
        duration: 0.45 + Math.random() * 0.65,
      });
    }
    clearHideCursorTimeout();
    resumeAnimation();
  };
  mouseUpHandler = () => {
    isMouseDown = false;
    targetHueOffset = 0;
    if (trailOn && !isShrinking && waves.length === 0 && hideCursorTimeout === null) {
      scheduleHideCursor();
    }
  };
  window.addEventListener('mousedown', mouseDownHandler, { passive: true });
  window.addEventListener('mouseup', mouseUpHandler, { passive: true });
  mouseLeaveHandler = () => {
    isShrinking = false;
    points = [];
    isFirstMouseMove = true;
  };
  document.addEventListener('mouseleave', mouseLeaveHandler);
  function animate(currentTime: number): void {
    if (!canvas || !ctx) return;
    const c = ctx;
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    const timeFactor = Math.min(deltaTime * 60, 3);
    const diff = targetHueOffset - currentHueOffset;
    if (Math.abs(diff) > 0.5) {
      currentHueOffset += diff * 0.08 * timeFactor;
    } else {
      currentHueOffset = targetHueOffset;
    }
    if (trailOn) {
      updateDisplayColor();
    }
    c.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (trailOn) {
      if (!isFirstMouseMove) {
        if (isShrinking) {
          const elapsed = (currentTime - shrinkStartTime) / 1000;
          const shrinkProgress = Math.min(elapsed / 0.35, 1);
          for (let i = 0; i < points.length; i++) {
            const pull = Math.min(0.15 + (i / points.length) * 0.5, 0.65) * timeFactor;
            points[i].x += (mouse.x - points[i].x) * pull;
            points[i].y += (mouse.y - points[i].y) * pull;
          }
          const lastPt = points[points.length - 1];
          const tailDist = Math.hypot(lastPt.x - mouse.x, lastPt.y - mouse.y);
          if (shrinkProgress >= 1 || tailDist < 1.5) {
            isShrinking = false;
          }
        } else {
          const actualHeadEase = 1 - Math.pow(1 - 0.9, timeFactor);
          const actualTailEase = 1 - Math.pow(1 - 0.4, timeFactor);
          points[0].x += (mouse.x - points[0].x) * actualHeadEase;
          points[0].y += (mouse.y - points[0].y) * actualHeadEase;
          for (let i = 1; i < points.length; i++) {
            points[i].x += (points[i - 1].x - points[i].x) * actualTailEase;
            points[i].y += (points[i - 1].y - points[i].y) * actualTailEase;
          }
        }
      }
    }
    if (waveOn) {
      const hadWaves = waves.length > 0;
      try {
      waves = waves.filter(r => {
        const age = Math.max(0, (currentTime - r.startTime) / 1000);
        const dur = r.duration || 0.8;
        if (age > dur) return false;
        const s = r.scale || 1;
        const durInner = dur * 0.68;
        const durMiddle = dur * 0.82;
        const durOuter = dur;
        const progressInner = Math.min(age / durInner, 1);
        const progressMiddle = Math.min(age / durMiddle, 1);
        const progressOuter = Math.min(age / durOuter, 1);
        const fadeInner = 1 - progressInner;
        const fadeMiddle = 1 - progressMiddle;
        const fadeOuter = 1 - progressOuter;
        const r1 = Math.max(0, progressInner * 10 * s);
        c.beginPath();
        c.strokeStyle = r.colors[0];
        c.lineWidth = Math.max(0, 3 * fadeInner * Math.min(s, 1.4));
        c.globalAlpha = Math.max(0, 0.4 * fadeInner);
        c.shadowColor = r.colors[0];
        c.shadowBlur = 2;
        c.arc(r.x, r.y, r1, 0, Math.PI * 2);
        c.stroke();
        c.shadowBlur = 0;
        const r2 = Math.max(0, progressMiddle * 20 * s);
        c.beginPath();
        c.strokeStyle = r.colors[1];
        c.lineWidth = Math.max(0, 2 * fadeMiddle * Math.min(s, 1.4));
        c.globalAlpha = Math.max(0, 0.25 * fadeMiddle);
        c.shadowColor = r.colors[1];
        c.shadowBlur = 5;
        c.arc(r.x, r.y, r2, 0, Math.PI * 2);
        c.stroke();
        c.shadowBlur = 0;
        const r3 = Math.max(0, progressOuter * 32 * s);
        c.beginPath();
        c.strokeStyle = r.colors[2];
        c.lineWidth = Math.max(0, 1.5 * fadeOuter + 0.2);
        c.globalAlpha = Math.max(0, 0.15 * fadeOuter);
        c.shadowColor = r.colors[2];
        c.shadowBlur = 10;
        c.arc(r.x, r.y, r3, 0, Math.PI * 2);
        c.stroke();
        c.shadowBlur = 0;
        c.globalAlpha = 1;
        return true;
      });
      } catch {}
      if (hadWaves && waves.length === 0 && trailOn && !isShrinking && !isMouseDown) {
        scheduleHideCursor();
      }
    }
    if (trailOn) {
      c.strokeStyle = cachedDisplayColor;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      const n = points.length;
      const w0 = 6;
      if (n >= 2 && w0 > 0) {
        const midX = (points[0].x + points[1].x) / 2;
        const midY = (points[0].y + points[1].y) / 2;
        c.beginPath();
        c.lineWidth = w0;
        c.moveTo(points[0].x, points[0].y);
        c.quadraticCurveTo(points[0].x, points[0].y, midX, midY);
        c.stroke();
      }
      for (let i = 1; i < n - 1; i++) {
        const width = Math.max(0, 6 - (i * 0.65));
        if (width <= 0) break;
        const prevMidX = (points[i - 1].x + points[i].x) / 2;
        const prevMidY = (points[i - 1].y + points[i].y) / 2;
        const nextMidX = (points[i].x + points[i + 1].x) / 2;
        const nextMidY = (points[i].y + points[i + 1].y) / 2;
        c.beginPath();
        c.lineWidth = width;
        c.moveTo(prevMidX, prevMidY);
        c.quadraticCurveTo(points[i].x, points[i].y, nextMidX, nextMidY);
        c.stroke();
      }
    }
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
  lastTime = performance.now();
  animationFrameId = window.requestAnimationFrame(animate);
}
export function destroyFluidCursor(): void {
  neoFeatureActive = false;
  removeCss('visual-fluidcursor');
  const existingCanvas = document.getElementById('neo-fluid-cursor-canvas');
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
    window.removeEventListener('mousemove', mouseMoveHandler);
    mouseMoveHandler = null;
  }
  if (mouseDownHandler) {
    window.removeEventListener('mousedown', mouseDownHandler);
    mouseDownHandler = null;
  }
  if (mouseUpHandler) {
    window.removeEventListener('mouseup', mouseUpHandler);
    mouseUpHandler = null;
  }
  if (mouseLeaveHandler) {
    document.removeEventListener('mouseleave', mouseLeaveHandler);
    mouseLeaveHandler = null;
  }
  points = [];
  mouse = { x: 0, y: 0 };
  lastTime = 0;
  lastColorFetchTime = 0;
  cachedBaseColor = '';
  canvas = null;
  ctx = null;
  const htmlEl = document.documentElement;
  if (htmlEl) {
    htmlEl.classList.remove('neo-visual-fluid-cursor');
  }
}
function enableFluidCursor(): void {
  if (neoFeatureActive) return;
  ensureCss('visual-fluidcursor', featureCss['visual-fluidcursor']);
  document.documentElement.classList.add('neo-visual-fluid-cursor');
  neoFeatureActive = true;
  startFluidCursor();
}
function restartFluidCursor(): void {
  destroyFluidCursor();
  enableFluidCursor();
}
function applyFluidCursorOptions(nextTrailOn: boolean, nextWaveOn: boolean): void {
  const shouldRestart = neoFeatureActive;
  trailOn = nextTrailOn;
  waveOn = nextWaveOn;
  if (shouldRestart) {
    restartFluidCursor();
  }
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
            <input class="b3-switch fn__flex-center" id="neo-fluid-cursor-trail" type="checkbox">
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.fluidCursorWave}</div>
              <div class="b3-label__text">${i18n.fluidCursorWaveTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-fluid-cursor-wave" type="checkbox">
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-fluid-cursor-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-fluid-cursor-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showFluidCursorSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.fluidCursorSettings,
    content: buildFluidCursorSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const trailCheckbox = dialog.element.querySelector('#neo-fluid-cursor-trail') as HTMLInputElement;
  const waveCheckbox = dialog.element.querySelector('#neo-fluid-cursor-wave') as HTMLInputElement;
  if (trailCheckbox) trailCheckbox.checked = trailOn;
  if (waveCheckbox) waveCheckbox.checked = waveOn;
  dialog.element.querySelector('#neo-fluid-cursor-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-fluid-cursor-confirm')?.addEventListener('click', () => {
    if (trailCheckbox && waveCheckbox) {
      saveConfig({
        'fluid-cursor-trail': trailCheckbox.checked,
        'fluid-cursor-wave': waveCheckbox.checked,
      } as Partial<Config>);
      applyFluidCursorOptions(trailCheckbox.checked, waveCheckbox.checked);
    }
    dialog.destroy();
  });
}
export function initFluidCursor(): void {
  if (isMobile()) return;
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    trailOn = config['fluid-cursor-trail'] !== false;
    waveOn = config['fluid-cursor-wave'] !== false;
    if (config['fluid-cursor'] === true) {
      enableFluidCursor();
    }
  });
}
export function onFluidCursorClick(): void {
  if (isMobile()) return;
  if (neoFeatureActive) {
    destroyFluidCursor();
    saveConfig({ 'fluid-cursor': false } as Partial<Config>);
  } else {
    saveConfig({ 'fluid-cursor': true } as Partial<Config>);
    enableFluidCursor();
  }
}
