import { saveConfig, loadConfig, type Config } from '../main/data';
import { getPlugin } from '../main/context';
import { getTextColor } from '../modules/getselection';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { Dialog } from '../modules/dialog';
import { createNeoLifecycleGuard } from '../main/lifecycle';
type FocusBlockFilter = 'table' | 'codeblock' | 'iframe' | 'htmlblock' | 'renderblock' | 'mathblock' | 'database' | 'widget' | 'videoblock' | 'audioblock' | 'customblock';
const focusBlockFilters: FocusBlockFilter[] = ['table', 'codeblock', 'iframe', 'htmlblock', 'renderblock', 'mathblock', 'database', 'widget', 'videoblock', 'audioblock', 'customblock'];
const focusBlockFilterLabels: Record<FocusBlockFilter, string> = {
  table: 'Table',
  codeblock: 'CodeBlock',
  iframe: 'Iframe',
  htmlblock: 'HtmlBlock',
  renderblock: 'RenderBlock',
  mathblock: 'MathBlock',
  database: 'Database',
  widget: 'Widget',
  videoblock: 'VideoBlock',
  audioblock: 'AudioBlock',
  customblock: 'CustomBlock',
};
const focusBlockFilterIcons: Record<FocusBlockFilter, string> = {
  table: 'iconTable',
  codeblock: 'iconCode',
  iframe: 'iconGlobe',
  htmlblock: 'iconHTML5',
  renderblock: 'iconGraph',
  mathblock: 'iconMath',
  database: 'iconDatabase',
  widget: 'iconBoth',
  videoblock: 'iconVideo',
  audioblock: 'iconRecord',
  customblock: 'iconPlugin',
};
let focusBlockEffect: 'vertical-line' | 'shadow' | 'background' = 'vertical-line';
let focusBlockDisabled: FocusBlockFilter[] = [];
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
function normalizeFocusBlockDisabled(value: Config['focusblockindicator-disabled']): FocusBlockFilter[] {
  const selected = Array.isArray(value) ? value : [];
  return focusBlockFilters.filter(filter => selected.includes(filter));
}
function matchesFocusBlockFilter(filter: FocusBlockFilter, block: Element): boolean {
  const type = block.getAttribute('data-type');
  if (filter === 'table') return type === 'NodeTable';
  if (filter === 'iframe') return type === 'NodeIFrame';
  if (filter === 'htmlblock') return type === 'NodeHTMLBlock';
  if (filter === 'mathblock') return type === 'NodeMathBlock';
  if (filter === 'database') return type === 'NodeAttributeView';
  if (filter === 'widget') return type === 'NodeWidget';
  if (filter === 'videoblock') return type === 'NodeVideo';
  if (filter === 'audioblock') return type === 'NodeAudio';
  if (filter === 'customblock') return type === 'NodeCustomBlock';
  if (type !== 'NodeCodeBlock') return false;
  if (filter === 'codeblock') return block.classList.contains('code-block');
  if (filter === 'renderblock') return block.classList.contains('render-node');
  return false;
}
function isFocusBlockDisabled(block: Element): boolean {
  return focusBlockDisabled.some(filter => matchesFocusBlockFilter(filter, block));
}
function getFocusBlock(focusNode: Node | null): Element | null {
  const focusElement = focusNode?.nodeType === Node.ELEMENT_NODE ? focusNode as Element : focusNode?.parentElement;
  const block = focusElement?.closest('[data-node-id]');
  if (!block) return null;
  const target = block.closest('[data-sy-table-cell-inline], [data-sy-table-cell-rich]') ? block.closest('[data-node-id][data-type="NodeTable"]') ?? block : block;
  return isFocusBlockDisabled(target) ? null : target;
}
function applyFocusBlock(): void {
  updateFrame = null;
  if (!neoFeatureActive) return;
  const selection = window.getSelection();
  const focusNode = getFocusNode(selection);
  updateFocusBlock(getFocusBlock(focusNode), focusNode);
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
export function initFocusBlockIndicator(): Promise<void> {
  const isCurrent = createNeoLifecycleGuard();
  return loadConfig().then((config) => {
    if (!isCurrent()) return;
    focusBlockEffect = config['focusblockindicator-effect'] || 'vertical-line';
    focusBlockDisabled = normalizeFocusBlockDisabled(config['focusblockindicator-disabled']);
    if (neoFeatureActive) {
      applyFocusBlockEffect();
      applyFocusBlock();
    } else if (config['focusblockindicator'] === true) {
      enableFocusBlockIndicator();
    }
  });
}
export function onFocusBlockIndicatorClick(): void {
  if (neoFeatureActive) {
    destroyFocusBlockIndicator();
    saveConfig({ 'focusblockindicator': false });
  } else {
    enableFocusBlockIndicator();
    saveConfig({ 'focusblockindicator': true });
  }
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const effectOptions = ['vertical-line', 'shadow', 'background']
    .map(v => `<option value="${v}">${i18n[`focusBlockEffect${v.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`]}</option>`)
    .join('');
  const filterSwitches = focusBlockFilters.map(filter => `
            <label class="fn__flex" style="color:var(--b3-theme-on-surface);align-items:center">
              <input class="b3-switch" id="neo-focusblockindicator-disabled-${filter}" type="checkbox">
              <span class="fn__space"></span>
              <svg class="svg"><use xlink:href="#${focusBlockFilterIcons[filter]}"></use></svg>
              <span class="fn__space"></span>
              <div class="fn__flex-1 config-item__main">${i18n[`focusBlockFilter${focusBlockFilterLabels[filter]}`]}</div>
            </label>`).join('');
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
      <div class="config-group">
        <div class="config-items">
          <div class="b3-label config-item" style="display:flex;flex-direction:column;align-items:stretch;gap:12px">
            <div class="config-item__main">
              <div class="config-name">${i18n.focusBlockFilter}</div>
              <div class="b3-label__text">${i18n.focusBlockFilterTip}</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));gap:8px 16px;margin-top:8px" role="group" aria-label="${i18n.focusBlockFilter}">
              ${filterSwitches}
            </div>
          </div>
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
  const filterSwitches = focusBlockFilters.map(filter => ({
    filter,
    input: dialog.element.querySelector(`#neo-focusblockindicator-disabled-${filter}`) as HTMLInputElement,
  }));
  for (const { filter, input } of filterSwitches) {
    input.checked = !focusBlockDisabled.includes(filter);
  }
  dialog.element.querySelector('#neo-focusblockindicator-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-focusblockindicator-confirm')?.addEventListener('click', () => {
    let changed = false;
    if (effectSelect) {
      const newEffect = effectSelect.value as 'vertical-line' | 'shadow' | 'background';
      if (newEffect !== focusBlockEffect) {
        focusBlockEffect = newEffect;
        saveConfig({ 'focusblockindicator-effect': newEffect });
        changed = true;
      }
    }
    const newDisabled = filterSwitches.filter(({ input }) => !input.checked).map(({ filter }) => filter);
    if (newDisabled.length !== focusBlockDisabled.length || newDisabled.some(filter => !focusBlockDisabled.includes(filter))) {
      focusBlockDisabled = newDisabled;
      saveConfig({ 'focusblockindicator-disabled': newDisabled });
      changed = true;
    }
    if (changed && neoFeatureActive) {
      applyFocusBlockEffect();
      applyFocusBlock();
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
