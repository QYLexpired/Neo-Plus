async function startTransition(): Promise<void> {
  if (!document.startViewTransition) return;
  const style = document.createElement('style');
  style.textContent = `
        ::view-transition-old(root),
        ::view-transition-new(root) {
            animation-duration: 0.6s;
        }
    `;
  document.head.appendChild(style);
  const transition = document.startViewTransition();
  try { await transition.finished; } catch {}
  style.remove();
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
let _handler: ((event: MouseEvent) => void) | null = null;
let _changeHandler: ((event: Event) => void) | null = null;
export function initModeTransition(): void {
  _handler = handleModeSwitch;
  document.addEventListener('mouseup', _handler);
  _changeHandler = handleModeChange;
  document.addEventListener('change', _changeHandler);
}
export function destroyModeTransition(): void {
  if (_handler) {
    document.removeEventListener('mouseup', _handler);
    _handler = null;
  }
  if (_changeHandler) {
    document.removeEventListener('change', _changeHandler);
    _changeHandler = null;
  }
}