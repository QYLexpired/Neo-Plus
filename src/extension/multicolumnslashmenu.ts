import { isMobile } from '../modules/env';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { saveConfig, loadConfig } from '../main/data';
import { getPlugin } from '../main/context';
import { Dialog } from '../modules/dialog';
import { createNeoLifecycleGuard } from '../main/lifecycle';
type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';
const directionKeys: Direction[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
let arrowKeysOn = true;
let neoFeatureActive = false;
interface CenterPoint {
  el: HTMLElement;
  x: number;
  y: number;
}
let isSessionActive = false;
let pollTimerId: number | null = null;
let pollAttempts = 0;
let activeMenuElement: HTMLElement | null = null;
let menuObserver: MutationObserver | null = null;
let keydownHandler: ((evt: KeyboardEvent) => void) | null = null;
let cachedCenters: CenterPoint[] = [];
function findHintMenu(editor: HTMLElement): HTMLElement | null {
  if (!editor.isConnected || !editor.classList.contains('protyle')) return null;
  return editor.querySelector(':scope > .protyle-hint.hint--menu:not(.fn__none)');
}
function onMenuHidden(mutations: MutationRecord[]): void {
  if (!isMenuVisible(activeMenuElement)) {
    endSession();
    return;
  }
  if (mutations.some((mutation) =>
    Array.from(mutation.removedNodes).some((node) => node.contains(activeMenuElement))
  )) {
    observeActiveMenu();
  }
}
function endSession(): void {
  isSessionActive = false;
  activeMenuElement = null;
  cachedCenters = [];
  if (pollTimerId !== null) {
    cancelAnimationFrame(pollTimerId);
    pollTimerId = null;
  }
  if (menuObserver) {
    try {
      menuObserver.disconnect();
    } catch {}
    menuObserver = null;
  }
}
function isMenuVisible(el: HTMLElement | null): boolean {
  return !!(el && document.body.contains(el) && el.classList.contains('hint--menu') && !el.classList.contains('fn__none'));
}
function observeActiveMenu(): void {
  if (!menuObserver || !activeMenuElement) return;
  menuObserver.disconnect();
  try {
    menuObserver.observe(activeMenuElement, { attributes: true, attributeFilter: ['class'] });
    for (let parent = activeMenuElement.parentElement; parent; parent = parent.parentElement) {
      menuObserver.observe(parent, { childList: true });
      if (parent === document.body) break;
    }
  } catch {
    endSession();
  }
}
function attachMenuObserver(): void {
  if (menuObserver || !activeMenuElement) return;
  menuObserver = new MutationObserver(onMenuHidden);
  observeActiveMenu();
}
function beginPollingForMenu(editor: HTMLElement): void {
  const found = findHintMenu(editor);
  if (found) {
    activeMenuElement = found;
    attachMenuObserver();
    return;
  }
  pollAttempts = 0;
  const startTime = Date.now();
  const isCurrent = createNeoLifecycleGuard();
  function poll(): void {
    pollTimerId = requestAnimationFrame(() => {
      if (!isCurrent()) return;
      pollTimerId = null;
      if (!neoFeatureActive || !arrowKeysOn || !isSessionActive
        || !editor.isConnected || !editor.classList.contains('protyle')) {
        endSession();
        return;
      }
      pollAttempts++;
      const el = findHintMenu(editor);
      if (el) {
        activeMenuElement = el;
        attachMenuObserver();
      } else if (pollAttempts >= 10 || Date.now() - startTime >= 1000) {
        endSession();
      } else {
        poll();
      }
    });
  }
  poll();
}
function getListItems(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.b3-list-item'));
}
function getFocusedItem(container: HTMLElement): HTMLElement | null {
  return container.querySelector('.b3-list-item--focus');
}
function computeCenters(items: HTMLElement[]): CenterPoint[] {
  return items.map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      el,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  });
}
function selectClosestInDirection(
  centers: CenterPoint[],
  from: CenterPoint,
  direction: Direction
): HTMLElement | null {
  const xTolerance = Math.max(
    (from.el.getBoundingClientRect().width) / 2,
    10
  );
  let filterFn: (c: CenterPoint) => boolean;
  switch (direction) {
    case 'ArrowUp':
      filterFn = (c) => c.y < from.y - 1 && Math.abs(c.x - from.x) <= xTolerance;
      break;
    case 'ArrowDown':
      filterFn = (c) => c.y > from.y + 1 && Math.abs(c.x - from.x) <= xTolerance;
      break;
    case 'ArrowLeft':
      filterFn = (c) => c.x < from.x - 1;
      break;
    case 'ArrowRight':
      filterFn = (c) => c.x > from.x + 1;
      break;
    default:
      return null;
  }
  let best: CenterPoint | null = null;
  let bestD2 = Infinity;
  for (let i = 0; i < centers.length; i++) {
    const c = centers[i];
    if (c.el === from.el || !filterFn(c)) continue;
    const dx = c.x - from.x;
    const dy = c.y - from.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestD2) {
      best = c;
      bestD2 = d2;
    }
  }
  return best ? best.el : null;
}
function moveFocus(targetEl: HTMLElement): void {
  const current = getFocusedItem(activeMenuElement!);
  if (current === targetEl) return;
  if (current) current.classList.remove('b3-list-item--focus');
  targetEl.classList.add('b3-list-item--focus');
  try {
    targetEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  } catch {}
}
function findNextByDomOrder(
  items: HTMLElement[],
  currentEl: HTMLElement
): HTMLElement | null {
  const index = items.indexOf(currentEl);
  if (index === -1) return items[0] ?? null;
  if (index + 1 < items.length) return items[index + 1];
  return items[0] ?? null;
}
function findPrevByDomOrder(
  items: HTMLElement[],
  currentEl: HTMLElement
): HTMLElement | null {
  const index = items.indexOf(currentEl);
  if (index === -1) return items[items.length - 1] ?? null;
  if (index - 1 >= 0) return items[index - 1];
  return items[items.length - 1] ?? null;
}
function findEdgeInRow(
  centers: CenterPoint[],
  from: CenterPoint,
  getEdge: 'leftmost' | 'rightmost'
): HTMLElement | null {
  const fromRect = from.el.getBoundingClientRect();
  const fromCenterY = fromRect.top + fromRect.height / 2;
  let best: CenterPoint | null = null;
  for (let i = 0; i < centers.length; i++) {
    const c = centers[i];
    if (c.el === from.el) continue;
    const r = c.el.getBoundingClientRect();
    const cY = r.top + r.height / 2;
    const threshold = Math.min(fromRect.height, r.height) / 2;
    if (Math.abs(cY - fromCenterY) > threshold) continue;
    if (best === null) {
      best = c;
    } else if (getEdge === 'leftmost' && c.x < best.x) {
      best = c;
    } else if (getEdge === 'rightmost' && c.x > best.x) {
      best = c;
    }
  }
  return best ? best.el : null;
}
const onKeyDownCapture = (evt: KeyboardEvent): void => {
  if (!neoFeatureActive || !arrowKeysOn) return;
  if (evt.key === 'Escape') {
    endSession();
    return;
  }
  if (evt.key !== '/' && !isSessionActive) return;
  if (evt.key !== '/' && !directionKeys.includes(evt.key as Direction)) return;
  if (evt.isComposing || (evt.key !== '/' && (evt.altKey || evt.shiftKey || evt.ctrlKey || evt.metaKey))) return;
  if (evt.target instanceof HTMLInputElement || evt.target instanceof HTMLTextAreaElement) {
    endSession();
    return;
  }
  const editor = evt.target instanceof Element ? evt.target.closest<HTMLElement>('.protyle') : null;
  if (evt.key === '/') {
    endSession();
    if (!editor) return;
    isSessionActive = true;
    beginPollingForMenu(editor);
    return;
  }
  const menu = editor ? findHintMenu(editor) : null;
  if (!menu || !isMenuVisible(menu)) {
    endSession();
    return;
  }
  if (activeMenuElement !== menu) {
    endSession();
    isSessionActive = true;
    activeMenuElement = menu;
    attachMenuObserver();
  }
  evt.preventDefault();
  evt.stopPropagation();
  const items = getListItems(menu);
  if (items.length === 0) return;
  let focused = getFocusedItem(menu);
  if (!focused) {
    focused = items[0];
    focused.classList.add('b3-list-item--focus');
  }
  cachedCenters = computeCenters(items);
  const fromCenter = cachedCenters.find((c) => c.el === focused) ?? {
    el: focused,
    x: focused.getBoundingClientRect().left + focused.getBoundingClientRect().width / 2,
    y: focused.getBoundingClientRect().top + focused.getBoundingClientRect().height / 2,
  };
  const key = evt.key as Direction;
  const target = selectClosestInDirection(cachedCenters, fromCenter, key);
  if (target) {
    moveFocus(target);
    return;
  }
  let fallbackTarget: HTMLElement | null = null;
  if (key === 'ArrowDown') {
    fallbackTarget = findNextByDomOrder(items, focused);
  } else if (key === 'ArrowUp') {
    fallbackTarget = findPrevByDomOrder(items, focused);
  } else if (key === 'ArrowRight') {
    fallbackTarget = findEdgeInRow(cachedCenters, fromCenter, 'leftmost');
  } else if (key === 'ArrowLeft') {
    fallbackTarget = findEdgeInRow(cachedCenters, fromCenter, 'rightmost');
  }
  if (fallbackTarget && fallbackTarget !== focused) {
    moveFocus(fallbackTarget);
  }
};
function ensureKeydownHandler(enable: boolean): void {
  if (enable) {
    if (!keydownHandler) {
      keydownHandler = onKeyDownCapture;
      document.addEventListener('keydown', keydownHandler, { capture: true });
    }
  } else {
    endSession();
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler, { capture: true });
      keydownHandler = null;
    }
  }
}
function enableMulticolumnSlashMenu(): void {
  if (neoFeatureActive) return;
  ensureCss('extension-multicolumnslashmenu', featureCss['extension-multicolumnslashmenu']);
  document.documentElement.classList.add('neo-multicolumnslashmenu');
  neoFeatureActive = true;
  ensureKeydownHandler(arrowKeysOn);
}
export function initMulticolumnSlashMenu(): Promise<void> | void {
  if (isMobile()) return;
  const isCurrent = createNeoLifecycleGuard();
  return loadConfig().then((config) => {
    if (!isCurrent()) return;
    arrowKeysOn = config['multicolumnslashmenu-arrowkeys'] !== false;
    if (neoFeatureActive) {
      ensureKeydownHandler(arrowKeysOn);
    } else if (config['multicolumnslashmenu'] === true) {
      enableMulticolumnSlashMenu();
    }
  });
}
export function onMulticolumnSlashMenuClick(): void {
  if (isMobile()) return;
  if (neoFeatureActive) {
    destroyMulticolumnSlashMenu();
    saveConfig({ 'multicolumnslashmenu': false });
  } else {
    enableMulticolumnSlashMenu();
    saveConfig({ 'multicolumnslashmenu': true });
  }
}
function buildMulticolumnSlashMenuSettingsHTML(i18n: Record<string, string>): string {
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.multicolumnSlashMenuArrowKeys}</div>
              <div class="b3-label__text">${i18n.multicolumnSlashMenuArrowKeysTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-multicolumnslashmenu-arrowkeys" type="checkbox">
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-multicolumnslashmenu-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-multicolumnslashmenu-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showMulticolumnSlashMenuSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.multicolumnSlashMenuSettings,
    content: buildMulticolumnSlashMenuSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const arrowKeysCheckbox = dialog.element.querySelector('#neo-multicolumnslashmenu-arrowkeys') as HTMLInputElement;
  if (arrowKeysCheckbox) arrowKeysCheckbox.checked = arrowKeysOn;
  dialog.element.querySelector('#neo-multicolumnslashmenu-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-multicolumnslashmenu-confirm')?.addEventListener('click', () => {
    if (arrowKeysCheckbox) {
      const newValue = arrowKeysCheckbox.checked;
      arrowKeysOn = newValue;
      saveConfig({ 'multicolumnslashmenu-arrowkeys': newValue });
      if (neoFeatureActive) {
        ensureKeydownHandler(arrowKeysOn);
      }
    }
    dialog.destroy();
  });
}
export function destroyMulticolumnSlashMenu(): void {
  neoFeatureActive = false;
  removeCss('extension-multicolumnslashmenu');
  ensureKeydownHandler(false);
  endSession();
  document.documentElement?.classList.remove('neo-multicolumnslashmenu');
}
