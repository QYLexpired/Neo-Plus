import { fetchListener } from './fetchmonitor';
const statusSelector = '#status';
const targetSelector =
  '.layout__wnd--active > .layout-tab-container > .fn__flex-1:not(.fn__none):not(.protyle)';
let statusObserver: MutationObserver | null = null;
const _fetchListener = fetchListener();
_fetchListener.onNotify('setUILayout', () => { checkAndToggleStatus(); });
function checkAndToggleStatus(): void {
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
  if (document.querySelector(statusSelector)) {
    _fetchListener.attach();
    checkAndToggleStatus();
    return;
  }
  statusObserver = new MutationObserver((_mutations, observer) => {
    if (document.querySelector(statusSelector)) {
      observer.disconnect();
      statusObserver = null;
      _fetchListener.attach();
      checkAndToggleStatus();
    }
  });
  statusObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
export function initStatusHidden(): void {
  waitForStatusEl();
}
export function destroyStatusHidden(): void {
  _fetchListener.detach();
  if (statusObserver) {
    statusObserver.disconnect();
    statusObserver = null;
  }
  const statusEl = document.querySelector<HTMLElement>(statusSelector);
  if (statusEl) {
    statusEl.classList.remove('neo-status-hidden');
  }
}
