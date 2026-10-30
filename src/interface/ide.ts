import { isMobile } from '../modules/env';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { saveConfig, loadConfig } from '../main/data';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { fetchListener } from '../modules/fetchmonitor';
import { setHideToolbar } from './hidetoolbar';
import { destroyVerticalTabs } from './verticaltabs';
interface DebouncedTask {
  schedule: () => void;
  cancel: () => void;
}
function createDebouncedTask(cb: () => void, delay: number): DebouncedTask {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    schedule: () => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        cb();
        timer = null;
      }, delay);
    },
    cancel: () => {
      if (timer === null) return;
      clearTimeout(timer);
      timer = null;
    },
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
    if (child.classList.contains('dock__item--space')) {
      afterSpace = true;
      continue;
    }
    if (afterSpace && child.classList.contains('dock__items') && child.querySelector('.dock__item--active')) return true;
  }
  return false;
}
function updateDockExpandState(): void {
  const dockLeft = document.querySelector<HTMLElement>('#dockLeft');
  const dockRight = document.querySelector<HTMLElement>('#dockRight');
  const body = document.body;
  const hasL = dockLeft ? hasActiveItemBeforeSpace(dockLeft) : false;
  const hasR = dockRight ? hasActiveItemBeforeSpace(dockRight) : false;
  const dockbExpanded = (dockLeft ? hasActiveItemAfterSpace(dockLeft) : false)
    || (dockRight ? hasActiveItemAfterSpace(dockRight) : false);
  body.classList.toggle('neo-dockl-expand', hasL);
  body.classList.toggle('neo-dockl-not-expand', !hasL);
  body.classList.toggle('neo-dockr-expand', hasR);
  body.classList.toggle('neo-dockr-not-expand', !hasR);
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
const debouncedUpdate = createDebouncedTask(updateDockExpandAndFloat, 50);
const fetchMonitor = fetchListener();
fetchMonitor.onNotify('setUILayout', () => { debouncedUpdate.schedule(); });
function onInteractionUp(): void {
  debouncedUpdate.schedule();
}
function attachEvents(): void {
  document.addEventListener('mouseup', onInteractionUp, { passive: true });
  document.addEventListener('keyup', onInteractionUp, { passive: true });
}
function detachEvents(): void {
  document.removeEventListener('mouseup', onInteractionUp);
  document.removeEventListener('keyup', onInteractionUp);
}
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
let neoFeatureActive = false;
let configRevision = 0;
let actionRevision = 0;
function enableIde(): void {
  if (neoFeatureActive) return;
  ensureCss('interface-ide', featureCss['interface-ide']);
  document.documentElement.classList.add('neo-ide');
  document.body.classList.add('neo-ide-body');
  neoFeatureActive = true;
  attachEvents();
  fetchMonitor.attach();
  updateDockExpandAndFloat();
  fallbackTimer = setTimeout(() => {
    fallbackTimer = null;
    if (neoFeatureActive) updateDockExpandAndFloat();
  }, 500);
}
export function initIde(): Promise<void> | void {
  if (isMobile()) return;
  const revision = ++configRevision;
  const isCurrent = createNeoLifecycleGuard();
  return loadConfig().then((config) => {
    if (!isCurrent() || revision !== configRevision) return;
    if (config['ide'] === true) {
      if (neoFeatureActive) {
        updateDockExpandAndFloat();
      } else {
        enableIde();
      }
    }
  });
}
export function onIdeClick(): void {
  if (isMobile()) return;
  const isCurrent = createNeoLifecycleGuard();
  if (!isCurrent()) return;
  configRevision += 1;
  const revision = ++actionRevision;
  if (!neoFeatureActive) {
    setHideToolbar(true).then((applied) => {
      if (!applied || !isCurrent() || revision !== actionRevision) return;
      destroyVerticalTabs();
      enableIde();
      saveConfig({ 'ide': true, 'verticaltabs': false });
    });
  } else {
    destroyIde();
    saveConfig({ 'ide': false });
  }
}
export function destroyIde(): void {
  neoFeatureActive = false;
  configRevision += 1;
  actionRevision += 1;
  removeCss('interface-ide');
  if (fallbackTimer !== null) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
  debouncedUpdate.cancel();
  detachEvents();
  fetchMonitor.detach();
  document.body.classList.remove(
    'neo-dockl-not-expand',
    'neo-dockr-not-expand',
    'neo-dockl-expand',
    'neo-dockr-expand',
    'neo-dockb-expand',
    'neo-dockb-not-expand',
    'neo-dockl-float',
    'neo-dockl-not-float',
    'neo-dockr-float',
    'neo-dockr-not-float',
    'neo-dockb-float',
    'neo-dockb-not-float',
  );
  document.body.classList.remove('neo-ide-body');
  document.documentElement?.classList.remove('neo-ide');
}
