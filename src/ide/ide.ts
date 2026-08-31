import { isMobile } from '../modules/env';
import { withViewTransition } from '../modules/viewtransition';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { saveConfig, loadConfig, type Config } from '../main/data';
import { getPlugin } from '../main/guard';
function debounce(cb: () => void, delay: number): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      cb();
      timer = null;
    }, delay);
  };
}
function hasActiveItemBeforeSpace(container: HTMLElement): boolean {
  for (const child of container.children) {
    if (child.classList.contains('dock__item--space')) break;
    if (child.classList.contains('dock__items') && child.querySelector('.dock__item--active')) return true;
  }
  return false;
}
function hasActiveItemAfterSpace(container: HTMLElement): boolean {
  let afterSpace = false;
  for (const child of container.children) {
    if (child.classList.contains('dock__item--space')) { afterSpace = true; continue; }
    if (afterSpace && child.classList.contains('dock__items') && child.querySelector('.dock__item--active')) return true;
  }
  return false;
}
function updateDockExpandState(): void {
  const dockLeft = document.querySelector<HTMLElement>('#dockLeft');
  const dockRight = document.querySelector<HTMLElement>('#dockRight');
  const body = document.body;
  let dockbExpanded = false;
  if (dockLeft) {
    const hasL = hasActiveItemBeforeSpace(dockLeft);
    const hasB = hasActiveItemAfterSpace(dockLeft);
    body.classList.toggle('neo-dockl-expand', hasL);
    body.classList.toggle('neo-dockl-not-expand', !hasL);
    if (hasB) dockbExpanded = true;
  }
  if (dockRight) {
    const hasR = hasActiveItemBeforeSpace(dockRight);
    const hasB = hasActiveItemAfterSpace(dockRight);
    body.classList.toggle('neo-dockr-expand', hasR);
    body.classList.toggle('neo-dockr-not-expand', !hasR);
    if (hasB) dockbExpanded = true;
  }
  body.classList.toggle('neo-dockb-expand', dockbExpanded);
  body.classList.toggle('neo-dockb-not-expand', !dockbExpanded);
}
function updateFloatState(): void {
  const dockl = document.querySelector<HTMLElement>('.layout__dockl');
  const dockr = document.querySelector<HTMLElement>('.layout__dockr');
  const dockb = document.querySelector<HTMLElement>('.layout__dockb');
  const body = document.body;
  const docklFloat = dockl?.classList.contains('layout--float') ?? false;
  const dockrFloat = dockr?.classList.contains('layout--float') ?? false;
  const dockbFloat = dockb?.classList.contains('layout--float') ?? false;
  body.classList.toggle('neo-dockl-float', docklFloat);
  body.classList.toggle('neo-dockl-not-float', !docklFloat);
  body.classList.toggle('neo-dockr-float', dockrFloat);
  body.classList.toggle('neo-dockr-not-float', !dockrFloat);
  body.classList.toggle('neo-dockb-float', dockbFloat);
  body.classList.toggle('neo-dockb-not-float', !dockbFloat);
}
function updateDockExpandAndFloat(): void {
  updateDockExpandState();
  updateFloatState();
}
const _debouncedUpdate = debounce(updateDockExpandAndFloat, 50);
function onInteractionUp(_e: MouseEvent | KeyboardEvent): void {
  _debouncedUpdate();
}
function attachEvents(): void {
  document.addEventListener('mouseup', onInteractionUp, { passive: true });
  document.addEventListener('keyup', onInteractionUp, { passive: true });
}
function detachEvents(): void {
  document.removeEventListener('mouseup', onInteractionUp);
  document.removeEventListener('keyup', onInteractionUp);
}
let _fallbackTimer: ReturnType<typeof setTimeout> | null = null;
export function initIde(): void {
  if (isMobile()) return;
  loadConfig().then((config) => {
    if (config['ide'] === true) {
      ensureCss('ide', featureCss['ide']);
      document.documentElement.classList.add('neo-ide');
      document.body.classList.add('neo-ide-body');
      attachEvents();
      updateDockExpandState();
      _fallbackTimer = setTimeout(() => {
        updateFloatState();
        _fallbackTimer = null;
      }, 500);
    }
  });
}
export function onIdeClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-ide');
  withViewTransition(() => {
    if (isActive) {
      destroyIde();
      saveConfig({ 'ide': false } as Partial<Config>);
    } else {
      ensureCss('ide', featureCss['ide']);
      htmlEl.classList.add('neo-ide');
      document.body.classList.add('neo-ide-body');
      saveConfig({ 'ide': true } as Partial<Config>);
      attachEvents();
      updateDockExpandAndFloat();
      _fallbackTimer = setTimeout(() => {
        updateDockExpandAndFloat();
        _fallbackTimer = null;
      }, 200);
    }
  });
}
export function destroyIde(): void {
  removeCss('ide');
  if (_fallbackTimer !== null) {
    clearTimeout(_fallbackTimer);
    _fallbackTimer = null;
  }
  detachEvents();
  document.body.classList.remove('neo-dockl-not-expand', 'neo-dockr-not-expand', 'neo-dockl-expand', 'neo-dockr-expand', 'neo-dockb-expand', 'neo-dockb-not-expand', 'neo-dockl-float', 'neo-dockl-not-float', 'neo-dockr-float', 'neo-dockr-not-float', 'neo-dockb-float', 'neo-dockb-not-float');
  document.body.classList.remove('neo-ide-body');
  document.documentElement?.classList.remove('neo-ide');
}