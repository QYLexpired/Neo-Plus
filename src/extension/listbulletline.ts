import { saveConfig, loadConfig, getConfig } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { getEffectiveSelectionRange } from '../modules/getselection';
import { fetchListener } from '../modules/fetchmonitor';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { getPlugin } from '../main/context';
import { Dialog } from '../modules/dialog';
let selectionChangeHandler: (() => void) | null = null;
let clickHandler: ((event: MouseEvent) => void) | null = null;
let updateFrame: number | null = null;
let refreshFrame: number | null = null;
let pendingClickTarget: HTMLElement | null = null;
let lastMarkedItems: Set<HTMLElement> = new Set();
let drawOn = true;
let neoFeatureActive = false;
let configRevision = 0;
function applyDrawClass(): void {
  document.body.classList.toggle('neo-listbulletline-draw-on', drawOn);
}
function clearBulletLineMarks(): void {
  document.querySelectorAll<HTMLElement>('[neo-listbulletline-node],[neo-listbulletline-current]').forEach((element) => {
    element.removeAttribute('neo-listbulletline-node');
    element.removeAttribute('neo-listbulletline-current');
    element.style.removeProperty('--neo-listbulletline-height');
  });
  lastMarkedItems.clear();
}
function removeMarkFromItem(item: HTMLElement): void {
  item.removeAttribute('neo-listbulletline-node');
  item.removeAttribute('neo-listbulletline-current');
  item.style.removeProperty('--neo-listbulletline-height');
}
function addMarkToItem(item: HTMLElement, height?: string): void {
  item.setAttribute('neo-listbulletline-node', '');
  if (height !== undefined) {
    item.style.setProperty('--neo-listbulletline-height', height);
    item.setAttribute('neo-listbulletline-current', '');
  }
}
function getSelectionStartNode(range: Range): Node | null {
  let node: Node | null = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE && (range.collapsed || range.startOffset < (node.textContent?.length ?? 0))) return node;
  const element = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
  const editor = element?.closest('.protyle-wysiwyg');
  if (!editor) return node;
  const child = node.childNodes[range.startOffset];
  if (child) {
    node = child;
  } else {
    if (range.collapsed) return node;
    while (node && node !== editor && !node.nextSibling) node = node.parentNode;
    if (!node || node === editor) return null;
    node = node.nextSibling;
  }
  while (node && editor.contains(node)) {
    if (!range.collapsed && !range.intersectsNode(node)) return null;
    while (node.firstChild) node = node.firstChild;
    if (!range.collapsed && node === range.endContainer && range.endOffset === 0) return null;
    const parent: Element | null = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
    const block: Element | null | undefined = parent?.closest('[data-node-id]');
    if (block && block !== editor && editor.contains(block)) return node;
    if (range.collapsed) return node;
    while (node && node !== editor && !node.nextSibling) node = node.parentNode;
    if (!node || node === editor) return null;
    node = node.nextSibling;
  }
  return null;
}
function runSelectionUpdate(clickTarget?: HTMLElement | null): void {
  const selection = window.getSelection();
  const currentListItems: HTMLElement[] = [];
  if (clickTarget) {
    let node: Node | null = clickTarget;
    while (node) {
      const element = node as HTMLElement;
      if (element.dataset?.type === 'NodeListItem') {
        currentListItems.push(element);
      }
      if (element.classList?.contains('protyle-wysiwyg')) {
        break;
      }
      node = element.parentElement;
    }
  } else if (selection) {
    const range = getEffectiveSelectionRange(selection);
    let node: Node | null = range ? getSelectionStartNode(range) : null;
    while (node && node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentElement;
    }
    while (node) {
      const element = node as HTMLElement;
      if (element.dataset?.type === 'NodeListItem') {
        currentListItems.push(element);
      }
      if (element.classList?.contains('protyle-wysiwyg')) {
        break;
      }
      node = element.parentElement;
    }
  }
  const currentSet = new Set(currentListItems);
  lastMarkedItems.forEach((item) => {
    if (!currentSet.has(item)) {
      removeMarkFromItem(item);
    }
  });
  applyBulletLineMarks(currentListItems);
  lastMarkedItems = currentSet;
}
function applyBulletLineMarks(items: HTMLElement[]): void {
  const itemTops = items.length > 1 ? items.map((item) => item.getBoundingClientRect().top) : [];
  items.forEach((item, index) => {
    const hasNext = index < items.length - 1;
    const newHeight = hasNext ? `${itemTops[index] - itemTops[index + 1]}px` : undefined;
    if (!lastMarkedItems.has(item)) {
      addMarkToItem(item, newHeight);
    } else {
      if (newHeight !== undefined) {
        const oldHeight = item.style.getPropertyValue('--neo-listbulletline-height');
        if (oldHeight !== newHeight) {
          item.style.setProperty('--neo-listbulletline-height', newHeight);
        }
        if (!item.hasAttribute('neo-listbulletline-current')) {
          item.setAttribute('neo-listbulletline-current', '');
        }
      } else {
        if (item.hasAttribute('neo-listbulletline-current')) {
          item.removeAttribute('neo-listbulletline-current');
          item.style.removeProperty('--neo-listbulletline-height');
        }
      }
    }
  });
}
function scheduleSelectionUpdate(clickTarget: HTMLElement | null = null): void {
  if (!neoFeatureActive) return;
  pendingClickTarget = clickTarget;
  if (updateFrame !== null) return;
  updateFrame = window.requestAnimationFrame(() => {
    updateFrame = null;
    const target = pendingClickTarget;
    pendingClickTarget = null;
    if (!neoFeatureActive) return;
    runSelectionUpdate(target?.isConnected ? target : null);
  });
}
function refreshBulletLineHeights(): void {
  const items = Array.from(lastMarkedItems).filter((item) => item.isConnected);
  if (items.length === 0) {
    clearBulletLineMarks();
    return;
  }
  lastMarkedItems = new Set(items);
  applyBulletLineMarks(items);
}
function scheduleBulletLineRefresh(): void {
  if (!neoFeatureActive) return;
  if (refreshFrame !== null) return;
  refreshFrame = window.requestAnimationFrame(() => {
    refreshFrame = null;
    if (!neoFeatureActive) return;
    refreshBulletLineHeights();
  });
}
function bindSelectionChange(): void {
  if (selectionChangeHandler) {
    return;
  }
  selectionChangeHandler = () => scheduleSelectionUpdate();
  clickHandler = (event: MouseEvent) => {
    const target = event.composedPath()[0] as HTMLElement;
    if (target.closest?.('.protyle-action')) {
      scheduleSelectionUpdate(target);
    }
  };
  document.addEventListener('selectionchange', selectionChangeHandler);
  document.addEventListener('click', clickHandler, { capture: true });
  scheduleSelectionUpdate();
}
function unbindSelectionChange(): void {
  if (updateFrame !== null) {
    window.cancelAnimationFrame(updateFrame);
    updateFrame = null;
  }
  if (refreshFrame !== null) {
    window.cancelAnimationFrame(refreshFrame);
    refreshFrame = null;
  }
  pendingClickTarget = null;
  if (!selectionChangeHandler) {
    clearBulletLineMarks();
    return;
  }
  document.removeEventListener('selectionchange', selectionChangeHandler);
  if (clickHandler) {
    document.removeEventListener('click', clickHandler, { capture: true });
    clickHandler = null;
  }
  selectionChangeHandler = null;
  clearBulletLineMarks();
}
const fetchMonitor = fetchListener();
fetchMonitor.onNotify('setUILayout', () => { scheduleBulletLineRefresh(); });
function enableListBulletLine(): void {
  if (neoFeatureActive) return;
  ensureCss('extension-listbulletline', featureCss['extension-listbulletline']);
  document.documentElement.classList.add('neo-listbulletline');
  neoFeatureActive = true;
  applyDrawClass();
  fetchMonitor.attach();
  bindSelectionChange();
}
export function initListBulletLine(): Promise<void> {
  const revision = ++configRevision;
  const isCurrent = createNeoLifecycleGuard();
  return loadConfig().then(() => {
    if (!isCurrent()) return;
    const config = getConfig();
    drawOn = config['listbulletline-draw'] !== false;
    if (neoFeatureActive) {
      applyDrawClass();
    } else if (revision === configRevision && config['listbulletline'] === true) {
      enableListBulletLine();
    }
  });
}
export function onListBulletLineClick(): void {
  configRevision += 1;
  if (neoFeatureActive) {
    destroyListBulletLine();
    saveConfig({ 'listbulletline': false });
  } else {
    enableListBulletLine();
    saveConfig({ 'listbulletline': true });
  }
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.listBulletLineDrawAnimation}</div>
              <div class="b3-label__text">${i18n.listBulletLineDrawAnimationTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-listbulletline-draw" type="checkbox">
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-listbulletline-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-listbulletline-confirm">${i18n.confirm}</button>
  </div>`;
}
export async function showListBulletLineSettings(): Promise<void> {
  const plugin = getPlugin();
  if (!plugin) return;
  const isCurrent = createNeoLifecycleGuard();
  await loadConfig();
  if (!isCurrent()) return;
  const config = getConfig();
  const initialDrawOn = config['listbulletline-draw'] !== false;
  const dialog = new Dialog({
    title: plugin.i18n.listBulletLineSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const drawCheckbox = dialog.element.querySelector<HTMLInputElement>('#neo-listbulletline-draw');
  if (drawCheckbox) drawCheckbox.checked = initialDrawOn;
  dialog.element.querySelector('#neo-listbulletline-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-listbulletline-confirm')?.addEventListener('click', () => {
    if (!isCurrent() || !dialog.element.isConnected) {
      dialog.destroy();
      return;
    }
    if (drawCheckbox && drawCheckbox.checked !== initialDrawOn) {
      drawOn = drawCheckbox.checked;
      saveConfig({ 'listbulletline-draw': drawOn });
      if (neoFeatureActive) applyDrawClass();
    }
    dialog.destroy();
  });
}
export function destroyListBulletLine(): void {
  neoFeatureActive = false;
  configRevision += 1;
  removeCss('extension-listbulletline');
  fetchMonitor.detach();
  document.documentElement?.classList.remove('neo-listbulletline');
  document.body.classList.remove('neo-listbulletline-draw-on');
  unbindSelectionChange();
}
