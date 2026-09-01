import { saveConfig, loadConfig, type Config } from '../main/data';
import { getPlugin } from '../main/guard';
import { getCursorRect, getTextColor, getScrollContainer } from '../modules/getselection';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { Dialog } from 'siyuan';
import { createNeoLifecycleGuard } from '../main/lifecycle';
const scrollDurationTiers = [180, 260, 360, 480, 600];
const maskMoveThreshold = 3;
const maskUpdateInterval = 100;
const typewriterDeadzone = 12;
let typewriterEnabled = true;
let highlightEnabled = true;
let selectionChangeHandler: (() => void) | null = null;
let scrollHandler: (() => void) | null = null;
let scrollEndTimer: number | null = null;
let lastMaskPosition: string | null = null;
let lastMaskHeight: string | null = null;
let lastTextColorKey: { node: Node | null; fallback: Element | null } | null = null;
let cachedTextColor: string | null = null;
let lastMaskCursorTop = -Infinity;
let lastMaskUpdateTime = 0;
let pendingUpdate = false;
let isAnimationFramePending = false;
let neoFeatureActive = false;
const scrollTween = createScrollTween();
function getCachedTextColor(focusNode: Node | null, fallbackElement: Element): string | null {
  if (lastTextColorKey === null || lastTextColorKey.node !== focusNode || lastTextColorKey.fallback !== fallbackElement) {
    lastTextColorKey = { node: focusNode, fallback: fallbackElement };
    cachedTextColor = getTextColor(focusNode, fallbackElement);
  }
  return cachedTextColor;
}
function shouldThrottleMaskUpdate(cursorTop: number): boolean {
  if (lastMaskUpdateTime === 0) return false;
  const now = performance.now();
  if (now - lastMaskUpdateTime < maskUpdateInterval) return true;
  return Math.abs(cursorTop - lastMaskCursorTop) < maskMoveThreshold;
}
function updateMaskPosition(cursorRect: DOMRect, containerRect: DOMRect, scrollContainer: HTMLElement): void {
  const cursorCenterY = cursorRect.top + cursorRect.height / 2;
  const cursorRelativeY = cursorCenterY - containerRect.top;
  const positionPercent = (cursorRelativeY / containerRect.height) * 100;
  const newMaskPosition = `${positionPercent}%`;
  const newMaskHeight = `${cursorRect.height * 0.75}px`;
  const textColor = getCachedTextColor(window.getSelection()?.focusNode ?? null, scrollContainer);
  if (textColor) {
    scrollContainer.style.setProperty('--neo-immersive-text-color', textColor);
  } else {
    scrollContainer.style.removeProperty('--neo-immersive-text-color');
  }
  if (lastMaskPosition !== newMaskPosition || lastMaskHeight !== newMaskHeight) {
    lastMaskPosition = newMaskPosition;
    lastMaskHeight = newMaskHeight;
    scrollContainer.style.setProperty('--neo-immersive-mask-position', newMaskPosition);
    scrollContainer.style.setProperty('--neo-immersive-mask-height', newMaskHeight);
  }
  lastMaskCursorTop = cursorRect.top;
  lastMaskUpdateTime = performance.now();
}
const easeX1 = 0.25;
const easeY1 = 0.1;
const easeX2 = 0.25;
const easeY2 = 1;
function cubicBezierPoint(t: number, p1: number, p2: number): number {
  const inv = 1 - t;
  return 3 * inv * inv * t * p1 + 3 * inv * t * t * p2 + t * t * t;
}
function easeStandard(progress: number): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (cubicBezierPoint(mid, easeX1, easeX2) < progress) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return cubicBezierPoint((lo + hi) / 2, easeY1, easeY2);
}
function computeScrollDuration(distance: number): number {
  const dist = Math.abs(distance);
  if (dist < 20) return scrollDurationTiers[0];
  if (dist < 60) return scrollDurationTiers[1];
  if (dist < 150) return scrollDurationTiers[2];
  if (dist < 400) return scrollDurationTiers[3];
  return scrollDurationTiers[4];
}
function createScrollTween(): {
  active: boolean;
  to(container: HTMLElement, targetScrollTop: number): void;
  cancel(): void;
} {
  let rafId: number | null = null;
  let startTop = 0;
  let startTime = 0;
  let duration = scrollDurationTiers[4];
  let targetTop: number | null = null;
  let container: HTMLElement | null = null;
  function animate(currentTime: number): void {
    if (targetTop === null || !container) return;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeStandard(progress);
    container.scrollTop = startTop + (targetTop - startTop) * easeProgress;
    if (progress < 1) {
      rafId = requestAnimationFrame(animate);
    } else {
      rafId = null;
      targetTop = null;
      const doneContainer = container;
      container = null;
      if (highlightEnabled && doneContainer) {
        const currentRect = getCursorRect();
        if (currentRect) {
          updateMaskPosition(currentRect, doneContainer.getBoundingClientRect(), doneContainer);
        }
      }
    }
  }
  return {
    get active(): boolean {
      return rafId !== null;
    },
    to(nextContainer: HTMLElement, nextTarget: number): void {
      const animating = rafId !== null && targetTop !== null;
      startTop = nextContainer.scrollTop;
      startTime = performance.now();
      targetTop = nextTarget;
      duration = computeScrollDuration(nextTarget - startTop);
      container = nextContainer;
      if (!animating) {
        rafId = requestAnimationFrame(animate);
      }
    },
    cancel(): void {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      targetTop = null;
      container = null;
    },
  };
}
function scrollToLineCenter(cursorRect: DOMRect, container: HTMLElement, containerRect: DOMRect): void {
  const targetOffset = containerRect.height / 2;
  const targetScrollTop = container.scrollTop + cursorRect.top - containerRect.top - targetOffset + cursorRect.height / 2;
  const distance = targetScrollTop - container.scrollTop;
  if (distance === 0) return;
  scrollTween.to(container, targetScrollTop);
}
function applyPendingUpdate(): void {
  if (!pendingUpdate) return;
  pendingUpdate = false;
  if (!typewriterEnabled && !highlightEnabled) return;
  const cursorRect = getCursorRect();
  if (!cursorRect) return;
  const container = getScrollContainer();
  if (!container) return;
  const containerRect = container.getBoundingClientRect();
  if (typewriterEnabled) {
    const cursorCenterY = cursorRect.top + cursorRect.height / 2;
    const viewCenterY = containerRect.top + containerRect.height / 2;
    if (Math.abs(cursorCenterY - viewCenterY) > typewriterDeadzone) {
      scrollToLineCenter(cursorRect, container, containerRect);
      return;
    }
  }
  if (highlightEnabled && !shouldThrottleMaskUpdate(cursorRect.top)) {
    updateMaskPosition(cursorRect, containerRect, container);
  }
}
function applyMaskUpdate(): void {
  if (!highlightEnabled) return;
  const cursorRect = getCursorRect();
  if (!cursorRect) return;
  const container = getScrollContainer();
  if (!container) return;
  updateMaskPosition(cursorRect, container.getBoundingClientRect(), container);
}
function scheduleUpdate(): void {
  if (!typewriterEnabled && !highlightEnabled) return;
  pendingUpdate = true;
  if (!isAnimationFramePending) {
    window.requestAnimationFrame(() => {
      isAnimationFramePending = false;
      applyPendingUpdate();
    });
    isAnimationFramePending = true;
  }
}
function scheduleMaskUpdate(): void {
  if (!highlightEnabled) return;
  if (scrollTween.active) return;
  if (scrollEndTimer !== null) {
    clearTimeout(scrollEndTimer);
  }
  scrollEndTimer = window.setTimeout(() => {
    scrollEndTimer = null;
    applyMaskUpdate();
  }, 50);
}
function startObserving(): void {
  selectionChangeHandler = scheduleUpdate;
  scrollHandler = scheduleMaskUpdate;
  document.addEventListener('selectionchange', selectionChangeHandler);
  document.addEventListener('scroll', scrollHandler, { capture: true, passive: true });
  scheduleUpdate();
}
function enableImmersiveMode(): void {
  if (neoFeatureActive) return;
  ensureCss('extension-immersivemode', featureCss['extension-immersivemode']);
  document.documentElement.classList.add('neo-extension-immersivemode');
  neoFeatureActive = true;
  applyHighlightState();
  startObserving();
}
function stopObserving(): void {
  scrollTween.cancel();
  if (scrollEndTimer !== null) {
    clearTimeout(scrollEndTimer);
    scrollEndTimer = null;
  }
  if (selectionChangeHandler) {
    document.removeEventListener('selectionchange', selectionChangeHandler);
    selectionChangeHandler = null;
  }
  if (scrollHandler) {
    document.removeEventListener('scroll', scrollHandler, { capture: true, passive: true } as EventListenerOptions);
    scrollHandler = null;
  }
  pendingUpdate = false;
  isAnimationFramePending = false;
  lastMaskPosition = null;
  lastMaskHeight = null;
  lastTextColorKey = null;
  cachedTextColor = null;
  lastMaskCursorTop = -Infinity;
  lastMaskUpdateTime = 0;
  clearHighlightCss();
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.immersiveTypewriterMode}</div>
              <div class="b3-label__text">${i18n.immersiveTypewriterModeTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-immersive-typewriter" type="checkbox"${typewriterEnabled ? ' checked' : ''}>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.immersiveHighlight}</div>
              <div class="b3-label__text">${i18n.immersiveHighlightTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-immersive-highlight" type="checkbox"${highlightEnabled ? ' checked' : ''}>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-immersive-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-immersive-confirm">${i18n.confirm}</button>
  </div>`;
}
function clearHighlightCss(): void {
  document.querySelectorAll<HTMLElement>('.protyle-content').forEach((el) => {
    el.style.removeProperty('--neo-immersive-mask-position');
    el.style.removeProperty('--neo-immersive-mask-height');
    el.style.removeProperty('--neo-immersive-text-color');
  });
}
function applyHighlightState(): void {
  document.body.classList.toggle('neo-extension-immersivemode-highlight', highlightEnabled);
  document.body.classList.toggle('neo-extension-immersivemode-no-highlight', !highlightEnabled);
}
export function showImmersiveModeSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.immersiveModeSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const typewriterSwitch = dialog.element.querySelector('#neo-immersive-typewriter') as HTMLInputElement;
  const highlightSwitch = dialog.element.querySelector('#neo-immersive-highlight') as HTMLInputElement;
  if (typewriterSwitch) typewriterSwitch.checked = typewriterEnabled;
  if (highlightSwitch) highlightSwitch.checked = highlightEnabled;
  dialog.element.querySelector('#neo-immersive-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-immersive-confirm')?.addEventListener('click', () => {
    const newTypewriter = typewriterSwitch ? typewriterSwitch.checked : true;
    const newHighlight = highlightSwitch ? highlightSwitch.checked : true;
    typewriterEnabled = newTypewriter;
    highlightEnabled = newHighlight;
    saveConfig({ 'immersive-typewriter': newTypewriter, 'immersive-highlight': newHighlight } as Partial<Config>);
    if (neoFeatureActive) {
      if (!newHighlight) {
        clearHighlightCss();
      }
      applyHighlightState();
    }
    dialog.destroy();
  });
}
export function initImmersiveMode(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    if (config['immersive-typewriter'] !== undefined) typewriterEnabled = config['immersive-typewriter'];
    if (config['immersive-highlight'] !== undefined) highlightEnabled = config['immersive-highlight'];
    if (neoFeatureActive) {
      if (!highlightEnabled) {
        clearHighlightCss();
      }
      applyHighlightState();
    } else if (config['immersive-mode'] === true) {
      enableImmersiveMode();
    }
  });
}
export function onImmersiveModeClick(): void {
  if (neoFeatureActive) {
    destroyImmersiveMode();
    saveConfig({ 'immersive-mode': false } as Partial<Config>);
  } else {
    enableImmersiveMode();
    saveConfig({ 'immersive-mode': true } as Partial<Config>);
  }
}
export function destroyImmersiveMode(): void {
  neoFeatureActive = false;
  removeCss('extension-immersivemode');
  document.documentElement?.classList.remove('neo-extension-immersivemode');
  document.body.classList.remove('neo-extension-immersivemode-highlight', 'neo-extension-immersivemode-no-highlight');
  stopObserving();
}
