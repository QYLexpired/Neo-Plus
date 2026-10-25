import { Dialog as SiyuanDialog } from 'siyuan';
import { createNeoLifecycleGuard } from '../main/lifecycle';
type DialogScope = 'palette' | 'texture';
type DialogOptions = ConstructorParameters<typeof SiyuanDialog>[0] & { scope?: DialogScope };
const dialogs = new Map<Dialog, DialogScope | undefined>();
const scopeRevisions: Record<DialogScope, number> = { palette: 0, texture: 0 };
export function createDialogScopeGuard(scope: DialogScope): () => boolean {
  const isCurrent = createNeoLifecycleGuard();
  const revision = scopeRevisions[scope];
  return () => isCurrent() && revision === scopeRevisions[scope];
}
export function closeNeoDialogs(scope?: DialogScope): void {
  if (scope) scopeRevisions[scope] += 1;
  else {
    scopeRevisions.palette += 1;
    scopeRevisions.texture += 1;
  }
  for (const [dialog, owner] of Array.from(dialogs).reverse()) {
    if (!scope || owner === scope) {
      try { dialog.destroyImmediately(); } catch {}
    }
  }
}
export class Dialog extends SiyuanDialog {
  private closing = false;
  constructor(options: DialogOptions) {
    const { scope, ...dialogOptions } = options;
    let dialog: Dialog | null = null;
    const previousFocus = document.activeElement;
    super({
      ...dialogOptions,
      destroyCallback: () => {
        if (dialog) dialogs.delete(dialog);
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
    dialog = this;
    dialogs.set(this, scope);
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
    this.destroyImmediately();
  }
  destroyImmediately(): void {
    if (this.closing) return;
    this.closing = true;
    dialogs.delete(this);
    super.destroy();
  }
}
