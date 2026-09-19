export function withViewTransition(callback: () => void): void {
  if (!document.startViewTransition) {
    callback();
    return;
  }
  const transition = document.startViewTransition(callback);
  transition.ready.catch(() => {});
  transition.updateCallbackDone.catch(() => {});
  transition.finished.catch(() => {});
}
