import { getFrontend, platformUtils } from 'siyuan';
import { createNeoLifecycleGuard } from '../main/lifecycle';
const densityAttribute = 'data-ui-density';
const compactModeKey = 'local-compact-mode';
let active = false;
let compactModeSuppressed = false;
let densityObserver: MutationObserver | null = null;
function refreshLayout(): void {
  const siyuan = (window as Window & { siyuan?: { isReady?: boolean } }).siyuan;
  if (siyuan?.isReady === true) window.dispatchEvent(new Event('resize'));
}
function applyDisableCompactMode(): void {
  const root = document.documentElement;
  if (root.getAttribute(densityAttribute) !== 'compact') return;
  compactModeSuppressed = true;
  root.removeAttribute(densityAttribute);
  densityObserver?.takeRecords();
  refreshLayout();
}
export function initDisableCompactMode(): void {
  if (active || !['desktop', 'desktop-window', 'browser-desktop'].includes(getFrontend())) return;
  active = true;
  const isCurrent = createNeoLifecycleGuard();
  densityObserver = new MutationObserver(() => {
    if (!active || !isCurrent()) return;
    applyDisableCompactMode();
  });
  densityObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [densityAttribute],
  });
  applyDisableCompactMode();
}
export function destroyDisableCompactMode(): void {
  if (!active) return;
  active = false;
  densityObserver?.disconnect();
  densityObserver = null;
  if (!compactModeSuppressed) return;
  compactModeSuppressed = false;
  const root = document.documentElement;
  const enabled = platformUtils.getStorageVal(compactModeKey) === true;
  if ((root.getAttribute(densityAttribute) === 'compact') === enabled) return;
  if (enabled) {
    root.setAttribute(densityAttribute, 'compact');
  } else {
    root.removeAttribute(densityAttribute);
  }
  refreshLayout();
}
