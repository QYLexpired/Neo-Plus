import { saveConfig, loadConfig, getConfig, type Config } from '../main/data';
import { getPlugin } from '../main/context';
import { getCursorRect, getTextColor, isCursorClipped, getCharWidthAtCursor, hasMeaningfulSelection } from '../modules/getselection';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { Dialog } from '../modules/dialog';
import { createNeoLifecycleGuard } from '../main/lifecycle';
type CaretPosition = { x: number; y: number; width: number; height: number };
type EaseCurve = NonNullable<Config['smoothcaret-ease-curve']>;
type SmoothCaretEase = NonNullable<Config['smoothcaret-ease']>;
const defaultEaseDuration = 750;
const defaultCustomEaseDuration = 300;
const maxEaseDuration = 5000;
const defaultEaseCurve: EaseCurve = [0.1, 0.9, 0.2, 1];
const standardEaseCurves = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
} satisfies Record<string, EaseCurve>;
type StandardEase = keyof typeof standardEaseCurves;
const standardEaseNames = Object.keys(standardEaseCurves) as StandardEase[];
const neoEasePresets = {
  elegant: { duration: defaultEaseDuration, timing: `cubic-bezier(${defaultEaseCurve.join(', ')})` },
  shuttle: { duration: 150, timing: 'var(--neo-ease-out-4, ease-out)' },
  drift: { duration: 150, timing: 'var(--neo-ease-in-3, ease-in)' },
  spring: { duration: 450, timing: 'var(--neo-ease-spring-2, ease-out)' },
};
const easeNames = [...Object.keys(neoEasePresets), 'custom'] as SmoothCaretEase[];
const curveAxes = [
  { name: 'x1', min: 0, max: 1 },
  { name: 'y1', min: -1, max: 2 },
  { name: 'x2', min: 0, max: 1 },
  { name: 'y2', min: -1, max: 2 },
];
const curvePlotInset = 16;
const curvePlotUnit = 180;
const curvePlotHeight = (curveAxes[1].max - curveAxes[1].min) * curvePlotUnit + 2 * curvePlotInset;
const curvePlotWidth = curvePlotUnit + 2 * curvePlotInset;
let smoothCaretEventHandler: (() => void) | null = null;
let throttledCaretEventHandler: (() => void) | null = null;
let resetCaretTrail: (() => void) | null = null;
let syncCaretMaterial: (() => void) | null = null;
let throttleTimer: number | null = null;
let caretAnimationFrame: number | null = null;
let trailAnimationFrame: number | null = null;
let cachedZIndex = 0;
let lastTargetElement: Element | null = null;
let smoothCaretMotion: NonNullable<Config['smoothcaret-motion']> = 'static';
let smoothCaretEase: SmoothCaretEase = 'elegant';
let smoothCaretEaseDuration = defaultCustomEaseDuration;
let smoothCaretEaseCurve = defaultEaseCurve;
let smoothCaretShape: NonNullable<Config['smoothcaret-shape']> = 'bar';
let smoothCaretStyle: NonNullable<Config['smoothcaret-style']> = 'default';
let neoFeatureActive = false;
let configRevision = 0;
const scrollListenerOptions: AddEventListenerOptions = { capture: true, passive: true };
function normalizeSmoothCaretMotion(value: unknown): typeof smoothCaretMotion {
  return value === 'breathing' || value === 'stretch' || value === 'trail' ? value : 'static';
}
function normalizeSmoothCaretEase(value: unknown): typeof smoothCaretEase {
  return typeof value === 'string' && easeNames.includes(value as SmoothCaretEase) ? value as SmoothCaretEase : 'elegant';
}
function getEaseTiming(ease: SmoothCaretEase, duration: number, curve: EaseCurve): { duration: number; timing: string } {
  if (ease === 'custom') return { duration, timing: formatEaseCurve(curve) };
  return neoEasePresets[ease];
}
function normalizeEaseDuration(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(Math.min(maxEaseDuration, Math.max(0, value)))
    : defaultCustomEaseDuration;
}
function clampCurveCoordinate(value: number, index: number): number {
  const { min, max } = curveAxes[index];
  return Math.round(Math.min(max, Math.max(min, value)) * 100) / 100;
}
function normalizeEaseCurve(value: unknown): EaseCurve {
  if (!Array.isArray(value) || value.length !== curveAxes.length) return [...defaultEaseCurve];
  return [0, 1, 2, 3].map(index => {
    const coordinate = value[index];
    return typeof coordinate === 'number' && Number.isFinite(coordinate)
      ? clampCurveCoordinate(coordinate, index)
      : defaultEaseCurve[index];
  }) as EaseCurve;
}
function formatEaseCurve(curve: EaseCurve): string {
  return `cubic-bezier(${curve.join(', ')})`;
}
function normalizeSmoothCaretStyle(value: unknown): typeof smoothCaretStyle {
  return value === 'neon' || value === 'rainbow' || value === 'gilded' ? value : 'default';
}
function normalizeSmoothCaretShape(value: unknown): typeof smoothCaretShape {
  return value === 'block' || value === 'underline' ? value : 'bar';
}
function clearSmoothCaretClasses(): void {
  document.body.classList.remove(
    'neo-smoothcaret-motion-static',
    'neo-smoothcaret-motion-breathing',
    'neo-smoothcaret-motion-stretch',
    'neo-smoothcaret-motion-trail',
    'neo-smoothcaret-shape-bar',
    'neo-smoothcaret-shape-block',
    'neo-smoothcaret-shape-underline',
    'neo-smoothcaret-style-default',
    'neo-smoothcaret-style-neon',
    'neo-smoothcaret-style-rainbow',
    'neo-smoothcaret-style-gilded'
  );
}
function applySmoothCaretOptions(): void {
  clearSmoothCaretClasses();
  document.body.classList.add(
    `neo-smoothcaret-motion-${smoothCaretMotion}`,
    `neo-smoothcaret-shape-${smoothCaretShape}`,
    `neo-smoothcaret-style-${smoothCaretStyle}`
  );
  syncCaretMaterial?.();
  resetCaretTrail?.();
  smoothCaretEventHandler?.();
}
function applySmoothCaretEase(): void {
  const caret = document.getElementById('neo-smoothcaret-item');
  if (caret) {
    const { duration, timing } = getEaseTiming(smoothCaretEase, smoothCaretEaseDuration, smoothCaretEaseCurve);
    caret.style.setProperty('--_smoothcaret-ease', `${duration}ms ${timing}`);
  }
}
function startSmoothCaret(): void {
  const isCurrent = createNeoLifecycleGuard();
  document.getElementById('neo-smoothcaret-item')?.remove();
  const caretElement = document.createElement('div');
  caretElement.id = 'neo-smoothcaret-item';
  caretElement.setAttribute('aria-hidden', 'true');
  caretElement.classList.add('neo-smoothcaret-hidden');
  const trailElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  trailElement.classList.add('neo-smoothcaret-trail');
  trailElement.setAttribute('focusable', 'false');
  const trailShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  trailElement.appendChild(trailShape);
  caretElement.appendChild(trailElement);
  document.body.appendChild(caretElement);
  let materialElement: SVGSVGElement | null = null;
  let materialFilter: SVGFilterElement | null = null;
  let materialBounds = '';
  function updateMaterialBounds(x: number, y: number, width: number, height: number): void {
    if (!materialFilter) return;
    const bounds = [x - 1, y - 1, width + 2, height + 2];
    const key = bounds.join(' ');
    if (materialBounds === key) return;
    materialBounds = key;
    const attributes = ['x', 'y', 'width', 'height'];
    const targets = [materialFilter, ...materialFilter.querySelectorAll('feTurbulence, feFlood')];
    targets.forEach(target => attributes.forEach((attribute, index) => target.setAttribute(attribute, `${bounds[index]}`)));
  }
  syncCaretMaterial = () => {
    if (!neoFeatureActive || !isCurrent() || !caretElement.isConnected) return;
    if (smoothCaretStyle !== 'gilded') {
      materialElement?.remove();
      materialElement = null;
      materialFilter = null;
      materialBounds = '';
      return;
    }
    if (materialElement) return;
    materialElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    materialElement.classList.add('neo-smoothcaret-material');
    materialElement.setAttribute('width', '0');
    materialElement.setAttribute('height', '0');
    materialElement.setAttribute('aria-hidden', 'true');
    materialElement.setAttribute('focusable', 'false');
    materialElement.innerHTML = `<defs>
      <filter id="neo-smoothcaret-gilded-filter" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="23" result="grain"/>
        <feGaussianBlur in="grain" stdDeviation="0.12" result="fine-grain"/>
        <feColorMatrix in="fine-grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3 0 0 0 -0.9" result="pigment"/>
        <feFlood class="neo-smoothcaret-gilded-dark" result="dark"/>
        <feFlood class="neo-smoothcaret-gilded-mid" result="mid"/>
        <feComposite in="mid" in2="pigment" operator="in" result="paint"/>
        <feColorMatrix in="fine-grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 7 0 0 0 -4" result="glints"/>
        <feFlood class="neo-smoothcaret-gilded-light" result="light"/>
        <feComposite in="light" in2="glints" operator="in" result="highlights"/>
        <feMerge><feMergeNode in="dark"/><feMergeNode in="paint"/><feMergeNode in="highlights"/></feMerge>
        <feComposite in2="SourceAlpha" operator="in"/>
      </filter>
    </defs>`;
    materialFilter = materialElement.querySelector('filter');
    caretElement.prepend(materialElement);
  };
  syncCaretMaterial();
  applySmoothCaretEase();
  const cornerOffsets = [[0, 0], [1, 0], [1, 1], [0, 1]];
  let trailCorners: { x: number; y: number }[] = [];
  let trailDestination: CaretPosition | null = null;
  let trailHead: CaretPosition | null = null;
  let trailDirection = { x: 1, y: 0 };
  let trailTime: number | null = null;
  let snapCaretPosition = true;
  let caretVisible = false;
  function resetTrail(): void {
    if (trailAnimationFrame !== null) {
      window.cancelAnimationFrame(trailAnimationFrame);
      trailAnimationFrame = null;
    }
    trailCorners = [];
    trailDestination = null;
    trailHead = null;
    trailTime = null;
    snapCaretPosition = true;
    trailShape.removeAttribute('points');
  }
  resetCaretTrail = resetTrail;
  function hideCaret(): void {
    caretVisible = false;
    resetTrail();
    caretElement.classList.add('neo-smoothcaret-hidden');
  }
  function renderTrail(time: number): void {
    if (!neoFeatureActive || !isCurrent() || !caretElement.isConnected || smoothCaretMotion !== 'trail') return;
    trailAnimationFrame = null;
    if (!caretVisible || !trailDestination) {
      hideCaret();
      return;
    }
    const rect = caretElement.getBoundingClientRect();
    const elapsed = trailTime === null ? 16 : time - trailTime;
    const delta = Math.min(Math.max(elapsed, 0), 32);
    trailTime = time;
    const previousHead = elapsed > 100 ? null : trailHead;
    if (previousHead) {
      const dx = rect.left - previousHead.x;
      const dy = rect.top - previousHead.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0.01) {
        trailDirection = { x: dx / distance, y: dy / distance };
      }
    }
    trailHead = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    let moving = Math.abs(rect.left - trailDestination.x) > 0.05
      || Math.abs(rect.top - trailDestination.y) > 0.05
      || Math.abs(rect.width - trailDestination.width) > 0.05
      || Math.abs(rect.height - trailDestination.height) > 0.05;
    if (smoothCaretMotion === 'trail') {
      const directionScale = Math.abs(trailDirection.x) + Math.abs(trailDirection.y);
      cornerOffsets.forEach(([offsetX, offsetY], index) => {
        const x = rect.left + offsetX * rect.width;
        const y = rect.top + offsetY * rect.height;
        const corner = trailCorners[index];
        if (!corner || elapsed > 100) {
          trailCorners[index] = { x, y };
          return;
        }
        const alignment = ((offsetX * 2 - 1) * trailDirection.x + (offsetY * 2 - 1) * trailDirection.y) / directionScale;
        const lag = (1 - alignment) * 32;
        const follow = lag < 1 ? 1 : 1 - Math.exp(-delta / lag);
        corner.x += (x - corner.x) * follow;
        corner.y += (y - corner.y) * follow;
        if (Math.hypot(x - corner.x, y - corner.y) > 0.1) {
          moving = true;
        } else {
          corner.x = x;
          corner.y = y;
        }
      });
      trailShape.setAttribute('points', trailCorners.map(corner => `${corner.x - rect.left},${corner.y - rect.top}`).join(' '));
      if (materialFilter) {
        const left = Math.min(...trailCorners.map(corner => corner.x)) - rect.left;
        const top = Math.min(...trailCorners.map(corner => corner.y)) - rect.top;
        const right = Math.max(...trailCorners.map(corner => corner.x)) - rect.left;
        const bottom = Math.max(...trailCorners.map(corner => corner.y)) - rect.top;
        updateMaterialBounds(left, top, right - left, bottom - top);
      }
    }
    if (moving) {
      trailAnimationFrame = window.requestAnimationFrame(renderTrail);
    }
  }
  function calculateCaretZIndex(targetElement: Element): number {
    if (targetElement === lastTargetElement) {
      return cachedZIndex;
    }
    let currentElement: Element | null = targetElement;
    let fullscreenZIndex: number | null = null;
    while (currentElement && currentElement !== document.body) {
      if (
        currentElement.classList.contains('b3-dialog') ||
        currentElement.classList.contains('block__popover--open') ||
        currentElement.id === 'commonMenu' ||
        currentElement.classList.contains('av__richtext-mask')
      ) {
        const computedStyle = window.getComputedStyle(currentElement);
        const zIndex = parseInt(computedStyle.zIndex) || 0;
        cachedZIndex = zIndex;
        lastTargetElement = targetElement;
        return zIndex;
      }
      if (currentElement.classList.contains('fullscreen') && fullscreenZIndex === null) {
        const computedStyle = window.getComputedStyle(currentElement);
        fullscreenZIndex = parseInt(computedStyle.zIndex) || 0;
      }
      currentElement = currentElement.parentElement;
    }
    cachedZIndex = fullscreenZIndex !== null ? fullscreenZIndex : 0;
    lastTargetElement = targetElement;
    return cachedZIndex;
  }
  function updateCaretPosition(): void {
    if (!neoFeatureActive || !isCurrent() || !caretElement.isConnected) return;
    caretAnimationFrame = null;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || hasMeaningfulSelection(sel)) {
      hideCaret();
      return;
    }
    const focusElement = sel?.focusNode?.nodeType === Node.ELEMENT_NODE
      ? sel.focusNode as Element
      : sel?.focusNode?.parentElement;
    if (focusElement?.closest('.mindmap-view')) {
      hideCaret();
      return;
    }
    if (focusElement?.classList?.contains('av__cursor')) {
      hideCaret();
      return;
    }
    const isSelfContentEditableFalse = focusElement?.getAttribute?.('contenteditable') === 'false';
    if (isSelfContentEditableFalse) {
      hideCaret();
      return;
    }
    const targetElement =
      focusElement?.closest('[contenteditable="true"]') ||
      (focusElement?.closest('.protyle-title') ? focusElement : null);
    if (sel?.rangeCount && targetElement) {
      const rect = getCursorRect();
      if (rect) {
        if (isCursorClipped(rect, sel.focusNode)) {
          hideCaret();
          return;
        }
        const isUnderline = smoothCaretShape === 'underline';
        const needsCharWidth = smoothCaretShape !== 'bar';
        const charWidth = needsCharWidth ? getCharWidthAtCursor() : null;
        const x = needsCharWidth ? rect.left : rect.left - 0.75;
        const y = isUnderline ? rect.top + rect.height * 1.05 : rect.top - rect.height * 0.025;
        const width = needsCharWidth ? charWidth ?? rect.height * 0.6 : 2;
        const height = isUnderline ? 2 : rect.height * 1.05;
        const snap = smoothCaretMotion === 'trail'
          && (snapCaretPosition || !caretVisible);
        if (snap) {
          resetTrail();
          caretElement.classList.add('neo-smoothcaret-snap');
        }
        caretVisible = true;
        caretElement.classList.remove('neo-smoothcaret-hidden');
        caretElement.style.translate = `${x}px ${y}px`;
        caretElement.style.height = `${height}px`;
        caretElement.style.width = needsCharWidth ? `${width}px` : '';
        if (smoothCaretMotion !== 'trail') updateMaterialBounds(0, 0, width, height);
        const baseZIndex = calculateCaretZIndex(targetElement);
        caretElement.style.zIndex = (baseZIndex + 1).toString();
        const textColor = getTextColor(sel.focusNode, targetElement);
        if (textColor) {
          caretElement.style.setProperty('--_smoothcaret-color', textColor);
        } else {
          caretElement.style.removeProperty('--_smoothcaret-color');
        }
        if (smoothCaretMotion === 'trail') {
          snapCaretPosition = false;
          trailDestination = { x, y, width, height };
          if (trailAnimationFrame === null) renderTrail(performance.now());
        }
        caretElement.classList.remove('neo-smoothcaret-snap');
        return;
      }
    }
    hideCaret();
  }
  function handleCaretUpdateTrigger(): void {
    if (!neoFeatureActive || !isCurrent()) return;
    if (caretAnimationFrame === null) {
      caretAnimationFrame = window.requestAnimationFrame(updateCaretPosition);
    }
  }
  function handleThrottledCaretUpdate(): void {
    handleCaretUpdateTrigger();
    if (throttleTimer !== null) clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(() => {
      throttleTimer = null;
      handleCaretUpdateTrigger();
      throttleTimer = window.setTimeout(() => {
        throttleTimer = null;
        handleCaretUpdateTrigger();
        throttleTimer = window.setTimeout(() => {
          throttleTimer = null;
          handleCaretUpdateTrigger();
        }, 200);
      }, 200);
    }, 200);
  }
  throttledCaretEventHandler = handleThrottledCaretUpdate;
  smoothCaretEventHandler = handleCaretUpdateTrigger;
  document.addEventListener('selectionchange', handleCaretUpdateTrigger);
  document.addEventListener('scroll', handleCaretUpdateTrigger, scrollListenerOptions);
  document.addEventListener('keyup', handleThrottledCaretUpdate, true);
  document.addEventListener('mouseup', handleThrottledCaretUpdate, true);
  updateCaretPosition();
}
function enableSmoothCaret(): void {
  if (neoFeatureActive) return;
  ensureCss('extension-smoothcaret', featureCss['extension-smoothcaret']);
  document.documentElement.classList.add('neo-smoothcaret');
  neoFeatureActive = true;
  applySmoothCaretOptions();
  startSmoothCaret();
}
function getEaseLabel(i18n: Record<string, string>, ease: SmoothCaretEase | StandardEase): string {
  const suffix = ease.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
  return i18n[`smoothCaretEase${suffix}`];
}
function buildEaseCurveEditorHTML(i18n: Record<string, string>): string {
  const presets = standardEaseNames.map(ease => {
    const [x1, y1, x2, y2] = standardEaseCurves[ease];
    const label = getEaseLabel(i18n, ease);
    return `<button class="neo-smoothcaret-curve-preset" type="button" data-ease="${ease}" title="${label}" aria-label="${label}" aria-pressed="false"
      style="display:grid;place-items:center;width:40px;height:40px;padding:0;border:0;border-radius:0;background:none;color:var(--b3-theme-on-surface);cursor:pointer;">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <path d="M 4 28 C ${4 + 24 * x1} ${28 - 24 * y1} ${4 + 24 * x2} ${28 - 24 * y2} 28 4"
          style="fill:none;stroke:currentColor;stroke-width:2px;stroke-linecap:round;vector-effect:non-scaling-stroke;" />
      </svg>
    </button>`;
  }).join('');
  return `<div class="neo-smoothcaret-curve-editor" style="display:grid;grid-template-columns:max-content minmax(0,max-content);width:fit-content;max-width:100%;margin-inline:auto;gap:10px;">
    <div class="neo-smoothcaret-curve-presets" role="group" aria-label="${i18n.smoothCaretEasePresets}" style="display:grid;align-content:space-evenly;gap:4px;">${presets}</div>
    <div class="neo-smoothcaret-curve-main">
      <svg class="neo-smoothcaret-curve-plot" width="${curvePlotWidth}" height="${curvePlotHeight}" viewBox="0 0 ${curvePlotWidth} ${curvePlotHeight}" aria-hidden="true"
        style="display:block;width:auto;height:auto;max-width:100%;max-height:calc(90vh - 208px);background-color:var(--b3-list-hover);">
        <rect class="neo-smoothcaret-curve-grid" fill="none" stroke-opacity="0.35" style="stroke:var(--b3-theme-on-surface);" />
        <line class="neo-smoothcaret-curve-baseline" stroke-opacity="0.35" style="stroke:var(--b3-theme-on-surface);" />
        <path class="neo-smoothcaret-curve-path" style="fill:none;stroke:var(--b3-theme-accent);stroke-width:2px;" />
        <g stroke-opacity="0.65" stroke-dasharray="4 3" style="stroke:var(--b3-theme-accent);">
          <line class="neo-smoothcaret-curve-guide" />
          <line class="neo-smoothcaret-curve-guide" />
        </g>
        <g style="fill:var(--b3-theme-accent);stroke:var(--b3-theme-surface);cursor:grab;touch-action:none;">
          <circle class="neo-smoothcaret-curve-handle" r="8" />
          <circle class="neo-smoothcaret-curve-handle" r="8" />
        </g>
      </svg>
    </div>
  </div>`;
}
function bindEaseCurveEditor(editor: HTMLElement, initialCurve: EaseCurve, onChange: (curve: EaseCurve) => void): () => EaseCurve {
  const plot = editor.querySelector<SVGSVGElement>('.neo-smoothcaret-curve-plot')!;
  const grid = plot.querySelector('rect')!;
  const path = plot.querySelector('path')!;
  const baseline = plot.querySelector<SVGLineElement>('.neo-smoothcaret-curve-baseline')!;
  const guides = Array.from(plot.querySelectorAll<SVGLineElement>('.neo-smoothcaret-curve-guide'));
  const handles = Array.from(plot.querySelectorAll('circle'));
  const presets = Array.from(editor.querySelectorAll<HTMLButtonElement>('.neo-smoothcaret-curve-preset'));
  let curve: EaseCurve = [...initialCurve];
  const maxY = curveAxes[1].max;
  const unit = curvePlotUnit;
  const startX = curvePlotInset;
  const endX = startX + unit;
  const projectY = (y: number) => curvePlotInset + (maxY - y) * unit;
  const startY = projectY(0);
  const endY = projectY(1);
  grid.setAttribute('x', String(startX));
  grid.setAttribute('y', String(endY));
  grid.setAttribute('width', String(unit));
  grid.setAttribute('height', String(unit));
  baseline.setAttribute('x1', String(startX));
  baseline.setAttribute('y1', String(startY));
  baseline.setAttribute('x2', String(endX));
  baseline.setAttribute('y2', String(endY));
  guides[0].setAttribute('x1', String(startX));
  guides[0].setAttribute('y1', String(startY));
  guides[1].setAttribute('x1', String(endX));
  guides[1].setAttribute('y1', String(endY));
  let drag: { pointerId: number; pointIndex: number } | null = null;
  const render = (): void => {
    const [x1, y1, x2, y2] = curve;
    const firstX = startX + x1 * unit;
    const secondX = startX + x2 * unit;
    const firstY = projectY(y1);
    const secondY = projectY(y2);
    path.setAttribute('d', `M ${startX} ${startY} C ${firstX} ${firstY} ${secondX} ${secondY} ${endX} ${endY}`);
    const points = [[firstX, firstY], [secondX, secondY]];
    points.forEach(([x, y], index) => {
      handles[index].setAttribute('cx', String(x));
      handles[index].setAttribute('cy', String(y));
      guides[index].setAttribute('x2', String(x));
      guides[index].setAttribute('y2', String(y));
    });
    presets.forEach(button => {
      const preset = standardEaseCurves[button.dataset.ease as StandardEase];
      const selected = preset.every((value, index) => value === curve[index]);
      button.setAttribute('aria-pressed', String(selected));
    });
  };
  const update = (): void => {
    render();
    onChange(curve);
  };
  presets.forEach(button => button.addEventListener('click', () => {
    curve = [...standardEaseCurves[button.dataset.ease as StandardEase]];
    update();
  }));
  handles.forEach((handle, index) => handle.addEventListener('pointerdown', event => {
    if (drag || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    plot.setPointerCapture(event.pointerId);
    drag = { pointerId: event.pointerId, pointIndex: index * 2 };
  }));
  plot.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const matrix = plot.getScreenCTM();
    if (!matrix) return;
    const { x, y } = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const { pointIndex } = drag;
    curve[pointIndex] = clampCurveCoordinate((x - startX) / unit, pointIndex);
    curve[pointIndex + 1] = clampCurveCoordinate((startY - y) / unit, pointIndex + 1);
    update();
  });
  plot.addEventListener('lostpointercapture', event => {
    if (drag?.pointerId === event.pointerId) drag = null;
  });
  render();
  return () => curve;
}
function bindEaseCurveFields(editor: HTMLElement, initialCurve: EaseCurve, onChange: (curve: EaseCurve) => void) {
  const inputs = Array.from(editor.querySelectorAll<HTMLInputElement>('.neo-smoothcaret-curve-fields input'));
  const setInvalid = (input: HTMLInputElement, invalid: boolean): void => {
    input.setAttribute('aria-invalid', String(invalid));
    input.style.color = invalid ? 'var(--b3-theme-error)' : '';
  };
  const writeValues = (curve: EaseCurve): void => {
    inputs.forEach((input, index) => {
      input.value = String(curve[index]);
      setInvalid(input, false);
    });
  };
  const readCoordinate = (input: HTMLInputElement, index: number): number | null => {
    const value = input.valueAsNumber;
    const valid = Number.isFinite(value) && input.validity.valid;
    setInvalid(input, !valid);
    return valid ? clampCurveCoordinate(value, index) : null;
  };
  const readValues = (): EaseCurve | null => {
    const values = inputs.map(readCoordinate);
    return values.some(value => value === null) ? null : values as EaseCurve;
  };
  inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      const values = readValues();
      if (!values) return;
      onChange(values);
    });
    input.addEventListener('blur', () => {
      const value = readCoordinate(input, index);
      if (value !== null) input.value = String(value);
    });
  });
  writeValues(initialCurve);
  return { read: readValues, write: writeValues };
}
function showEaseCurveDialog(i18n: Record<string, string>, curve: EaseCurve, duration: number, onConfirm: (curve: EaseCurve) => void, destroyCallback: () => void): Dialog {
  let stopPreview: (() => void) | undefined;
  const dialog = new Dialog({
    title: i18n.smoothCaretEaseCurve,
    width: '420px',
    content: `<div class="b3-dialog__content">
        ${buildEasePreviewHTML(i18n)}
        <div style="margin-top:12px;">${buildEaseCurveEditorHTML(i18n)}</div>
      </div>
      <div class="b3-dialog__action">
        <button type="button" class="b3-button b3-button--cancel" id="neo-smoothcaret-curve-cancel">${i18n.cancel}</button>
        <span class="fn__space"></span>
        <button type="button" class="b3-button b3-button--text" id="neo-smoothcaret-curve-confirm">${i18n.confirm}</button>
      </div>`,
    destroyCallback: () => {
      stopPreview?.();
      destroyCallback();
    },
  });
  dialog.element.classList.add('neo-settings-dialog');
  const preview = bindEasePreview(dialog.element.querySelector<HTMLElement>('.neo-smoothcaret-ease-track')!);
  stopPreview = preview.stop;
  const readCurve = bindEaseCurveEditor(dialog.element, curve, draft => preview.update(duration, formatEaseCurve(draft), false));
  preview.update(duration, formatEaseCurve(curve), true);
  dialog.element.querySelector('#neo-smoothcaret-curve-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-smoothcaret-curve-confirm')?.addEventListener('click', () => {
    if (dialog.element.isConnected) onConfirm(readCurve());
    dialog.destroy();
  });
  return dialog;
}
function bindEasePreview(cursor: HTMLElement) {
  let animation: Animation | null = null;
  return {
    update(duration: number, timing: string, restart: boolean): void {
      const movement = Math.max(1, duration);
      const lead = 180;
      const cycle = lead + movement + 320;
      cursor.style.animationTimingFunction = timing;
      const easing = duration === 0 ? 'steps(1, end)' : getComputedStyle(cursor).animationTimingFunction;
      const keyframes: Keyframe[] = [
        { transform: 'translateX(0%)', offset: 0 },
        { transform: 'translateX(0%)', offset: lead / cycle, easing },
        { transform: 'translateX(100%)', offset: (lead + movement) / cycle },
        { transform: 'translateX(100%)', offset: 1 },
      ];
      const effect = animation?.effect as KeyframeEffect | null | undefined;
      if (effect && animation) {
        effect.setKeyframes(keyframes);
        effect.updateTiming({ duration: cycle });
        if (restart) animation.currentTime = 0;
      } else {
        animation = cursor.animate(keyframes, { duration: cycle, iterations: Infinity });
      }
    },
    stop(): void {
      animation?.cancel();
      animation = null;
    },
  };
}
function buildEasePreviewHTML(i18n: Record<string, string>): string {
  const previewText = i18n.smoothCaretEasePreviewText;
  const previewStart = 'Ne'.length;
  const previewEnd = previewText.length - 'es.'.length;
  return `<div class="config-name">${i18n.smoothCaretEasePreview}</div>
    <div class="neo-smoothcaret-ease-preview" aria-hidden="true" style="display:grid;grid-template-columns:minmax(0,1fr);place-items:center;container-type:inline-size;height:38px;margin-top:8px;padding-inline:clamp(24px,15%,72px);overflow:hidden;border-radius:6px;background-color:var(--b3-list-hover);">
      <span dir="ltr" style="display:block;width:max-content;white-space:nowrap;font-size:1em;line-height:22px;color:var(--b3-theme-on-surface);">${previewText.slice(0, previewStart)}<span style="position:relative;display:inline-block;">${previewText.slice(previewStart, previewEnd)}<span class="neo-smoothcaret-ease-track" style="position:absolute;inset:0;pointer-events:none;">
        <span class="neo-smoothcaret-ease-cursor" style="position:absolute;left:-1px;top:50%;translate:0 -50%;width:2px;height:1em;border-radius:1px;background-color:var(--b3-theme-accent);"></span>
      </span></span>${previewText.slice(previewEnd)}</span>
    </div>`;
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const easeOptions = easeNames
    .map(ease => `<option value="${ease}">${getEaseLabel(i18n, ease)}</option>`)
    .join('');
  const motionOptions = ['static', 'breathing', 'stretch', 'trail']
    .map(v => `<option value="${v}">${i18n[`smoothCaretMotion${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  const shapeOptions = ['bar', 'block', 'underline']
    .map(v => `<option value="${v}">${i18n[`smoothCaretShape${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  const styleOptions = ['default', 'neon', 'rainbow', 'gilded']
    .map(v => `<option value="${v}">${i18n[`smoothCaretStyle${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.smoothCaretEase}</div>
              <div class="b3-label__text">${i18n.smoothCaretEaseTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-smoothcaret-ease">
              ${easeOptions}
            </select>
          </label>
          <div class="b3-label config-item">
            ${buildEasePreviewHTML(i18n)}
          </div>
          <div id="neo-smoothcaret-ease-custom" class="fn__none">
            <label class="fn__flex b3-label config-item">
              <span class="fn__flex-1 config-name">${i18n.smoothCaretEaseDuration}</span>
              <span class="fn__space"></span>
              <input class="b3-text-field fn__flex-center fn__size200" id="neo-smoothcaret-ease-duration" type="number" min="0" max="${maxEaseDuration}" step="1" required>
            </label>
            <div id="neo-smoothcaret-ease-curve" role="group" aria-labelledby="neo-smoothcaret-ease-curve-title">
              <div class="fn__flex b3-label config-item" style="flex-wrap:wrap;row-gap:6px;">
                <span class="fn__flex-1 config-name" id="neo-smoothcaret-ease-curve-title">${i18n.smoothCaretEaseCurve}</span>
                <span class="fn__space"></span>
                <div class="fn__flex-center" style="display:flex;align-items:flex-start;gap:8px;width:min(100%,326px);flex:none;margin-inline-start:auto;">
                  <button type="button" class="block__icon block__icon--show ariaLabel" id="neo-smoothcaret-curve-open" aria-label="${i18n.smoothCaretEaseCurve}" aria-haspopup="dialog" style="flex:none;">
                    <svg viewBox="0 0 24 24" aria-hidden="true" style="width:18px;height:18px;">
                      <path d="M3 19L14 21M21 5L10 3" style="fill:none;stroke:currentColor;stroke-width:1.25;stroke-opacity:0.6;stroke-dasharray:2 1.5;" />
                      <path d="M3 19C14 21 10 3 21 5" style="fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;" />
                      <circle cx="14" cy="21" r="2" style="fill:currentColor;" /><circle cx="10" cy="3" r="2" style="fill:currentColor;" />
                    </svg>
                  </button>
                  <div class="neo-smoothcaret-curve-fields" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,68px),1fr));gap:6px;flex:1;min-width:0;">
                    ${curveAxes.map(({ name, min, max }) => `<input class="b3-text-field" type="number" min="${min}" max="${max}" step="0.01" aria-label="${i18n.smoothCaretEaseCurveValue} ${name}" autocomplete="off" style="width:100%;min-width:0;padding-inline:6px;font-variant-numeric:tabular-nums;text-align:center;">`).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.smoothCaretMotion}</div>
              <div class="b3-label__text">${i18n.smoothCaretMotionTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-smoothcaret-motion">
              ${motionOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.smoothCaretShape}</div>
              <div class="b3-label__text">${i18n.smoothCaretShapeTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-smoothcaret-shape">
              ${shapeOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.smoothCaretStyle}</div>
              <div class="b3-label__text">${i18n.smoothCaretStyleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-smoothcaret-style">
              ${styleOptions}
            </select>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-smoothcaret-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-smoothcaret-confirm">${i18n.confirm}</button>
  </div>`;
}
export async function showSmoothCaretSettings(): Promise<void> {
  const plugin = getPlugin();
  if (!plugin) return;
  const isCurrent = createNeoLifecycleGuard();
  await loadConfig();
  if (!isCurrent()) return;
  const config = getConfig();
  const initialSmoothCaretMotion = normalizeSmoothCaretMotion(config['smoothcaret-motion']);
  const initialSmoothCaretEase = normalizeSmoothCaretEase(config['smoothcaret-ease']);
  const initialEaseDuration = normalizeEaseDuration(config['smoothcaret-ease-duration']);
  const initialEaseCurve = normalizeEaseCurve(config['smoothcaret-ease-curve']);
  const initialSmoothCaretShape = normalizeSmoothCaretShape(config['smoothcaret-shape']);
  const initialSmoothCaretStyle = normalizeSmoothCaretStyle(config['smoothcaret-style']);
  let stopPreview: (() => void) | undefined;
  let curveDialog: Dialog | null = null;
  const dialog = new Dialog({
    title: plugin.i18n.smoothCaretSettings,
    content: buildSettingsHTML(plugin.i18n),
    destroyCallback: () => {
      curveDialog?.destroy();
      stopPreview?.();
    },
  });
  dialog.element.classList.add('neo-settings-dialog');
  const easeSelect = dialog.element.querySelector<HTMLSelectElement>('#neo-smoothcaret-ease')!;
  const customEase = dialog.element.querySelector<HTMLElement>('#neo-smoothcaret-ease-custom')!;
  const easeDurationInput = customEase.querySelector<HTMLInputElement>('#neo-smoothcaret-ease-duration')!;
  const preview = bindEasePreview(dialog.element.querySelector<HTMLElement>('.neo-smoothcaret-ease-track')!);
  stopPreview = preview.stop;
  let draftDuration = initialEaseDuration;
  let draftCurve = initialEaseCurve;
  const updatePreview = (restart = false): void => {
    const { duration, timing } = getEaseTiming(normalizeSmoothCaretEase(easeSelect.value), draftDuration, draftCurve);
    preview.update(duration, timing, restart);
  };
  const curveEditor = customEase.querySelector<HTMLElement>('#neo-smoothcaret-ease-curve')!;
  const updateDraftCurve = (curve: EaseCurve): void => {
    draftCurve = curve;
    updatePreview();
  };
  const curveFields = bindEaseCurveFields(curveEditor, initialEaseCurve, updateDraftCurve);
  const canEditCurve = (): boolean => isCurrent() && dialog.element.isConnected && easeSelect.value === 'custom';
  curveEditor.querySelector('#neo-smoothcaret-curve-open')?.addEventListener('click', () => {
    if (curveDialog || !canEditCurve()) return;
    curveDialog = showEaseCurveDialog(plugin.i18n, curveFields.read() ?? draftCurve, draftDuration, curve => {
      if (!canEditCurve()) return;
      curveFields.write(curve);
      updateDraftCurve(curve);
    }, () => { curveDialog = null; });
  });
  const motionSelect = dialog.element.querySelector('#neo-smoothcaret-motion') as HTMLSelectElement;
  const shapeSelect = dialog.element.querySelector('#neo-smoothcaret-shape') as HTMLSelectElement;
  const styleSelect = dialog.element.querySelector('#neo-smoothcaret-style') as HTMLSelectElement;
  easeSelect.value = initialSmoothCaretEase;
  easeDurationInput.value = String(initialEaseDuration);
  const updateCustomEaseVisibility = (): void => {
    const custom = easeSelect.value === 'custom';
    customEase.classList.toggle('fn__none', !custom);
    if (!custom) curveDialog?.destroy();
    updatePreview(true);
  };
  easeSelect.addEventListener('change', updateCustomEaseVisibility);
  easeDurationInput.addEventListener('input', () => {
    if (!easeDurationInput.validity.valid) return;
    draftDuration = easeDurationInput.valueAsNumber;
    updatePreview();
  });
  updateCustomEaseVisibility();
  if (motionSelect) motionSelect.value = initialSmoothCaretMotion;
  if (shapeSelect) shapeSelect.value = initialSmoothCaretShape;
  if (styleSelect) styleSelect.value = initialSmoothCaretStyle;
  dialog.element.querySelector('#neo-smoothcaret-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-smoothcaret-confirm')?.addEventListener('click', () => {
    if (!isCurrent() || !dialog.element.isConnected) {
      dialog.destroy();
      return;
    }
    const newEase = normalizeSmoothCaretEase(easeSelect.value);
    const newMotion = normalizeSmoothCaretMotion(motionSelect?.value);
    const newShape = normalizeSmoothCaretShape(shapeSelect?.value);
    const newStyle = normalizeSmoothCaretStyle(styleSelect?.value);
    const editedEase = newEase !== initialSmoothCaretEase;
    const editedMotion = motionSelect && newMotion !== initialSmoothCaretMotion;
    const editedShape = shapeSelect && newShape !== initialSmoothCaretShape;
    const editedStyle = styleSelect && newStyle !== initialSmoothCaretStyle;
    const patch: Partial<Config> = {};
    if (newEase === 'custom') {
      if (!easeDurationInput.reportValidity()) return;
      const curve = curveFields.read();
      if (!curve) return;
      const duration = normalizeEaseDuration(easeDurationInput.valueAsNumber);
      if (duration !== initialEaseDuration) {
        smoothCaretEaseDuration = duration;
        patch['smoothcaret-ease-duration'] = duration;
      }
      if (curve.some((coordinate, index) => coordinate !== initialEaseCurve[index])) {
        smoothCaretEaseCurve = curve;
        patch['smoothcaret-ease-curve'] = curve;
      }
    }
    if (editedEase) {
      smoothCaretEase = newEase;
      patch['smoothcaret-ease'] = newEase;
    }
    if (editedMotion) {
      smoothCaretMotion = newMotion;
      patch['smoothcaret-motion'] = newMotion;
    }
    if (editedShape) {
      smoothCaretShape = newShape;
      patch['smoothcaret-shape'] = newShape;
    }
    if (editedStyle) {
      smoothCaretStyle = newStyle;
      patch['smoothcaret-style'] = newStyle;
    }
    if (Object.keys(patch).length > 0) saveConfig(patch);
    if (neoFeatureActive) {
      if (editedEase || (smoothCaretEase === 'custom' && (patch['smoothcaret-ease-duration'] !== undefined || patch['smoothcaret-ease-curve']))) {
        applySmoothCaretEase();
      }
      if (editedMotion || editedShape || editedStyle) applySmoothCaretOptions();
    }
    dialog.destroy();
  });
}
export function destroySmoothCaret(): void {
  neoFeatureActive = false;
  configRevision += 1;
  resetCaretTrail?.();
  resetCaretTrail = null;
  syncCaretMaterial = null;
  removeCss('extension-smoothcaret');
  document.getElementById('neo-smoothcaret-item')?.remove();
  document.documentElement.classList.remove('neo-smoothcaret');
  clearSmoothCaretClasses();
  if (throttleTimer !== null) {
    clearTimeout(throttleTimer);
    throttleTimer = null;
  }
  if (caretAnimationFrame !== null) {
    window.cancelAnimationFrame(caretAnimationFrame);
    caretAnimationFrame = null;
  }
  cachedZIndex = 0;
  lastTargetElement = null;
  if (smoothCaretEventHandler) {
    document.removeEventListener('selectionchange', smoothCaretEventHandler);
    document.removeEventListener('scroll', smoothCaretEventHandler, scrollListenerOptions);
    smoothCaretEventHandler = null;
  }
  if (throttledCaretEventHandler) {
    document.removeEventListener('keyup', throttledCaretEventHandler, true);
    document.removeEventListener('mouseup', throttledCaretEventHandler, true);
    throttledCaretEventHandler = null;
  }
}
export function initSmoothCaret(): Promise<void> {
  const revision = ++configRevision;
  const isCurrent = createNeoLifecycleGuard();
  return loadConfig().then(() => {
    if (!isCurrent()) return;
    const config = getConfig();
    smoothCaretMotion = normalizeSmoothCaretMotion(config['smoothcaret-motion']);
    smoothCaretEase = normalizeSmoothCaretEase(config['smoothcaret-ease']);
    smoothCaretEaseDuration = normalizeEaseDuration(config['smoothcaret-ease-duration']);
    smoothCaretEaseCurve = normalizeEaseCurve(config['smoothcaret-ease-curve']);
    smoothCaretShape = normalizeSmoothCaretShape(config['smoothcaret-shape']);
    smoothCaretStyle = normalizeSmoothCaretStyle(config['smoothcaret-style']);
    if (neoFeatureActive) {
      applySmoothCaretEase();
      applySmoothCaretOptions();
    } else if (revision === configRevision && config['smoothcaret'] === true) {
      enableSmoothCaret();
    }
  });
}
export function onSmoothCaretClick(): void {
  configRevision += 1;
  if (neoFeatureActive) {
    destroySmoothCaret();
    saveConfig({ 'smoothcaret': false });
  } else {
    enableSmoothCaret();
    saveConfig({ 'smoothcaret': true });
  }
}
