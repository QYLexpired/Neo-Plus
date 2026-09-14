import { Dialog as SiyuanDialog } from 'siyuan';
import { createNeoLifecycleGuard } from '../main/lifecycle';
export class Dialog extends SiyuanDialog {
  private closing = false;
  constructor(options: ConstructorParameters<typeof SiyuanDialog>[0]) {
    const previousFocus = document.activeElement;
    super({
      ...options,
      destroyCallback: () => {
        options.destroyCallback?.();
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected
          && (!document.activeElement || document.activeElement === document.body)) {
          previousFocus.focus({ preventScroll: true });
          if (!document.activeElement || document.activeElement === document.body) {
            previousFocus.closest('.b3-dialog')?.parentElement?.focus({ preventScroll: true });
          }
        }
      },
    });
    const isCurrent = createNeoLifecycleGuard();
    this.element.tabIndex = -1;
    this.element.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.isComposing || event.key !== 'Enter'
        || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const target = event.target;
      if (target instanceof Element && target.closest('textarea, select, button, a[href], summary, [role="button"], [role="link"], [role="combobox"], [role="listbox"], [role="slider"], [role="spinbutton"], [role="checkbox"], [role="radio"], [role="switch"]')) return;
      if (target instanceof HTMLElement && target.isContentEditable) return;
      if (target instanceof HTMLInputElement
        && (target.list || !['text', 'search', 'email', 'url', 'tel', 'password', 'number'].includes(target.type))) return;
      event.preventDefault();
      event.stopPropagation();
      if (!isCurrent() || this.closing || event.repeat) return;
      const container = this.element.querySelector<HTMLElement>('.b3-dialog')!;
      if (Array.from(document.querySelectorAll<HTMLElement>('.b3-dialog')).some(other =>
        other.getClientRects().length > 0 && Number(other.style.zIndex) > Number(container.style.zIndex))) return;
      const button = Array.from(this.element.querySelectorAll<HTMLButtonElement>('.b3-dialog__action button'))
        .filter(item => item.getClientRects().length > 0).pop();
      if (button && !button.disabled) button.click();
    });
    this.element.focus({ preventScroll: true });
  }
  override destroy(): void {
    if (this.closing) return;
    this.closing = true;
    super.destroy();
  }
}
