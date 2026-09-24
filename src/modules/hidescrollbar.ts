import { isMac } from '../modules/env';
const styleId = 'neo-hidescrollbar-style';
interface SavedScrollbarRule {
  sheet: CSSStyleSheet;
  index: number;
  cssText: string;
}
let savedScrollbarRules: SavedScrollbarRule[] = [];
function removeScrollbarStyles(): void {
  if (!isMac()) return;
  savedScrollbarRules = [];
  for (let i = 0; i < document.styleSheets.length; i++) {
    const ss = document.styleSheets[i];
    try {
      for (let j = 0; j < ss.cssRules.length; j++) {
        const rule = ss.cssRules[j] as CSSStyleRule;
        if (rule.selectorText && rule.selectorText.includes('::-webkit-scrollbar')) {
          if (rule.style.width || rule.style.height || rule.style.backgroundColor) {
            savedScrollbarRules.push({ sheet: ss, index: j, cssText: rule.cssText });
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
    style.textContent = `body{scrollbar-width:thin!important;scrollbar-color:var(--b3-scroll-color) transparent !important}`;
    document.head.appendChild(style);
  }
}
function restoreScrollbarStyles(): void {
  const activeSheets = new Set(Array.from(document.styleSheets));
  for (let i = savedScrollbarRules.length - 1; i >= 0; i--) {
    const saved = savedScrollbarRules[i];
    if (!activeSheets.has(saved.sheet)) continue;
    try {
      const index = Math.min(saved.index, saved.sheet.cssRules.length);
      saved.sheet.insertRule(saved.cssText, index);
    } catch {}
  }
  savedScrollbarRules = [];
}
export function initHideScrollbar(): void {
  removeScrollbarStyles();
}
export function destroyHideScrollbar(): void {
  const el = document.getElementById(styleId);
  if (el) el.remove();
  restoreScrollbarStyles();
}
