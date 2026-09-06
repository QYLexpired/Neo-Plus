import { initEnv, destroyEnv } from '../modules/env';
import { getThemeMode } from '../modules/thememode';
import { initNeoIcons, destroyNeoIcons } from './icons';
import { initTopBarButton, destroyTopBarButton } from './topbar';
import { initShortcuts, destroyShortcuts } from './shortcut';
import { initStatusHidden, destroyStatusHidden } from '../modules/statushidden';
import { initHideScrollbar, destroyHideScrollbar } from '../modules/hidescrollbar';
import { initLayout, destroyLayout } from '../modules/layout';
import { initFetchMonitor, destroyFetchMonitor } from '../modules/fetchmonitor';
import { initPerformanceTuning, destroyPerformanceTuning } from '../modules/performancetuning';
import { initCardSearchList, destroyCardSearchList } from '../extension/cardsearchlist';
import { initSvgFilter, destroySvgFilter } from '../modules/svgfilter';
import { initPalette, destroyPalette } from '../palette/manager';
import { initTexture, destroyTexture } from '../texture/manager';
import { initColoredLists, destroyColoredLists } from '../appearance/coloredlists';
import { initColoredHeadings, destroyColoredHeadings } from '../appearance/coloredheadings';
import { initColorfulSelection, destroyColorfulSelection } from '../appearance/colorfulselection';
import { initSmoothCaret, destroySmoothCaret } from '../extension/smoothcaret';
import { initColoredFolders, destroyColoredFolders } from '../appearance/coloredfolders';
import { initMulticolumnSlashMenu, destroyMulticolumnSlashMenu } from '../extension/multicolumnslashmenu';
import { initFrostedGlass, destroyFrostedGlass } from '../interface/frostedglass';
import { initFluidCursor, destroyFluidCursor } from '../extension/fluidcursor';
import { initVerticalTabs, destroyVerticalTabs } from '../interface/verticaltabs';
import { initSuperFusion, destroySuperFusion } from '../interface/superfusion';
import { initIde, destroyIde } from '../interface/ide';
import { initSidebarMute, destroySidebarMute } from '../interface/sidebarmute';
import { initListBulletLine, destroyListBulletLine } from '../extension/listbulletline';
import { initFocusBlockIndicator, destroyFocusBlockIndicator } from '../extension/focusblockindicator';
import { initModeTransition, destroyModeTransition } from '../modules/modetransition';
import { ensureCss, removeCss } from '../modules/cssloader';
import { baseCss } from '../modules/csschunks';
import { initMenuSettings, destroyMenuSettings } from '../modules/menusettings';
import { beginNeoLifecycle, endNeoLifecycle } from './lifecycle';
interface RuntimeModule {
  init: () => void;
  destroy: () => void;
}
let runtimeActive = false;
function initBaseCss(): void {
  ensureCss('base', baseCss);
}
function destroyBaseCss(): void {
  removeCss('base');
}
function initNeoRootClass(): void {
  document.documentElement.classList.add('neo-enabled');
  syncNeoRootMode();
}
function destroyNeoRootClass(): void {
  document.documentElement.classList.remove('neo-enabled', 'neo-mode-light', 'neo-mode-dark');
}
export function syncNeoRootMode(): void {
  if (!runtimeActive) return;
  document.documentElement.classList.remove('neo-mode-light', 'neo-mode-dark');
  document.documentElement.classList.add(
    getThemeMode() === 'dark' ? 'neo-mode-dark' : 'neo-mode-light',
  );
}
const runtimeModules: readonly RuntimeModule[] = [
  { init: initBaseCss, destroy: destroyBaseCss },
  { init: initNeoRootClass, destroy: destroyNeoRootClass },
  { init: initEnv, destroy: destroyEnv },
  { init: initNeoIcons, destroy: destroyNeoIcons },
  { init: initMenuSettings, destroy: destroyMenuSettings },
  { init: initTopBarButton, destroy: destroyTopBarButton },
  { init: initShortcuts, destroy: destroyShortcuts },
  { init: initStatusHidden, destroy: destroyStatusHidden },
  { init: initHideScrollbar, destroy: destroyHideScrollbar },
  { init: initLayout, destroy: destroyLayout },
  { init: initFetchMonitor, destroy: destroyFetchMonitor },
  { init: initPerformanceTuning, destroy: destroyPerformanceTuning },
  { init: initCardSearchList, destroy: destroyCardSearchList },
  { init: initSvgFilter, destroy: destroySvgFilter },
  { init: initPalette, destroy: destroyPalette },
  { init: initTexture, destroy: destroyTexture },
  { init: initColoredLists, destroy: destroyColoredLists },
  { init: initColoredHeadings, destroy: destroyColoredHeadings },
  { init: initColorfulSelection, destroy: destroyColorfulSelection },
  { init: initSmoothCaret, destroy: destroySmoothCaret },
  { init: initColoredFolders, destroy: destroyColoredFolders },
  { init: initMulticolumnSlashMenu, destroy: destroyMulticolumnSlashMenu },
  { init: initFrostedGlass, destroy: destroyFrostedGlass },
  { init: initFluidCursor, destroy: destroyFluidCursor },
  { init: initVerticalTabs, destroy: destroyVerticalTabs },
  { init: initSuperFusion, destroy: destroySuperFusion },
  { init: initSidebarMute, destroy: destroySidebarMute },
  { init: initIde, destroy: destroyIde },
  { init: initListBulletLine, destroy: destroyListBulletLine },
  { init: initFocusBlockIndicator, destroy: destroyFocusBlockIndicator },
  { init: initModeTransition, destroy: destroyModeTransition },
];
export function startNeoRuntime(): void {
  if (runtimeActive) return;
  runtimeActive = true;
  beginNeoLifecycle();
  for (const module of runtimeModules) {
    try { module.init(); } catch {}
  }
}
export function stopNeoRuntime(): void {
  if (!runtimeActive) return;
  runtimeActive = false;
  endNeoLifecycle();
  for (let index = runtimeModules.length - 1; index >= 0; index--) {
    try { runtimeModules[index].destroy(); } catch {}
  }
}
