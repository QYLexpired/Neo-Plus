import { isMobile } from '../modules/env';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { saveConfig, loadConfig, type Config } from '../main/data';
import { fetchListener } from '../modules/fetchmonitor';
import { withViewTransition } from '../modules/viewtransition';
import { Dialog } from 'siyuan';
import { getPlugin } from '../main/context';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let neoFeatureActive = false;
let pointerDownHandler: ((e: PointerEvent) => void) | null = null;
let dblClickHandler: ((e: MouseEvent) => void) | null = null;
interface ActiveResizeSession {
  controller: AbortController;
  handle: HTMLElement;
  flexEl: HTMLElement;
  pointerId: number;
}
let activeResizeSession: ActiveResizeSession | null = null;
const defaultWidth = 150;
const minWidth = 100;
const maxWidth = 400;
function clampWidth(value: number): number {
  return Math.max(minWidth, Math.min(maxWidth, Math.round(value)));
}
function readConfigWidth(config: Config): number | null {
  const raw = config['vertical-tabs-width'];
  return typeof raw === 'number' && !Number.isNaN(raw) ? clampWidth(raw) : null;
}
let topLeftOnlyLastWidth: number | null = null;
let configWidth: number | null = null;
let currentMode: 'topLeftOnly' | 'all' = 'topLeftOnly';
const wndSelector = '.layout__center [data-type="wnd"]';
function finishActiveResize(commitWidth: boolean): void {
  const session = activeResizeSession;
  if (!session) return;
  activeResizeSession = null;
  if (session.handle.hasPointerCapture(session.pointerId)) {
    session.handle.releasePointerCapture(session.pointerId);
  }
  session.controller.abort();
  if (commitWidth && neoFeatureActive && currentMode === 'topLeftOnly' && session.flexEl.isConnected) {
    topLeftOnlyLastWidth = session.flexEl.getBoundingClientRect().width;
  }
}
function applyVerticalTabsConfig(config: Config): void {
  configWidth = readConfigWidth(config);
  currentMode = config['vertical-tabs-mode'] || 'topLeftOnly';
  topLeftOnlyLastWidth = null;
}
function queryWnds(): NodeListOf<HTMLElement> {
  return document.querySelectorAll<HTMLElement>(wndSelector);
}
function addResizeElement(wnd: HTMLElement, firstFlex: HTMLElement): void {
  if (!wnd.querySelector('.neo-verticaltabs-resize')) {
    const resizeEl = document.createElement('div');
    resizeEl.className = 'layout__resize--lr layout__resize neo-verticaltabs-resize';
    firstFlex.after(resizeEl);
  }
}
function clearVerticalTabsLayout(): void {
  queryWnds().forEach((wnd) => {
    wnd.classList.remove('neo-verticaltabs-wnd');
    const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
    if (firstFlex) firstFlex.style.width = '';
  });
  document.querySelectorAll('.neo-verticaltabs-resize').forEach((el) => el.remove());
}
function doUpdateTopLeftOnly(): void {
  clearVerticalTabsLayout();
  const wnds = queryWnds();
  if (wnds.length === 0) return;
  let topLeftWnd: HTMLElement | null = null;
  let topLeftRect: DOMRect | null = null;
  for (let i = 0; i < wnds.length; i++) {
    const wnd = wnds[i];
    const rect = wnd.getBoundingClientRect();
    if (!topLeftWnd || !topLeftRect) {
      topLeftWnd = wnd;
      topLeftRect = rect;
      continue;
    }
    if (rect.top < topLeftRect.top || (rect.top === topLeftRect.top && rect.left < topLeftRect.left)) {
      topLeftWnd = wnd;
      topLeftRect = rect;
    }
  }
  if (!topLeftWnd) return;
  topLeftWnd.classList.add('neo-verticaltabs-wnd');
  const firstFlex = topLeftWnd.querySelector<HTMLElement>('.fn__flex:first-child');
  if (!firstFlex || firstFlex.classList.contains('fn__none')) return;
  firstFlex.style.width = `${topLeftOnlyLastWidth ?? configWidth ?? defaultWidth}px`;
  addResizeElement(topLeftWnd, firstFlex);
}
function doUpdateAll(): void {
  queryWnds().forEach((wnd) => {
    wnd.classList.remove('neo-verticaltabs-wnd');
  });
  document.querySelectorAll('.neo-verticaltabs-resize').forEach((el) => el.remove());
  const wnds = queryWnds();
  if (wnds.length === 0) return;
  wnds.forEach((wnd) => {
    wnd.classList.add('neo-verticaltabs-wnd');
    const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
    if (firstFlex && !firstFlex.classList.contains('fn__none')) {
      if (!firstFlex.style.width) {
        firstFlex.style.width = `${configWidth ?? defaultWidth}px`;
      }
      addResizeElement(wnd, firstFlex);
    }
  });
}
function doUpdate(): void {
  if (!neoFeatureActive) return;
  if (document.body?.classList.contains('body--toolbar-hide') || document.body?.classList.contains('body--window')) {
    clearVerticalTabsLayout();
    return;
  }
  const wnds = queryWnds();
  if (wnds.length === 0) {
    clearVerticalTabsLayout();
    return;
  }
  if (currentMode === 'all') {
    doUpdateAll();
  } else {
    doUpdateTopLeftOnly();
  }
}
function initResizeHandle(): void {
  if (pointerDownHandler || dblClickHandler) return;
  pointerDownHandler = (e: PointerEvent) => {
    const target = e.target;
    if (!(target instanceof HTMLElement) || !target.classList.contains('neo-verticaltabs-resize')) return;
    if (!e.isPrimary || e.button !== 0) return;
    e.preventDefault();
    const wnd = target.closest<HTMLElement>('.neo-verticaltabs-wnd');
    if (!wnd) return;
    const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
    if (!firstFlex) return;
    const flexEl = firstFlex;
    const startX = e.clientX;
    const currentWidth = flexEl.getBoundingClientRect().width || defaultWidth;
    finishActiveResize(true);
    const controller = new AbortController();
    const pointerId = e.pointerId;
    activeResizeSession = { controller, handle: target, flexEl, pointerId };
    const finish = (): void => finishActiveResize(true);
    const onPointerMove = (ev: PointerEvent): void => {
      if (ev.pointerId !== pointerId || activeResizeSession?.controller !== controller) return;
      const diff = ev.clientX - startX;
      let newWidth = currentWidth + diff;
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      flexEl.style.width = `${newWidth}px`;
    };
    const onPointerEnd = (ev: PointerEvent): void => {
      if (ev.pointerId === pointerId) finish();
    };
    document.addEventListener('pointermove', onPointerMove, { signal: controller.signal });
    document.addEventListener('pointerup', onPointerEnd, { signal: controller.signal });
    document.addEventListener('pointercancel', onPointerEnd, { signal: controller.signal });
    target.addEventListener('lostpointercapture', finish, { signal: controller.signal });
    window.addEventListener('blur', finish, { signal: controller.signal });
    target.setPointerCapture(pointerId);
  };
  dblClickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('neo-verticaltabs-resize')) return;
    const wnd = target.closest<HTMLElement>('.neo-verticaltabs-wnd');
    if (wnd) {
      const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
      if (firstFlex) {
        firstFlex.style.width = `${configWidth ?? defaultWidth}px`;
        if (currentMode === 'topLeftOnly') {
          topLeftOnlyLastWidth = configWidth ?? defaultWidth;
        }
      }
    }
  };
  document.addEventListener('pointerdown', pointerDownHandler);
  document.addEventListener('dblclick', dblClickHandler);
}
function destroyResizeHandle(): void {
  finishActiveResize(false);
  if (pointerDownHandler) {
    document.removeEventListener('pointerdown', pointerDownHandler);
    pointerDownHandler = null;
  }
  if (dblClickHandler) {
    document.removeEventListener('dblclick', dblClickHandler);
    dblClickHandler = null;
  }
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const modeOptions = ['topLeftOnly', 'all']
    .map(v => `<option value="${v}">${i18n[`verticaltabsMode${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  const width = configWidth ?? defaultWidth;
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.verticaltabsMode}</div>
              <div class="b3-label__text">${i18n.verticaltabsModeTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-verticaltabs-mode">
              ${modeOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.verticaltabsWidth}</div>
              <div class="b3-label__text">${i18n.verticaltabsWidthTip}</div>
            </div>
            <span class="fn__space"></span>
            <div class="b3-tooltips b3-tooltips__n fn__flex-center" id="neo-verticaltabs-width-tooltip" aria-label="${width}px">
              <input class="b3-slider fn__size200" id="neo-verticaltabs-width" max="${maxWidth}" min="${minWidth}" step="1" type="range" value="${width}">
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-verticaltabs-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-verticaltabs-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showVerticalTabsSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.verticaltabsSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const modeSelect = dialog.element.querySelector('#neo-verticaltabs-mode') as HTMLSelectElement;
  if (modeSelect) modeSelect.value = currentMode;
  const widthSlider = dialog.element.querySelector('#neo-verticaltabs-width') as HTMLInputElement;
  const widthTooltip = dialog.element.querySelector('#neo-verticaltabs-width-tooltip') as HTMLElement;
  if (widthSlider) {
    widthSlider.value = String(configWidth ?? defaultWidth);
    widthSlider.addEventListener('input', () => {
      if (widthTooltip) widthTooltip.setAttribute('aria-label', `${widthSlider.value}px`);
    });
  }
  dialog.element.querySelector('#neo-verticaltabs-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-verticaltabs-confirm')?.addEventListener('click', () => {
    if (modeSelect) {
      const newMode = modeSelect.value as 'topLeftOnly' | 'all';
      if (newMode !== currentMode) {
        if (neoFeatureActive) {
          queryWnds().forEach((wnd) => {
            const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
            if (firstFlex) firstFlex.style.width = '';
          });
        }
        topLeftOnlyLastWidth = null;
        currentMode = newMode;
        saveConfig({ 'vertical-tabs-mode': newMode } as Partial<Config>);
        if (neoFeatureActive) {
          doUpdate();
        }
      }
    }
    if (widthSlider) {
      const newWidth = clampWidth(Number(widthSlider.value));
      const currentWidth = configWidth ?? defaultWidth;
      if (newWidth !== currentWidth) {
        configWidth = newWidth;
        topLeftOnlyLastWidth = null;
        saveConfig({ 'vertical-tabs-width': newWidth } as Partial<Config>);
        if (neoFeatureActive) {
          if (currentMode === 'all') {
            queryWnds().forEach((wnd) => {
              const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
              if (firstFlex && !firstFlex.classList.contains('fn__none')) {
                firstFlex.style.width = `${newWidth}px`;
              }
            });
          } else {
            doUpdate();
          }
        }
      }
    }
    dialog.destroy();
  });
}
const _fetchListener = fetchListener();
_fetchListener.onNotify('setUILayout', () => { doUpdate(); });
function enableVerticalTabs(): void {
  if (neoFeatureActive) return;
  ensureCss('verticaltabs', featureCss['verticaltabs']);
  document.documentElement.classList.add('neo-verticaltabs');
  neoFeatureActive = true;
  topLeftOnlyLastWidth = null;
  initResizeHandle();
  _fetchListener.attach();
  doUpdate();
}
export function initVerticalTabs(): void {
  if (isMobile()) return;
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    applyVerticalTabsConfig(config);
    if (neoFeatureActive) {
      clearVerticalTabsLayout();
      doUpdate();
    } else if (config['vertical-tabs'] === true) {
      enableVerticalTabs();
    }
  });
}
export function onVerticalTabsClick(): void {
  if (isMobile()) return;
  const shouldEnable = !neoFeatureActive;
  withViewTransition(() => {
    if (shouldEnable) {
      enableVerticalTabs();
      saveConfig({ 'vertical-tabs': true } as Partial<Config>);
    } else {
      destroyVerticalTabs();
      saveConfig({ 'vertical-tabs': false } as Partial<Config>);
    }
  });
}
export function destroyVerticalTabs(): void {
  neoFeatureActive = false;
  removeCss('verticaltabs');
  _fetchListener.detach();
  destroyResizeHandle();
  document.documentElement?.classList.remove('neo-verticaltabs');
  clearVerticalTabsLayout();
}
