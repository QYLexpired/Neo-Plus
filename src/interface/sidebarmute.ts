import { isMobile } from '../modules/env';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { saveConfig, loadConfig, type Config } from '../main/data';
import { withViewTransition } from '../modules/viewtransition';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let neoFeatureActive = false;
function enableSidebarMute(): void {
  if (neoFeatureActive) return;
  ensureCss('interface-sidebarmute', featureCss['interface-sidebarmute']);
  document.documentElement.classList.add('neo-sidebarmute');
  neoFeatureActive = true;
}
export function initSidebarMute(): void {
  if (isMobile()) return;
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    if (config['sidebarmute'] === true) {
      enableSidebarMute();
    }
  });
}
export function onSidebarMuteClick(): void {
  if (isMobile()) return;
  const shouldEnable = !neoFeatureActive;
  withViewTransition(() => {
    if (shouldEnable) {
      enableSidebarMute();
      saveConfig({ 'sidebarmute': true } as Partial<Config>);
    } else {
      destroySidebarMute();
      saveConfig({ 'sidebarmute': false } as Partial<Config>);
    }
  });
}
export function destroySidebarMute(): void {
  neoFeatureActive = false;
  removeCss('interface-sidebarmute');
  document.documentElement?.classList.remove('neo-sidebarmute');
}
