import { fetchListener } from './fetchmonitor';
const fetchMonitor = fetchListener();
function updateHasWndClass(): void {
  const currentHaswnd = new Set(document.querySelectorAll('.neo-haswnd'));
  const shouldHaswnd = new Set<Element>();
  document.querySelectorAll('[data-type="wnd"]').forEach((wnd) => {
    const parent = wnd.parentElement;
    if (parent) {
      shouldHaswnd.add(parent);
    }
  });
  currentHaswnd.forEach((el) => {
    if (!shouldHaswnd.has(el)) {
      el.classList.remove('neo-haswnd');
    }
  });
  shouldHaswnd.forEach((el) => {
    if (!currentHaswnd.has(el)) {
      el.classList.add('neo-haswnd');
    }
  });
}
fetchMonitor.onNotify('setUILayout', () => { updateHasWndClass(); });
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
export function initLayout(): void {
  fetchMonitor.attach();
  updateHasWndClass();
  fallbackTimer = setTimeout(() => {
    updateHasWndClass();
    fallbackTimer = null;
  }, 200);
}
export function destroyLayout(): void {
  if (fallbackTimer !== null) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
  fetchMonitor.detach();
  document.querySelectorAll('.neo-haswnd').forEach((el) => {
    el.classList.remove('neo-haswnd');
  });
}
