import { isMac } from '../modules/env';
const styleId = 'neo-hide-scrollbar-style';
let _savedScrollbarRules: { sheetIndex: number; cssText: string }[] = [];
function removeScrollbarStyles(): void {
  if (!isMac()) return;
  _savedScrollbarRules = [];
  for (let i = 0; i < document.styleSheets.length; i++) {
    const ss = document.styleSheets[i];
    try {
      for (let j = 0; j < ss.cssRules.length; j++) {
        const rule = ss.cssRules[j] as CSSStyleRule;
        if (rule.selectorText && rule.selectorText.includes('::-webkit-scrollbar')) {
          if (rule.style.width || rule.style.height || rule.style.backgroundColor) {
            _savedScrollbarRules.push({ sheetIndex: i, cssText: rule.cssText });
            ss.deleteRule(j);
            j--;
          }
        }
      }
    } catch {}
  }
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `body{scrollbar-width:thin!important;scrollbar-color:var(--b3-scroll-color-hover) var(--b3-theme-background-light)!important}`;
    document.head.appendChild(style);
  }
}
function restoreScrollbarStyles(): void {
  for (const saved of _savedScrollbarRules) {
    const ss = document.styleSheets[saved.sheetIndex];
    if (ss) {
      try {
        ss.insertRule(saved.cssText, ss.cssRules.length);
      } catch {}
    }
  }
  _savedScrollbarRules = [];
}
export function initHideScrollbar(): void {
  removeScrollbarStyles();
}
export function destroyHideScrollbar(): void {
  const el = document.getElementById(styleId);
  if (el) el.remove();
  restoreScrollbarStyles();
}
