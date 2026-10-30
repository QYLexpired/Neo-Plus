import { fetchSyncPost } from 'siyuan';
import { triggerFetchEvent } from '../modules/fetchmonitor';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { isMobile } from '../modules/env';
let changeRevision = 0;
let changeQueue: Promise<void> = Promise.resolve();
function waitForToolbarState(hideToolbar: boolean): { result: Promise<boolean>; cancel: () => void } {
  let cancel = () => {};
  const result = new Promise<boolean>((resolve) => {
    if (document.body.classList.contains('body--toolbar-hide') === hideToolbar) {
      resolve(true);
      return;
    }
    const finish = (applied: boolean) => {
      observer.disconnect();
      clearTimeout(timer);
      resolve(applied);
    };
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains('body--toolbar-hide') === hideToolbar) finish(true);
    });
    const timer = setTimeout(() => finish(false), 5000);
    cancel = () => finish(false);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  });
  return { result, cancel };
}
export function setHideToolbar(hideToolbar: boolean): Promise<boolean> {
  if (isMobile()) return Promise.resolve(false);
  const lifecycleCurrent = createNeoLifecycleGuard();
  const revision = ++changeRevision;
  const isCurrent = () => lifecycleCurrent() && revision === changeRevision;
  return new Promise<boolean>((resolve) => {
    changeQueue = changeQueue.then(async () => {
      if (!isCurrent()) {
        resolve(false);
        return;
      }
      const appearance = (window as any).siyuan?.config?.appearance;
      if (!appearance) {
        resolve(false);
        return;
      }
      const state = waitForToolbarState(hideToolbar);
      state.result.then((applied) => {
        const appliedCurrent = applied && isCurrent();
        if (appliedCurrent) triggerFetchEvent('setUILayout');
        resolve(appliedCurrent);
        if (appliedCurrent) {
          queueMicrotask(() => window.dispatchEvent(new CustomEvent('siyuan-topbar-change')));
        }
      });
      if (appearance.hideToolbar !== hideToolbar) {
        try {
          const response = await fetchSyncPost('/api/setting/setAppearance', { ...appearance, hideToolbar });
          if (response.code !== 0) state.cancel();
        } catch {
          state.cancel();
        }
      }
      await state.result;
    }).catch(() => { resolve(false); });
  });
}
export function onHideToolbarClick(): void {
  const appearance = (window as any).siyuan?.config?.appearance;
  if (!appearance) return;
  void setHideToolbar(!appearance.hideToolbar);
}
