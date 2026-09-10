import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let selectionChangeHandler: (() => void) | null = null;
let clickHandler: ((event: MouseEvent) => void) | null = null;
let updateFrame: number | null = null;
let pendingClickTarget: HTMLElement | null = null;
let lastMarkedItems: Set<HTMLElement> = new Set();
let neoFeatureActive = false;
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
function addMarkToItem(item: HTMLElement, hasNext: boolean, nextItem?: HTMLElement): void {
  item.setAttribute('neo-listbulletline-node', '');
  if (hasNext && nextItem) {
    const currentRect = item.getBoundingClientRect();
    const nextRect = nextItem.getBoundingClientRect();
    item.style.setProperty('--neo-listbulletline-height', `${currentRect.top - nextRect.top}px`);
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
  } else if (selection && selection.rangeCount) {
    let node: Node | null = getSelectionStartNode(selection.getRangeAt(0));
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
  currentListItems.forEach((item, index) => {
    const hasNext = index < currentListItems.length - 1;
    const nextItem = hasNext ? currentListItems[index + 1] : undefined;
    if (!lastMarkedItems.has(item)) {
      addMarkToItem(item, hasNext, nextItem);
    } else {
      if (hasNext && nextItem) {
        const currentRect = item.getBoundingClientRect();
        const nextRect = nextItem.getBoundingClientRect();
        const newHeight = `${currentRect.top - nextRect.top}px`;
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
  lastMarkedItems = currentSet;
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
function enableListBulletLine(): void {
  if (neoFeatureActive) return;
  ensureCss('extension-listbulletline', featureCss['extension-listbulletline']);
  document.documentElement.classList.add('neo-listbulletline');
  neoFeatureActive = true;
  bindSelectionChange();
}
export function initListBulletLine(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    if (config['listbulletline'] === true) {
      enableListBulletLine();
    }
  });
}
export function onListBulletLineClick(): void {
  if (neoFeatureActive) {
    destroyListBulletLine();
    saveConfig({ 'listbulletline': false } as Partial<Config>);
  } else {
    enableListBulletLine();
    saveConfig({ 'listbulletline': true } as Partial<Config>);
  }
}
export function destroyListBulletLine(): void {
  neoFeatureActive = false;
  removeCss('extension-listbulletline');
  document.documentElement?.classList.remove('neo-listbulletline');
  unbindSelectionChange();
}
