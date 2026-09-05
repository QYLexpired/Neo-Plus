import { saveConfig, loadConfig, type Config } from '../main/data';
import { getPlugin } from '../main/context';
import { getTextColor } from '../modules/getselection';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { Dialog } from 'siyuan';
import { createNeoLifecycleGuard } from '../main/lifecycle';
const debounceDelay = 200;
let focusBlockEffect: 'vertical-line' | 'shadow' | 'background' = 'vertical-line';
let pendingUpdate = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let selectionChangeHandler: (() => void) | null = null;
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
function applyFocusBlock(): void {
  pendingUpdate = false;
  const selection = window.getSelection();
  const focusNode = selection && selection.rangeCount > 0 ? selection.focusNode : null;
  const focusElement = focusNode?.nodeType === Node.ELEMENT_NODE ? focusNode as Element : focusNode?.parentElement;
  const curBlock = focusElement?.closest('[data-node-id]');
  updateFocusBlock(curBlock ?? null, focusNode);
}
function handleUpdate(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    if (pendingUpdate) applyFocusBlock();
  }, debounceDelay);
}
function onSelectionChange(): void {
  pendingUpdate = true;
  handleUpdate();
}
function startObserving(): void {
  selectionChangeHandler = () => {
    onSelectionChange();
  };
  document.addEventListener('selectionchange', selectionChangeHandler);
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
  if (selectionChangeHandler) {
    document.removeEventListener('selectionchange', selectionChangeHandler);
    selectionChangeHandler = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingUpdate = false;
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
