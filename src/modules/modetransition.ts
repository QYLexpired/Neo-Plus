import { createNeoLifecycleGuard } from '../main/lifecycle';
let active = false;
const pendingTransitions = new Map<HTMLStyleElement, ViewTransition | null>();
async function startTransition(): Promise<void> {
  if (!active || !document.startViewTransition) return;
  const isCurrent = createNeoLifecycleGuard();
  const style = document.createElement('style');
  style.dataset.neoCss = 'modules-modetransition';
  style.textContent = `
        ::view-transition-old(root),
        ::view-transition-new(root) {
            animation-duration: 0.6s;
        }
    `;
  pendingTransitions.set(style, null);
  try {
    document.head.appendChild(style);
    const transition = document.startViewTransition();
    pendingTransitions.set(style, transition);
    transition.ready.catch(() => {});
    transition.updateCallbackDone.catch(() => {});
    await transition.finished;
    if (!active || !isCurrent()) return;
  } catch {} finally {
    pendingTransitions.delete(style);
    style.remove();
  }
}
function handleModeSwitch(event: MouseEvent): void {
  const menuItem = (event.target as HTMLElement).closest('.b3-menu__item');
  const menuId = menuItem?.getAttribute('data-id');
  if (!menuId) return;
  if (menuId === 'themeLight' || menuId === 'themeDark' || menuId === 'themeOS') {
    startTransition();
  }
}
function handleModeChange(event: Event): void {
  const select = event.target as HTMLSelectElement;
  if (!select.matches('[id="appearance.__themeMode"]')) return;
  startTransition();
}
let handler: ((event: MouseEvent) => void) | null = null;
let changeHandler: ((event: Event) => void) | null = null;
export function initModeTransition(): void {
  if (active) return;
  active = true;
  handler = handleModeSwitch;
  document.addEventListener('mouseup', handler);
  changeHandler = handleModeChange;
  document.addEventListener('change', changeHandler);
}
export function destroyModeTransition(): void {
  active = false;
  for (const [style, transition] of pendingTransitions) {
    try { transition?.skipTransition(); } catch {}
    style.remove();
  }
  pendingTransitions.clear();
  if (handler) {
    document.removeEventListener('mouseup', handler);
    handler = null;
  }
  if (changeHandler) {
    document.removeEventListener('change', changeHandler);
    changeHandler = null;
  }
}
