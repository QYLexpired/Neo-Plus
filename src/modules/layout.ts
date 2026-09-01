import { fetchListener } from './fetchmonitor';
const _fetchListener = fetchListener();
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
  document.querySelectorAll('.layout__dockl, .layout__dockr').forEach((dock) => {
    const visibleChildren = dock.querySelectorAll(':scope > .neo-haswnd:not(.fn__none)');
    visibleChildren.forEach((el, i) => {
      if (i === 0) {
        el.classList.remove('neo-haswnd-notfirst-visible');
      } else if (!el.classList.contains('neo-haswnd-notfirst-visible')) {
        el.classList.add('neo-haswnd-notfirst-visible');
      }
    });
    const visibleSet = new Set(visibleChildren);
    dock.querySelectorAll(':scope > .neo-haswnd-notfirst-visible').forEach((el) => {
      if (!visibleSet.has(el)) {
        el.classList.remove('neo-haswnd-notfirst-visible');
      }
    });
  });
}
_fetchListener.onNotify('setUILayout', () => { updateHasWndClass(); });
let _fallbackTimer: ReturnType<typeof setTimeout> | null = null;
export function initLayout(): void {
  _fetchListener.attach();
  updateHasWndClass();
  _fallbackTimer = setTimeout(() => {
    updateHasWndClass();
    _fallbackTimer = null;
  }, 200);
}
export function destroyLayout(): void {
  if (_fallbackTimer !== null) {
    clearTimeout(_fallbackTimer);
    _fallbackTimer = null;
  }
  _fetchListener.detach();
  document.querySelectorAll('.neo-haswnd, .neo-haswnd-notfirst-visible').forEach((el) => {
    el.classList.remove('neo-haswnd', 'neo-haswnd-notfirst-visible');
  });
}
