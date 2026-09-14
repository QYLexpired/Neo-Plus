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
let handler: ((event: MouseEvent) => void) | null = null;
let changeHandler: ((event: Event) => void) | null = null;
export function initModeTransition(): void {
  handler = handleModeSwitch;
  document.addEventListener('mouseup', handler);
  changeHandler = handleModeChange;
  document.addEventListener('change', changeHandler);
}
export function destroyModeTransition(): void {
  if (handler) {
    document.removeEventListener('mouseup', handler);
    handler = null;
  }
  if (changeHandler) {
    document.removeEventListener('change', changeHandler);
    changeHandler = null;
  }
}
