import { isMobile } from '../modules/env';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
import { getPlugin } from '../main/guard';
import { Dialog } from 'siyuan';
const positionCycle: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'left', 'bottom', 'right'];
let _observer: MutationObserver | null = null;
let _rafPending = false;
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;
let _destroyed = false;
let pinnedToolbarPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
let pinnedToolbarLiquidGlass = false;
let contextMenuHandler: ((e: MouseEvent) => void) | null = null;
function shouldNotPin(el: HTMLElement): boolean {
  return !!el.parentElement?.matches('#searchPreview, .card__block, .agent-chat__composer-host, .agent-chat__edit-editor');
}
function setEnableState(el: HTMLElement): void {
  if (shouldNotPin(el)) return;
  const content = el.parentElement?.querySelector('.protyle-content');
  if (!content) {
    el.classList.remove('neo-extension-pinnedtoolbar-enable');
    return;
  }
  const wysiwyg = content.querySelector('.protyle-wysiwyg');
  const isEditable = wysiwyg?.getAttribute('data-readonly') === 'false';
  el.classList.toggle('neo-extension-pinnedtoolbar-enable', isEditable);
}
function applyStyle(): void {
  document.body.classList.toggle('neo-extension-pinnedtoolbar-style-liquid-glass', pinnedToolbarLiquidGlass);
}
function applyPosition(force: boolean = false): void {
  const targetClass = `neo-extension-pinnedtoolbar-position-${pinnedToolbarPosition}`;
  const toolbars = document.querySelectorAll<HTMLElement>('.protyle-toolbar');
  toolbars.forEach((el) => {
    if (shouldNotPin(el)) return;
    setEnableState(el);
    if (force) {
      el.classList.remove('neo-extension-pinnedtoolbar-position-top', 'neo-extension-pinnedtoolbar-position-bottom', 'neo-extension-pinnedtoolbar-position-left', 'neo-extension-pinnedtoolbar-position-right');
      el.classList.add(targetClass);
    } else if (!el.classList.contains('neo-extension-pinnedtoolbar-position-top') && !el.classList.contains('neo-extension-pinnedtoolbar-position-bottom') && !el.classList.contains('neo-extension-pinnedtoolbar-position-left') && !el.classList.contains('neo-extension-pinnedtoolbar-position-right')) {
      el.classList.add(targetClass);
    }
  });
}
function cyclePosition(el: HTMLElement): void {
  const currentClass = Array.from(el.classList).find(c => c.startsWith('neo-extension-pinnedtoolbar-position-'));
  let currentPosition = 'top';
  if (currentClass) {
    const match = currentClass.match(/neo-extension-pinnedtoolbar-position-(top|bottom|left|right)/);
    if (match) currentPosition = match[1];
  }
  const currentIndex = positionCycle.indexOf(currentPosition as 'top' | 'bottom' | 'left' | 'right');
  const nextPosition = positionCycle[(currentIndex + 1) % positionCycle.length];
  el.classList.remove('neo-extension-pinnedtoolbar-position-top', 'neo-extension-pinnedtoolbar-position-bottom', 'neo-extension-pinnedtoolbar-position-left', 'neo-extension-pinnedtoolbar-position-right');
  el.classList.add(`neo-extension-pinnedtoolbar-position-${nextPosition}`);
}
export function initPinnedToolbar(): void {
  if (isMobile()) return;
  (window as any).__neoOpenPinnedToolbarSettings = showPinnedToolbarSettings;
  loadConfig().then((config) => {
    pinnedToolbarPosition = config['pinned-toolbar-position'] || 'top';
    pinnedToolbarLiquidGlass = config['pinned-toolbar-liquid-glass'] === true;
    if (config['pinned-toolbar'] === true) {
      ensureCss('extension-pinnedtoolbar', featureCss['extension-pinnedtoolbar']);
      document.documentElement.classList.add('neo-extension-pinnedtoolbar');
      startObserving();
    }
  });
}
export function onPinnedToolbarClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-extension-pinnedtoolbar');
  if (isActive) {
    destroyPinnedToolbar();
    saveConfig({ 'pinned-toolbar': false } as Partial<Config>);
  } else {
    ensureCss('extension-pinnedtoolbar', featureCss['extension-pinnedtoolbar']);
    htmlEl.classList.add('neo-extension-pinnedtoolbar');
    saveConfig({ 'pinned-toolbar': true } as Partial<Config>);
    startObserving();
  }
}
export function createPinnedToolbarLabelHTML(i18n: Record<string, string>): string {
  return `<span class="fn__flex fn__pointer">
    <span>${i18n.pinnedToolbar}</span>
    <span class="fn__space fn__flex-1 neo-menu-item-second-icon-space"></span>
    <svg class="b3-menu__icon neo-menu-item-second-icon ariaLabel" aria-label="${i18n.pinnedToolbarSettings}" onclick="event.stopPropagation();__neoOpenPinnedToolbarSettings()"><use xlink:href="#iconSettings"></use></svg>
  </span>`;
}
function scheduleApply(): void {
  if (_debounceTimer !== null) {
    clearTimeout(_debounceTimer);
  }
  _debounceTimer = setTimeout(() => {
    _debounceTimer = null;
    if (_destroyed || _rafPending) return;
    _rafPending = true;
    requestAnimationFrame(() => {
      _rafPending = false;
      if (_destroyed) return;
      try { applyPosition(); } catch {}
    });
  }, 200);
}
function startObserving(): void {
  _destroyed = false;
  try { applyPosition(); } catch {}
  try { applyStyle(); } catch {}
  _observer = new MutationObserver(() => {
    scheduleApply();
  });
  _observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-readonly'] });
  if (!contextMenuHandler) {
    contextMenuHandler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.protyle-toolbar');
      if (!target) return;
      if (shouldNotPin(target as HTMLElement)) return;
      e.preventDefault();
      cyclePosition(target as HTMLElement);
    };
    document.addEventListener('contextmenu', contextMenuHandler);
  }
}
function stopObserving(): void {
  _destroyed = true;
  _rafPending = false;
  if (_debounceTimer !== null) {
    clearTimeout(_debounceTimer);
    _debounceTimer = null;
  }
  if (_observer) {
    _observer.disconnect();
    _observer = null;
  }
  if (contextMenuHandler) {
    document.removeEventListener('contextmenu', contextMenuHandler);
    contextMenuHandler = null;
  }
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const positionOptions = ['top', 'bottom', 'left', 'right']
    .map(v => `<option value="${v}">${i18n[`pinnedToolbarPosition${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.pinnedToolbarPosition}</div>
              <div class="b3-label__text">${i18n.pinnedToolbarPositionTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-pinned-toolbar-position">
              ${positionOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.pinnedToolbarLiquidGlass}</div>
              <div class="b3-label__text">${i18n.pinnedToolbarLiquidGlassTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-pinned-toolbar-liquid-glass" type="checkbox">
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-pinned-toolbar-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-pinned-toolbar-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showPinnedToolbarSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.pinnedToolbarSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const positionSelect = dialog.element.querySelector('#neo-pinned-toolbar-position') as HTMLSelectElement;
  if (positionSelect) positionSelect.value = pinnedToolbarPosition;
  const liquidGlassSwitch = dialog.element.querySelector('#neo-pinned-toolbar-liquid-glass') as HTMLInputElement;
  if (liquidGlassSwitch) liquidGlassSwitch.checked = pinnedToolbarLiquidGlass;
  dialog.element.querySelector('#neo-pinned-toolbar-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-pinned-toolbar-confirm')?.addEventListener('click', () => {
    if (positionSelect) {
      const newPosition = positionSelect.value as 'top' | 'bottom' | 'left' | 'right';
      if (newPosition !== pinnedToolbarPosition) {
        pinnedToolbarPosition = newPosition;
        if (document.documentElement.classList.contains('neo-extension-pinnedtoolbar')) {
          applyPosition(true);
        }
        saveConfig({ 'pinned-toolbar-position': newPosition } as Partial<Config>);
      }
    }
    if (liquidGlassSwitch) {
      const newLiquidGlass = liquidGlassSwitch.checked;
      if (newLiquidGlass !== pinnedToolbarLiquidGlass) {
        pinnedToolbarLiquidGlass = newLiquidGlass;
        applyStyle();
        saveConfig({ 'pinned-toolbar-liquid-glass': newLiquidGlass } as Partial<Config>);
      }
    }
    dialog.destroy();
  });
}
export function destroyPinnedToolbar(): void {
  removeCss('extension-pinnedtoolbar');
  document.documentElement?.classList.remove('neo-extension-pinnedtoolbar');
  stopObserving();
  const toolbars = document.querySelectorAll<HTMLElement>('.protyle-toolbar');
  toolbars.forEach((el) => {
    el.classList.remove('neo-extension-pinnedtoolbar-position-top', 'neo-extension-pinnedtoolbar-position-bottom', 'neo-extension-pinnedtoolbar-position-left', 'neo-extension-pinnedtoolbar-position-right', 'neo-extension-pinnedtoolbar-enable');
  });
  document.body.classList.remove('neo-extension-pinnedtoolbar-style-liquid-glass');
}
