import { fetchPost } from 'siyuan';
import { triggerFetchEvent } from './fetchmonitor';
export function onHideToolbarClick(): void {
  const appearance = (window as any).siyuan?.config?.appearance;
  if (!appearance) return;
  fetchPost('/api/setting/setAppearance', {
    ...appearance,
    hideToolbar: !appearance.hideToolbar,
  }, () => {
    triggerFetchEvent('setUILayout');
  });
}
