import { fetchListener } from './fetchmonitor';
import { createNeoLifecycleGuard } from '../main/lifecycle';
const statusSelector = '#status';
const targetSelector =
  '.layout__wnd--active > .layout-tab-container > .fn__flex-1:not(.fn__none):not(.protyle)';
const retryInterval = 200;
const maxAttempts = 10;
let active = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const fetchMonitor = fetchListener();
fetchMonitor.onNotify('setUILayout', () => { checkAndToggleStatus(); });
function checkAndToggleStatus(): void {
  if (!active) return;
  const target = document.querySelector<HTMLElement>(targetSelector);
  const statusEl = document.querySelector<HTMLElement>(statusSelector);
  if (!statusEl) return;
  if (target) {
    statusEl.classList.add('neo-status-hidden');
  } else {
    statusEl.classList.remove('neo-status-hidden');
  }
}
function waitForStatusEl(): void {
  const isCurrent = createNeoLifecycleGuard();
  let attempts = 0;
  function tryFindStatusEl(): void {
    if (!active || !isCurrent()) return;
    retryTimer = null;
    attempts++;
    if (document.querySelector(statusSelector)) {
      fetchMonitor.attach();
      checkAndToggleStatus();
      return;
    }
    if (attempts < maxAttempts) {
      retryTimer = setTimeout(tryFindStatusEl, retryInterval);
    }
  }
  tryFindStatusEl();
}
export function initStatusHidden(): void {
  if (active) return;
  active = true;
  waitForStatusEl();
}
export function destroyStatusHidden(): void {
  active = false;
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  fetchMonitor.detach();
  const statusEl = document.querySelector<HTMLElement>(statusSelector);
  if (statusEl) {
    statusEl.classList.remove('neo-status-hidden');
  }
}
