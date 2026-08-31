import { isMobile } from '../modules/env';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { saveConfig, loadConfig, type Config } from '../main/data';
import { getPlugin } from '../main/guard';
import { Dialog } from 'siyuan';
type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';
let arrowKeysOn = true;
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
function findHintMenu(): HTMLElement | null {
  return document.querySelector('.protyle-hint.hint--menu:not(.fn__none)');
}
function onMenuHidden(): void {
  if (!isMenuVisible(activeMenuElement)) {
    endSession();
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
  return !!(el && document.body.contains(el) && !el.classList.contains('fn__none'));
}
function attachMenuObserver(): void {
  if (menuObserver) return;
  if (!activeMenuElement) return;
  menuObserver = new MutationObserver(onMenuHidden);
  try {
    menuObserver.observe(activeMenuElement, { attributes: true, attributeFilter: ['class'] });
  } catch {}
}
function beginPollingForMenu(): void {
  const found = findHintMenu();
  if (found) {
    activeMenuElement = found;
    attachMenuObserver();
    return;
  }
  pollAttempts = 0;
  const startTime = Date.now();
  function poll(): void {
    pollTimerId = requestAnimationFrame(() => {
      pollAttempts++;
      const el = findHintMenu();
      if (el) {
        pollTimerId = null;
        activeMenuElement = el;
        attachMenuObserver();
      } else if (pollAttempts >= 10 || Date.now() - startTime >= 1000) {
        pollTimerId = null;
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
  if (evt.key === '/') {
    endSession();
    isSessionActive = true;
    beginPollingForMenu();
    return;
  }
  if (!isSessionActive) return;
  if (evt.key === 'Escape') {
    endSession();
    return;
  }
  const directionKeys: Direction[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  if (!directionKeys.includes(evt.key as Direction)) {
    return;
  }
  if (!arrowKeysOn) return;
  const menu = activeMenuElement || findHintMenu();
  if (!menu || !isMenuVisible(menu)) {
    endSession();
    return;
  }
  evt.preventDefault();
  evt.stopPropagation();
  activeMenuElement = menu;
  attachMenuObserver();
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
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler, { capture: true });
      keydownHandler = null;
    }
  }
}
export function initMulticolumnSlashMenu(): void {
  (window as any).__neoOpenMulticolumnSlashMenuSettings = showMulticolumnSlashMenuSettings;
  if (isMobile()) return;
  loadConfig().then((config) => {
    arrowKeysOn = config['multicolumn-slash-menu-arrowkeys'] !== false;
    if (config['multicolumn-slash-menu'] === true) {
      ensureCss('visual-multicolumnslashmenu', featureCss['visual-multicolumnslashmenu']);
      document.documentElement.classList.add('neo-visual-multicolumnslashmenu');
      ensureKeydownHandler(arrowKeysOn);
    }
  });
}
export function onMulticolumnSlashMenuClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-visual-multicolumnslashmenu');
  if (isActive) {
    destroyMulticolumnSlashMenu();
    saveConfig({ 'multicolumn-slash-menu': false } as Partial<Config>);
  } else {
    ensureCss('visual-multicolumnslashmenu', featureCss['visual-multicolumnslashmenu']);
    htmlEl.classList.add('neo-visual-multicolumnslashmenu');
    ensureKeydownHandler(arrowKeysOn);
    saveConfig({ 'multicolumn-slash-menu': true } as Partial<Config>);
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
            <input class="b3-switch fn__flex-center" id="neo-multicolumn-slash-menu-arrowkeys" type="checkbox">
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-multicolumn-slash-menu-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-multicolumn-slash-menu-confirm">${i18n.confirm}</button>
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
  loadConfig().then((config) => {
    const arrowKeysCheckbox = dialog.element.querySelector('#neo-multicolumn-slash-menu-arrowkeys') as HTMLInputElement;
    if (arrowKeysCheckbox) arrowKeysCheckbox.checked = config['multicolumn-slash-menu-arrowkeys'] !== false;
  });
  dialog.element.querySelector('#neo-multicolumn-slash-menu-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-multicolumn-slash-menu-confirm')?.addEventListener('click', () => {
    const arrowKeysCheckbox = dialog.element.querySelector('#neo-multicolumn-slash-menu-arrowkeys') as HTMLInputElement;
    if (arrowKeysCheckbox) {
      const newValue = arrowKeysCheckbox.checked;
      arrowKeysOn = newValue;
      saveConfig({ 'multicolumn-slash-menu-arrowkeys': newValue } as Partial<Config>);
      if (document.documentElement.classList.contains('neo-visual-multicolumnslashmenu')) {
        ensureKeydownHandler(arrowKeysOn);
      }
    }
    dialog.destroy();
  });
}
export function createMulticolumnSlashMenuLabelHTML(i18n: Record<string, string>): string {
  return `<span class="fn__flex fn__pointer">
    <span>${i18n.multicolumnSlashMenu}</span>
    <span class="fn__space fn__flex-1 neo-menu-item-second-icon-space"></span>
    <svg class="b3-menu__icon neo-menu-item-second-icon ariaLabel" aria-label="${i18n.multicolumnSlashMenuSettings}" onclick="event.stopPropagation();__neoOpenMulticolumnSlashMenuSettings()"><use xlink:href="#iconSettings"></use></svg>
  </span>`;
}
export function destroyMulticolumnSlashMenu(): void {
  removeCss('visual-multicolumnslashmenu');
  ensureKeydownHandler(false);
  endSession();
  document.documentElement?.classList.remove('neo-visual-multicolumnslashmenu');
}