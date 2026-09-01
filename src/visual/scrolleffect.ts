import { saveConfig, loadConfig, type Config } from '../main/data';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { withViewTransition } from '../modules/viewtransition';
import { createNeoLifecycleGuard } from '../main/lifecycle';
export function initScrollEffect(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    if (config['scroll-effect'] === true) {
      ensureCss('visual-scrolleffect', featureCss['visual-scrolleffect']);
      document.documentElement.classList.add('neo-visual-scrolleffect');
    }
  });
}
export function onScrollEffectClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-visual-scrolleffect');
  withViewTransition(() => {
    if (isActive) {
      destroyScrollEffect();
      saveConfig({ 'scroll-effect': false } as Partial<Config>);
    } else {
      ensureCss('visual-scrolleffect', featureCss['visual-scrolleffect']);
      htmlEl.classList.add('neo-visual-scrolleffect');
      saveConfig({ 'scroll-effect': true } as Partial<Config>);
    }
  });
}
export function destroyScrollEffect(): void {
  removeCss('visual-scrolleffect');
  document.documentElement?.classList.remove('neo-visual-scrolleffect');
}
