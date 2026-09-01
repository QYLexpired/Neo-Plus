import { getPlugin } from './context';
import { buildMenu } from './menu';
let topBarButton: HTMLElement | null = null;
export function initTopBarButton(): HTMLElement | null {
  const plugin = getPlugin();
  if (!plugin) return null;
  const button = plugin.addTopBar({
    icon: 'iconNeo',
    title: 'Neo+',
    position: 'right',
    callback: openNeoMenu,
  });
  topBarButton = button;
  return button;
}
export function openNeoMenu(): void {
  let rect = topBarButton?.getBoundingClientRect();
  if (!rect || rect.width === 0) {
    rect = document.querySelector('#barMore')?.getBoundingClientRect();
  }
  if (!rect || rect.width === 0) {
    rect = document.querySelector('#barPlugins')?.getBoundingClientRect();
  }
  if (!rect) return;
  const menu = buildMenu();
  menu.open({ x: rect.right, y: rect.bottom, isLeft: true });
}
export function destroyTopBarButton(): void {
  if (topBarButton) {
    topBarButton.remove();
    topBarButton = null;
  }
}
