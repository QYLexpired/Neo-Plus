import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let selectionChangeHandler: (() => void) | null = null;
let clickHandler: ((event: MouseEvent) => void) | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastMarkedItems: Set<HTMLElement> = new Set();
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
    let node: Node | null = selection.getRangeAt(0).startContainer;
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
function bindSelectionChange(): void {
  if (selectionChangeHandler) {
    return;
  }
  selectionChangeHandler = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      runSelectionUpdate();
      debounceTimer = null;
    }, 50);
  };
  clickHandler = (event: MouseEvent) => {
    const target = event.composedPath()[0] as HTMLElement;
    if (target.closest?.('.protyle-action')) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        runSelectionUpdate(target);
        debounceTimer = null;
      }, 50);
    }
  };
  document.addEventListener('selectionchange', selectionChangeHandler);
  document.addEventListener('click', clickHandler, { capture: true });
  runSelectionUpdate();
}
function unbindSelectionChange(): void {
  if (!selectionChangeHandler) {
    clearBulletLineMarks();
    return;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  document.removeEventListener('selectionchange', selectionChangeHandler);
  if (clickHandler) {
    document.removeEventListener('click', clickHandler, { capture: true });
    clickHandler = null;
  }
  selectionChangeHandler = null;
  clearBulletLineMarks();
}
export function initListBulletLine(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    if (config['list-bullet-line'] === true) {
      ensureCss('extension-listbulletline', featureCss['extension-listbulletline']);
      document.documentElement.classList.add('neo-extension-listbulletline');
      bindSelectionChange();
    }
  });
}
export function onListBulletLineClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-extension-listbulletline');
  if (isActive) {
    destroyListBulletLine();
    saveConfig({ 'list-bullet-line': false } as Partial<Config>);
  } else {
    ensureCss('extension-listbulletline', featureCss['extension-listbulletline']);
    htmlEl.classList.add('neo-extension-listbulletline');
    saveConfig({ 'list-bullet-line': true } as Partial<Config>);
    bindSelectionChange();
  }
}
export function destroyListBulletLine(): void {
  removeCss('extension-listbulletline');
  document.documentElement?.classList.remove('neo-extension-listbulletline');
  unbindSelectionChange();
}
