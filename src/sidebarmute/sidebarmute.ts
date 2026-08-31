import { isMobile } from '../modules/env';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { saveConfig, loadConfig, type Config } from '../main/data';
import { withViewTransition } from '../modules/viewtransition';
export function initSidebarMute(): void {
  if (isMobile()) return;
  loadConfig().then((config) => {
    if (config['sidebar-mute'] === true) {
      ensureCss('sidebarmute', featureCss['sidebarmute']);
      document.documentElement.classList.add('neo-sidebar-mute');
    }
  });
}
export function onSidebarMuteClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-sidebar-mute');
  withViewTransition(() => {
    if (isActive) {
      destroySidebarMute();
      saveConfig({ 'sidebar-mute': false } as Partial<Config>);
    } else {
      ensureCss('sidebarmute', featureCss['sidebarmute']);
      htmlEl.classList.add('neo-sidebar-mute');
      saveConfig({ 'sidebar-mute': true } as Partial<Config>);
    }
  });
}
export function destroySidebarMute(): void {
  removeCss('sidebarmute');
  document.documentElement?.classList.remove('neo-sidebar-mute');
}
