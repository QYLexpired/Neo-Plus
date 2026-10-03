import { isMac, isMobile } from '../modules/env';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { createChunkedScanRunner } from './performancetuning';
const styleId = 'neo-hidescrollbar-style';
interface SavedScrollbarRule {
  sheet: CSSStyleSheet;
  index: number;
  cssText: string;
}
let savedScrollbarRules: SavedScrollbarRule[] = [];
let active = false;
let rescanTimer: ReturnType<typeof setTimeout> | null = null;
let scanPending = false;
function* removeScrollbarStyles(): Generator<void> {
  const activeSheets = new Set(Array.from(document.styleSheets));
  savedScrollbarRules = savedScrollbarRules.filter((saved) => activeSheets.has(saved.sheet));
  for (const ss of activeSheets) {
    yield;
    const ownerNode = ss.ownerNode as HTMLElement | null;
    if (ownerNode?.dataset.neoCss) continue;
    try {
      for (const rule of Array.from(ss.cssRules) as CSSStyleRule[]) {
        if (rule.selectorText && rule.selectorText.includes('::-webkit-scrollbar')) {
          if (rule.style.width || rule.style.height || rule.style.backgroundColor) {
            const index = Array.prototype.indexOf.call(ss.cssRules, rule);
            if (index !== -1) {
              savedScrollbarRules.push({ sheet: ss, index, cssText: rule.cssText });
              ss.deleteRule(index);
            }
          }
        }
        yield;
      }
    } catch {}
  }
}
function ensureScrollbarStyle(): void {
  const existingStyle = document.getElementById(styleId);
  const style = existingStyle ?? document.createElement('style');
  style.id = styleId;
  style.dataset.neoCss = 'modules-hidescrollbar';
  style.textContent = isMac()
    ? 'body{scrollbar-width:thin!important;scrollbar-color:var(--b3-scroll-color) transparent !important}'
    : `::-webkit-scrollbar {
  background-color: transparent !important;
  width: 12px !important;
  height: 12px !important;
}
::-webkit-scrollbar-thumb {
  border: 2px solid transparent !important;
  border-radius: 8px !important;
  background-clip: padding-box !important;
  background-color: var(--b3-scroll-color) !important;
}
::-webkit-scrollbar-thumb:hover {
  border: 2px solid transparent !important;
  background-color: var(--b3-scroll-color-hover) !important;
}`;
  if (!existingStyle) document.head.appendChild(style);
}
const scanRunner = createChunkedScanRunner(
  () => {
    if (!scanPending) return null;
    scanPending = false;
    return removeScrollbarStyles();
  },
  () => {
    if (scanPending) scanRunner.schedule();
  },
);
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
  if (isMobile() || active) return;
  active = true;
  savedScrollbarRules = [];
  ensureScrollbarStyle();
  scanRunner.start();
  scanPending = true;
  scanRunner.runNow();
  const isCurrent = createNeoLifecycleGuard();
  rescanTimer = setTimeout(() => {
    if (!active || !isCurrent()) return;
    rescanTimer = null;
    scanPending = true;
    if (!scanRunner.isRunning()) scanRunner.runNow();
  }, 2000);
}
export function destroyHideScrollbar(): void {
  active = false;
  if (rescanTimer !== null) {
    clearTimeout(rescanTimer);
    rescanTimer = null;
  }
  scanRunner.stop();
  scanPending = false;
  const el = document.getElementById(styleId);
  if (el) el.remove();
  restoreScrollbarStyles();
}
