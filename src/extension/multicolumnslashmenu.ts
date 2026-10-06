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
let keydownHandler: ((evt: KeyboardEvent) => void) | null = null;
function findHintMenu(editor: HTMLElement): HTMLElement | null {
  const menu = editor.querySelector<HTMLElement>(':scope > .protyle-hint.hint--menu:not(.fn__none)');
  if (menu || !editor.classList.contains('protyle-lite-fragment')) return menu;
  const root = editor.classList.contains('mindmap-view__editor')
    ? editor.closest('.mindmap-view') ?? document.body
    : document.body;
  const menus = root.querySelectorAll<HTMLElement>(':scope > .protyle-hint.protyle-hint--lite-overlay.hint--menu:not(.fn__none)');
  return menus.length === 1 ? menus[0] : null;
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
function moveFocus(menu: HTMLElement, targetEl: HTMLElement): void {
  const current = getFocusedItem(menu);
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
  if (!directionKeys.includes(evt.key as Direction) || evt.defaultPrevented || evt.isComposing
    || evt.altKey || evt.shiftKey || evt.ctrlKey || evt.metaKey) return;
  if (!(evt.target instanceof Element) || evt.target.closest('input, textarea, select')) return;
  const editor = evt.target.closest<HTMLElement>('.protyle');
  if (!editor?.isConnected || document.activeElement?.closest('.protyle') !== editor) return;
  const menu = findHintMenu(editor);
  if (!menu || menu.getClientRects().length === 0) return;
  const items = getListItems(menu);
  if (items.length === 0) return;
  evt.preventDefault();
  evt.stopPropagation();
  let focused = getFocusedItem(menu);
  if (!focused) {
    focused = items[0];
    focused.classList.add('b3-list-item--focus');
  }
  const centers = computeCenters(items);
  const fromCenter = centers.find((c) => c.el === focused) ?? {
    el: focused,
    x: focused.getBoundingClientRect().left + focused.getBoundingClientRect().width / 2,
    y: focused.getBoundingClientRect().top + focused.getBoundingClientRect().height / 2,
  };
  const key = evt.key as Direction;
  const target = selectClosestInDirection(centers, fromCenter, key);
  if (target) {
    moveFocus(menu, target);
    return;
  }
  let fallbackTarget: HTMLElement | null = null;
  if (key === 'ArrowDown') {
    fallbackTarget = findNextByDomOrder(items, focused);
  } else if (key === 'ArrowUp') {
    fallbackTarget = findPrevByDomOrder(items, focused);
  } else if (key === 'ArrowRight') {
    fallbackTarget = findEdgeInRow(centers, fromCenter, 'leftmost');
  } else if (key === 'ArrowLeft') {
    fallbackTarget = findEdgeInRow(centers, fromCenter, 'rightmost');
  }
  if (fallbackTarget && fallbackTarget !== focused) {
    moveFocus(menu, fallbackTarget);
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
  document.documentElement?.classList.remove('neo-multicolumnslashmenu');
}
