import { saveConfig, loadConfig, getConfig, type Config } from '../main/data';
import { getPlugin } from '../main/context';
import { getCursorRect, getTextColor, getScrollContainer, getCharWidthAtCursor, hasMeaningfulSelection } from '../modules/getselection';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { Dialog } from '../modules/dialog';
import { createNeoLifecycleGuard } from '../main/lifecycle';
type CaretPosition = { x: number; y: number; width: number; height: number };
let smoothCaretEventHandler: (() => void) | null = null;
let throttledCaretEventHandler: (() => void) | null = null;
let resetCaretTrail: (() => void) | null = null;
let syncCaretMaterial: (() => void) | null = null;
let throttleTimer: number | null = null;
let caretAnimationFrame: number | null = null;
let trailAnimationFrame: number | null = null;
let cachedZIndex = 0;
let lastTargetElement: Element | null = null;
let cachedScrollContainer: HTMLElement | null = null;
let cachedFocusElement: Element | null = null;
let smoothCaretMotion: NonNullable<Config['smoothcaret-motion']> = 'static';
let smoothCaretEase: 'elegant' | 'shuttle' | 'drift' | 'spring' = 'elegant';
let smoothCaretStyle: NonNullable<Config['smoothcaret-style']> = 'default';
let neoFeatureActive = false;
let configRevision = 0;
const scrollListenerOptions: AddEventListenerOptions = { capture: true, passive: true };
function normalizeSmoothCaretMotion(value: unknown): typeof smoothCaretMotion {
  return value === 'breathing' || value === 'stretch' || value === 'trail' ? value : 'static';
}
function normalizeSmoothCaretEase(value: unknown): typeof smoothCaretEase {
  return value === 'shuttle' || value === 'drift' || value === 'spring' ? value : 'elegant';
}
function normalizeSmoothCaretStyle(value: unknown): typeof smoothCaretStyle {
  return value === 'neon' || value === 'rainbow' || value === 'block' || value === 'underline' || value === 'gilded' ? value : 'default';
}
function applySmoothCaretMotion(): void {
  document.body.classList.remove(
    'neo-smoothcaret-motion-static',
    'neo-smoothcaret-motion-breathing',
    'neo-smoothcaret-motion-stretch',
    'neo-smoothcaret-motion-trail'
  );
  document.body.classList.add(`neo-smoothcaret-motion-${smoothCaretMotion}`);
  resetCaretTrail?.();
  smoothCaretEventHandler?.();
}
function applySmoothCaretStyle(): void {
  document.body.classList.remove(
    'neo-smoothcaret-style-default',
    'neo-smoothcaret-style-neon',
    'neo-smoothcaret-style-rainbow',
    'neo-smoothcaret-style-block',
    'neo-smoothcaret-style-underline',
    'neo-smoothcaret-style-gilded'
  );
  document.body.classList.add(`neo-smoothcaret-style-${smoothCaretStyle}`);
  syncCaretMaterial?.();
  resetCaretTrail?.();
  smoothCaretEventHandler?.();
}
function applySmoothCaretEase(): void {
  const easeMap: Record<string, string> = {
    elegant: '0.75s cubic-bezier(0.1, 0.9, 0.2, 1)',
    shuttle: '0.15s var(--neo-ease-out-4)',
    drift: '0.15s var(--neo-ease-in-3)',
    spring: '0.45s var(--neo-ease-spring-2)',
  };
  const caret = document.getElementById('neo-smoothcaret-item');
  if (caret) {
    caret.style.setProperty('--_smoothcaret-ease', easeMap[smoothCaretEase] || easeMap.elegant);
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
        if (focusElement !== cachedFocusElement) {
          cachedFocusElement = focusElement ?? null;
          cachedScrollContainer = getScrollContainer();
        }
        if (cachedScrollContainer) {
          const containerRect = cachedScrollContainer.getBoundingClientRect();
          const isInScrollContainer =
            rect.left >= containerRect.left &&
            rect.top >= containerRect.top &&
            rect.right <= containerRect.right &&
            rect.bottom <= containerRect.bottom;
          if (!isInScrollContainer) {
            hideCaret();
            return;
          }
        }
        const needsCharWidth = smoothCaretStyle === 'block' || smoothCaretStyle === 'underline';
        const charWidth = needsCharWidth ? getCharWidthAtCursor() : null;
        const x = needsCharWidth ? rect.left : rect.left - 0.75;
        const y = smoothCaretStyle === 'underline' ? rect.top + rect.height * 1.05 : rect.top - rect.height * 0.025;
        const width = needsCharWidth ? charWidth ?? rect.height * 0.6 : 2;
        const height = smoothCaretStyle === 'underline' ? 2 : rect.height * 1.05;
        const snap = smoothCaretMotion === 'trail'
          && (snapCaretPosition || !caretVisible);
        if (snap) {
          resetTrail();
          caretElement.classList.add('neo-smoothcaret-snap');
        }
        caretVisible = true;
        caretElement.classList.remove('neo-smoothcaret-hidden');
        caretElement.style.translate = `${x}px ${y}px`;
        caretElement.style.height = smoothCaretStyle === 'underline' ? `${Math.min(rect.height * 0.15, 3)}px` : `${rect.height * 1.05}px`;
        caretElement.style.width = needsCharWidth ? `${charWidth ?? rect.height * 0.6}px` : '';
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
  document.addEventListener('keyup', handleThrottledCaretUpdate);
  document.addEventListener('mouseup', handleThrottledCaretUpdate);
  updateCaretPosition();
}
function enableSmoothCaret(): void {
  if (neoFeatureActive) return;
  ensureCss('extension-smoothcaret', featureCss['extension-smoothcaret']);
  document.documentElement.classList.add('neo-smoothcaret');
  neoFeatureActive = true;
  applySmoothCaretMotion();
  applySmoothCaretStyle();
  startSmoothCaret();
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const easeOptions = ['elegant', 'shuttle', 'drift', 'spring']
    .map(v => `<option value="${v}">${i18n[`smoothCaretEase${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  const motionOptions = ['static', 'breathing', 'stretch', 'trail']
    .map(v => `<option value="${v}">${i18n[`smoothCaretMotion${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  const styleOptions = ['default', 'neon', 'rainbow', 'block', 'underline', 'gilded']
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
  const initialSmoothCaretStyle = normalizeSmoothCaretStyle(config['smoothcaret-style']);
  const dialog = new Dialog({
    title: plugin.i18n.smoothCaretSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const easeSelect = dialog.element.querySelector('#neo-smoothcaret-ease') as HTMLSelectElement;
  const motionSelect = dialog.element.querySelector('#neo-smoothcaret-motion') as HTMLSelectElement;
  const styleSelect = dialog.element.querySelector('#neo-smoothcaret-style') as HTMLSelectElement;
  if (easeSelect) easeSelect.value = initialSmoothCaretEase;
  if (motionSelect) motionSelect.value = initialSmoothCaretMotion;
  if (styleSelect) styleSelect.value = initialSmoothCaretStyle;
  dialog.element.querySelector('#neo-smoothcaret-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-smoothcaret-confirm')?.addEventListener('click', () => {
    if (!isCurrent() || !dialog.element.isConnected) {
      dialog.destroy();
      return;
    }
    if (easeSelect) {
      const newEase = normalizeSmoothCaretEase(easeSelect.value);
      if (newEase !== initialSmoothCaretEase) {
        smoothCaretEase = newEase;
        saveConfig({ 'smoothcaret-ease': newEase });
        if (neoFeatureActive) {
          applySmoothCaretEase();
        }
      }
    }
    if (motionSelect) {
      const newMotion = normalizeSmoothCaretMotion(motionSelect.value);
      if (newMotion !== initialSmoothCaretMotion) {
        smoothCaretMotion = newMotion;
        saveConfig({ 'smoothcaret-motion': newMotion });
        if (neoFeatureActive) {
          applySmoothCaretMotion();
        }
      }
    }
    if (styleSelect) {
      const newStyle = normalizeSmoothCaretStyle(styleSelect.value);
      if (newStyle !== initialSmoothCaretStyle) {
        smoothCaretStyle = newStyle;
        saveConfig({ 'smoothcaret-style': newStyle });
        if (neoFeatureActive) {
          applySmoothCaretStyle();
        }
      }
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
  document.body.classList.remove(
    'neo-smoothcaret-motion-static',
    'neo-smoothcaret-motion-breathing',
    'neo-smoothcaret-motion-stretch',
    'neo-smoothcaret-motion-trail',
    'neo-smoothcaret-style-default',
    'neo-smoothcaret-style-neon',
    'neo-smoothcaret-style-rainbow',
    'neo-smoothcaret-style-block',
    'neo-smoothcaret-style-underline',
    'neo-smoothcaret-style-gilded'
  );
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
  cachedScrollContainer = null;
  cachedFocusElement = null;
  if (smoothCaretEventHandler) {
    document.removeEventListener('selectionchange', smoothCaretEventHandler);
    document.removeEventListener('scroll', smoothCaretEventHandler, scrollListenerOptions);
    smoothCaretEventHandler = null;
  }
  if (throttledCaretEventHandler) {
    document.removeEventListener('keyup', throttledCaretEventHandler);
    document.removeEventListener('mouseup', throttledCaretEventHandler);
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
    smoothCaretStyle = normalizeSmoothCaretStyle(config['smoothcaret-style']);
    if (neoFeatureActive) {
      applySmoothCaretMotion();
      applySmoothCaretEase();
      applySmoothCaretStyle();
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
