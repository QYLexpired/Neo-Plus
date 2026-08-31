type SettingsAction = () => void;
const settingsActions = new Map<string, SettingsAction>();
let settingsClickHandler: ((event: MouseEvent) => void) | null = null;
function handleSettingsClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest('[data-neo-settings-action]');
  if (!button) return;
  const action = button.getAttribute('data-neo-settings-action');
  if (!action) return;
  const handler = settingsActions.get(action);
  if (!handler) return;
  event.stopPropagation();
  handler();
}
export function createSettingsMenuLabel(
  action: string,
  label: string,
  settingsLabel: string,
  handler: SettingsAction,
): string {
  settingsActions.set(action, handler);
  return `<span class="fn__flex fn__pointer">
    <span>${label}</span>
    <span class="fn__space fn__flex-1 neo-menu-item-second-icon-space"></span>
    <svg class="b3-menu__icon neo-menu-item-second-icon ariaLabel" aria-label="${settingsLabel}" data-neo-settings-action="${action}"><use xlink:href="#iconSettings"></use></svg>
  </span>`;
}
export function initMenuSettings(): void {
  if (settingsClickHandler) return;
  settingsClickHandler = handleSettingsClick;
  document.addEventListener('click', settingsClickHandler, true);
}
export function destroyMenuSettings(): void {
  if (settingsClickHandler) {
    document.removeEventListener('click', settingsClickHandler, true);
    settingsClickHandler = null;
  }
  settingsActions.clear();
}
