import { saveConfig, loadConfig, type Config } from '../main/data';
import { getPlugin } from '../main/guard';
import { getCursorRect, getTextColor, getScrollContainer, getCharWidthAtCursor } from '../modules/getselection';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { Dialog } from 'siyuan';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let smoothCaretEventHandler: (() => void) | null = null;
let throttledCaretEventHandler: (() => void) | null = null;
let _throttleTimer: number | null = null;
let cachedZIndex = 0;
let lastTargetElement: Element | null = null;
let cachedScrollContainer: HTMLElement | null = null;
let cachedFocusElement: Element | null = null;
let smoothCaretMotion: 'static' | 'breathing' | 'stretch' = 'static';
let smoothCaretEase: 'elegant' | 'shuttle' | 'drift' | 'spring' = 'elegant';
let smoothCaretStyle: 'default' | 'neon' | 'rainbow' | 'block' | 'underline' = 'default';
const scrollListenerOptions: AddEventListenerOptions = { capture: true, passive: true };
function applySmoothCaretMotion(): void {
  document.body.classList.remove(
    'neo-visual-smooth-caret-motion-static',
    'neo-visual-smooth-caret-motion-breathing',
    'neo-visual-smooth-caret-motion-stretch'
  );
  document.body.classList.add(`neo-visual-smooth-caret-motion-${smoothCaretMotion}`);
}
function applySmoothCaretStyle(): void {
  document.body.classList.remove(
    'neo-visual-smooth-caret-style-default',
    'neo-visual-smooth-caret-style-neon',
    'neo-visual-smooth-caret-style-rainbow',
    'neo-visual-smooth-caret-style-block',
    'neo-visual-smooth-caret-style-underline'
  );
  document.body.classList.add(`neo-visual-smooth-caret-style-${smoothCaretStyle}`);
}
function applySmoothCaretEase(): void {
  const easeMap: Record<string, string> = {
    elegant: '0.75s cubic-bezier(0.1, 0.9, 0.2, 1)',
    shuttle: '0.15s var(--neo-ease-out-4)',
    drift: '0.15s var(--neo-ease-in-3)',
    spring: '0.45s var(--neo-ease-spring-2)',
  };
  const caret = document.getElementById('neo-smooth-caret-item');
  if (caret) {
    caret.style.setProperty('--neo-smooth-caret-ease', easeMap[smoothCaretEase] || easeMap.elegant);
  }
}
function startSmoothCaret(): void {
  document.getElementById('neo-smooth-caret-item')?.remove();
  const caretElement = document.createElement('div');
  caretElement.id = 'neo-smooth-caret-item';
  document.body.appendChild(caretElement);
  applySmoothCaretEase();
  let isAnimationFramePending = false;
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
        currentElement.id === 'commonMenu'
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
    isAnimationFramePending = false;
    const sel = window.getSelection();
    const focusElement = sel?.focusNode?.parentElement;
    if (focusElement?.classList?.contains('av__cursor')) {
      caretElement.classList.add('neo-smooth-caret-hidden');
      return;
    }
    const isSelfContentEditableFalse = focusElement?.getAttribute?.('contenteditable') === 'false';
    if (isSelfContentEditableFalse) {
      caretElement.classList.add('neo-smooth-caret-hidden');
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
            caretElement.classList.add('neo-smooth-caret-hidden');
            return;
          }
        }
        caretElement.classList.remove('neo-smooth-caret-hidden');
        const needsCharWidth = smoothCaretStyle === 'block' || smoothCaretStyle === 'underline';
        const charWidth = needsCharWidth ? getCharWidthAtCursor() : null;
        const x = needsCharWidth ? rect.left : rect.left - 0.75;
        const y = smoothCaretStyle === 'underline' ? rect.top + rect.height * 1.05 : rect.top - rect.height * 0.025;
        caretElement.style.translate = `${x}px ${y}px`;
        caretElement.style.height = smoothCaretStyle === 'underline' ? `${Math.min(rect.height * 0.15, 3)}px` : `${rect.height * 1.05}px`;
        caretElement.style.width = needsCharWidth ? `${charWidth ?? rect.height * 0.6}px` : '';
        const baseZIndex = calculateCaretZIndex(targetElement);
        caretElement.style.zIndex = (baseZIndex + 1).toString();
        const textColor = getTextColor(sel.focusNode, targetElement);
        if (textColor) {
          caretElement.style.setProperty('--neo-smooth-caret-color', textColor);
        } else {
          caretElement.style.removeProperty('--neo-smooth-caret-color');
        }
        return;
      }
    }
    caretElement.classList.add('neo-smooth-caret-hidden');
  }
  function handleCaretUpdateTrigger(): void {
    if (!isAnimationFramePending) {
      window.requestAnimationFrame(updateCaretPosition);
      isAnimationFramePending = true;
    }
  }
  function handleThrottledCaretUpdate(): void {
    if (_throttleTimer !== null) clearTimeout(_throttleTimer);
    _throttleTimer = window.setTimeout(() => {
      _throttleTimer = null;
      handleCaretUpdateTrigger();
      _throttleTimer = window.setTimeout(() => {
        _throttleTimer = null;
        handleCaretUpdateTrigger();
        _throttleTimer = window.setTimeout(() => {
          _throttleTimer = null;
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
function buildSettingsHTML(i18n: Record<string, string>): string {
  const easeOptions = ['elegant', 'shuttle', 'drift', 'spring']
    .map(v => `<option value="${v}">${i18n[`smoothCaretEase${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  const motionOptions = ['static', 'breathing', 'stretch']
    .map(v => `<option value="${v}">${i18n[`smoothCaretMotion${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  const styleOptions = ['default', 'neon', 'rainbow', 'block', 'underline']
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
            <select class="b3-select fn__flex-center fn__size200" id="neo-smooth-caret-ease">
              ${easeOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.smoothCaretMotion}</div>
              <div class="b3-label__text">${i18n.smoothCaretMotionTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-smooth-caret-motion">
              ${motionOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.smoothCaretStyle}</div>
              <div class="b3-label__text">${i18n.smoothCaretStyleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-smooth-caret-style">
              ${styleOptions}
            </select>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-smooth-caret-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-smooth-caret-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showSmoothCaretSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.smoothCaretSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const easeSelect = dialog.element.querySelector('#neo-smooth-caret-ease') as HTMLSelectElement;
  const motionSelect = dialog.element.querySelector('#neo-smooth-caret-motion') as HTMLSelectElement;
  const styleSelect = dialog.element.querySelector('#neo-smooth-caret-style') as HTMLSelectElement;
  if (easeSelect) easeSelect.value = smoothCaretEase;
  if (motionSelect) motionSelect.value = smoothCaretMotion;
  if (styleSelect) styleSelect.value = smoothCaretStyle;
  dialog.element.querySelector('#neo-smooth-caret-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-smooth-caret-confirm')?.addEventListener('click', () => {
    let changed = false;
    if (easeSelect) {
      const newEase = easeSelect.value as 'elegant' | 'shuttle' | 'drift' | 'spring';
      if (newEase !== smoothCaretEase) {
        smoothCaretEase = newEase;
        applySmoothCaretEase();
        saveConfig({ 'smooth-caret-ease': newEase } as Partial<Config>);
        changed = true;
      }
    }
    if (motionSelect) {
      const newMotion = motionSelect.value as 'static' | 'breathing' | 'stretch';
      if (newMotion !== smoothCaretMotion) {
        smoothCaretMotion = newMotion;
        applySmoothCaretMotion();
        saveConfig({ 'smooth-caret-motion': newMotion } as Partial<Config>);
        changed = true;
      }
    }
    if (styleSelect) {
      const newStyle = styleSelect.value as 'default' | 'neon' | 'rainbow' | 'block' | 'underline';
      if (newStyle !== smoothCaretStyle) {
        smoothCaretStyle = newStyle;
        applySmoothCaretStyle();
        saveConfig({ 'smooth-caret-style': newStyle } as Partial<Config>);
        changed = true;
      }
    }
    dialog.destroy();
  });
}
export function destroySmoothCaret(): void {
  removeCss('visual-smoothcaret');
  document.getElementById('neo-smooth-caret-item')?.remove();
  document.documentElement.classList.remove('neo-visual-smooth-caret');
  document.body.classList.remove(
    'neo-visual-smooth-caret-motion-static',
    'neo-visual-smooth-caret-motion-breathing',
    'neo-visual-smooth-caret-motion-stretch',
    'neo-visual-smooth-caret-style-default',
    'neo-visual-smooth-caret-style-neon',
    'neo-visual-smooth-caret-style-rainbow',
    'neo-visual-smooth-caret-style-block',
    'neo-visual-smooth-caret-style-underline'
  );
  if (_throttleTimer !== null) {
    clearTimeout(_throttleTimer);
    _throttleTimer = null;
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
export function initSmoothCaret(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    smoothCaretMotion = config['smooth-caret-motion'] || 'static';
    smoothCaretEase = config['smooth-caret-ease'] || 'elegant';
    smoothCaretStyle = config['smooth-caret-style'] || 'default';
    if (config['smooth-caret'] === true) {
      ensureCss('visual-smoothcaret', featureCss['visual-smoothcaret']);
      document.documentElement.classList.add('neo-visual-smooth-caret');
      applySmoothCaretMotion();
      applySmoothCaretStyle();
      startSmoothCaret();
    }
  });
}
export function onSmoothCaretClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-visual-smooth-caret');
  if (isActive) {
    destroySmoothCaret();
    saveConfig({ 'smooth-caret': false } as Partial<Config>);
  } else {
    ensureCss('visual-smoothcaret', featureCss['visual-smoothcaret']);
    htmlEl.classList.add('neo-visual-smooth-caret');
    applySmoothCaretMotion();
    applySmoothCaretStyle();
    saveConfig({ 'smooth-caret': true } as Partial<Config>);
    startSmoothCaret();
  }
}
