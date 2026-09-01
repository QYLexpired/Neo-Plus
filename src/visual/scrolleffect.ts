import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { withViewTransition } from '../modules/viewtransition';
import { createNeoLifecycleGuard } from '../main/lifecycle';
let neoFeatureActive = false;
function enableScrollEffect(): void {
  if (neoFeatureActive) return;
  ensureCss('visual-scrolleffect', featureCss['visual-scrolleffect']);
  document.documentElement.classList.add('neo-visual-scrolleffect');
  neoFeatureActive = true;
}
export function initScrollEffect(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    if (config['scroll-effect'] === true) {
      enableScrollEffect();
    }
  });
}
export function onScrollEffectClick(): void {
  const shouldEnable = !neoFeatureActive;
  withViewTransition(() => {
    if (shouldEnable) {
      enableScrollEffect();
      saveConfig({ 'scroll-effect': true } as Partial<Config>);
    } else {
      destroyScrollEffect();
      saveConfig({ 'scroll-effect': false } as Partial<Config>);
    }
  });
}
export function destroyScrollEffect(): void {
  neoFeatureActive = false;
  removeCss('visual-scrolleffect');
  document.documentElement?.classList.remove('neo-visual-scrolleffect');
}
