import { saveConfig, loadConfig, type Config } from '../main/data';
import { getPlugin } from '../main/context';
import { getTextColor } from '../modules/getselection';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { Dialog } from '../modules/dialog';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let focusBlockEffect: 'vertical-line' | 'shadow' | 'background' = 'vertical-line';
let updateFrame: number | null = null;
let neoFeatureActive = false;
let activeFocusBlock: Element | null = null;
function applyFocusBlockEffect(): void {
  document.body.classList.toggle('neo-focusblockindicator-shadow', focusBlockEffect === 'shadow');
  document.body.classList.toggle('neo-focusblockindicator-vertical-line', focusBlockEffect === 'vertical-line');
  document.body.classList.toggle('neo-focusblockindicator-background', focusBlockEffect === 'background');
  if (focusBlockEffect !== 'background') {
    document.documentElement?.style.removeProperty('--neo-focusblock-text-color');
  }
}
function clearAllFocusBlocks(): void {
  activeFocusBlock?.removeAttribute('neo-focusblock');
  activeFocusBlock = null;
  document.querySelectorAll('[neo-focusblock]').forEach((el) => {
    el.removeAttribute('neo-focusblock');
  });
  document.documentElement?.style.removeProperty('--neo-focusblock-text-color');
}
function updateFocusBlock(block: Element | null, focusNode: Node | null): void {
  if (activeFocusBlock !== block) {
    activeFocusBlock?.removeAttribute('neo-focusblock');
    activeFocusBlock = block;
    activeFocusBlock?.setAttribute('neo-focusblock', '');
  }
  if (!block || !focusNode || focusBlockEffect !== 'background') {
    document.documentElement?.style.removeProperty('--neo-focusblock-text-color');
    return;
  }
  const textColor = getTextColor(focusNode, block);
  if (textColor) {
    document.documentElement.style.setProperty('--neo-focusblock-text-color', textColor);
  } else {
    document.documentElement.style.removeProperty('--neo-focusblock-text-color');
  }
}
function getFocusNode(selection: Selection | null): Node | null {
  if (!selection || selection.rangeCount === 0) return null;
  const focusNode = selection.focusNode;
  if (!focusNode || selection.isCollapsed) return focusNode;
  const range = selection.getRangeAt(0);
  if (focusNode !== range.endContainer || selection.focusOffset !== range.endOffset) return focusNode;
  if (focusNode.nodeType === Node.TEXT_NODE && selection.focusOffset > 0) return focusNode;
  const focusElement = focusNode.nodeType === Node.ELEMENT_NODE ? focusNode as Element : focusNode.parentElement;
  const editor = focusElement?.closest('.protyle-wysiwyg');
  if (!editor) return focusNode;
  let node: Node | null = focusNode;
  let offset = selection.focusOffset;
  while (node && editor.contains(node)) {
    if (offset > 0) {
      node = node.childNodes[offset - 1];
    } else {
      if (node === editor) break;
      if (!node.previousSibling) {
        node = node.parentNode;
        continue;
      }
      node = node.previousSibling;
    }
    while (node.lastChild) node = node.lastChild;
    const element: Element | null = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
    const block: Element | null | undefined = element?.closest('[data-node-id]');
    if (block && block !== editor && editor.contains(block)) return node;
    offset = 0;
  }
  return focusNode;
}
function applyFocusBlock(): void {
  updateFrame = null;
  if (!neoFeatureActive) return;
  const selection = window.getSelection();
  const focusNode = getFocusNode(selection);
  const focusElement = focusNode?.nodeType === Node.ELEMENT_NODE ? focusNode as Element : focusNode?.parentElement;
  const curBlock = focusElement?.closest('[data-node-id]');
  updateFocusBlock(curBlock ?? null, focusNode);
}
function scheduleFocusBlockUpdate(): void {
  if (!neoFeatureActive || updateFrame !== null) return;
  updateFrame = window.requestAnimationFrame(applyFocusBlock);
}
function startObserving(): void {
  document.addEventListener('selectionchange', scheduleFocusBlockUpdate);
  document.addEventListener('mouseup', scheduleFocusBlockUpdate);
  document.addEventListener('keyup', scheduleFocusBlockUpdate);
  scheduleFocusBlockUpdate();
}
function enableFocusBlockIndicator(): void {
  if (neoFeatureActive) return;
  ensureCss('extension-focusblockindicator', featureCss['extension-focusblockindicator']);
  document.documentElement.classList.add('neo-focusblockindicator');
  neoFeatureActive = true;
  applyFocusBlockEffect();
  startObserving();
}
function stopObserving(): void {
  document.removeEventListener('selectionchange', scheduleFocusBlockUpdate);
  document.removeEventListener('mouseup', scheduleFocusBlockUpdate);
  document.removeEventListener('keyup', scheduleFocusBlockUpdate);
  if (updateFrame !== null) {
    window.cancelAnimationFrame(updateFrame);
    updateFrame = null;
  }
  clearAllFocusBlocks();
}
export function initFocusBlockIndicator(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    focusBlockEffect = config['focusblockindicator-effect'] || 'vertical-line';
    if (neoFeatureActive) {
      applyFocusBlockEffect();
    } else if (config['focusblockindicator'] === true) {
      enableFocusBlockIndicator();
    }
  });
}
export function onFocusBlockIndicatorClick(): void {
  if (neoFeatureActive) {
    destroyFocusBlockIndicator();
    saveConfig({ 'focusblockindicator': false } as Partial<Config>);
  } else {
    enableFocusBlockIndicator();
    saveConfig({ 'focusblockindicator': true } as Partial<Config>);
  }
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const effectOptions = ['vertical-line', 'shadow', 'background']
    .map(v => `<option value="${v}">${i18n[`focusBlockEffect${v.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`]}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.focusBlockEffect}</div>
              <div class="b3-label__text">${i18n.focusBlockEffectTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-focusblockindicator-effect">
              ${effectOptions}
            </select>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-focusblockindicator-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-focusblockindicator-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showFocusBlockIndicatorSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.focusBlockIndicatorSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const effectSelect = dialog.element.querySelector('#neo-focusblockindicator-effect') as HTMLSelectElement;
  if (effectSelect) effectSelect.value = focusBlockEffect;
  dialog.element.querySelector('#neo-focusblockindicator-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-focusblockindicator-confirm')?.addEventListener('click', () => {
    if (effectSelect) {
      const newEffect = effectSelect.value as 'vertical-line' | 'shadow' | 'background';
      if (newEffect !== focusBlockEffect) {
        focusBlockEffect = newEffect;
        saveConfig({ 'focusblockindicator-effect': newEffect } as Partial<Config>);
        if (neoFeatureActive) {
          applyFocusBlockEffect();
        }
      }
    }
    dialog.destroy();
  });
}
export function destroyFocusBlockIndicator(): void {
  neoFeatureActive = false;
  removeCss('extension-focusblockindicator');
  document.documentElement?.classList.remove('neo-focusblockindicator');
  document.body.classList.remove('neo-focusblockindicator-shadow', 'neo-focusblockindicator-vertical-line', 'neo-focusblockindicator-background');
  document.documentElement?.style.removeProperty('--neo-focusblock-text-color');
  stopObserving();
}
