import { initEnv, destroyEnv } from '../modules/env';
import { getCurrentThemeMode } from '../modules/thememode';
import { initNeoIcons, destroyNeoIcons } from './icons';
import { initTopBarButton, destroyTopBarButton } from './topbar';
import { initShortcuts, destroyShortcuts } from './shortcut';
import { initStatusHidden, destroyStatusHidden } from '../modules/statushidden';
import { initHideScrollbar, destroyHideScrollbar } from '../modules/hidescrollbar';
import { initLayout, destroyLayout } from '../modules/layout';
import { initFetchMonitor, destroyFetchMonitor } from '../modules/fetchmonitor';
import { initPerformanceTuning, destroyPerformanceTuning } from '../modules/performancetuning';
import { initCardSearchList, destroyCardSearchList } from '../visual/cardsearchlist';
import { initSvgFilter, destroySvgFilter } from '../modules/svgfilter';
import { initPalette, destroyPalette } from '../palette/manager';
import { initTexture, destroyTexture } from '../texture/manager';
import { initColoredLists, destroyColoredLists } from '../element/coloredlists';
import { initColoredHeadings, destroyColoredHeadings } from '../element/coloredheadings';
import { initColorfulSelection, destroyColorfulSelection } from '../element/colorfulselection';
import { initSmoothCaret, destroySmoothCaret } from '../visual/smoothcaret';
import { initColoredFolders, destroyColoredFolders } from '../visual/coloredfolders';
import { initMulticolumnSlashMenu, destroyMulticolumnSlashMenu } from '../visual/multicolumnslashmenu';
import { initFrostedGlass, destroyFrostedGlass } from '../visual/frostedglass';
import { initScrollEffect, destroyScrollEffect } from '../visual/scrolleffect';
import { initFluidCursor, destroyFluidCursor } from '../visual/fluidcursor';
import { initVerticalTabs, destroyVerticalTabs } from '../verticaltabs/verticaltabs';
import { initSuperFusion, destroySuperFusion } from '../superfusion/superfusion';
import { initIde, destroyIde } from '../ide/ide';
import { initSidebarMute, destroySidebarMute } from '../sidebarmute/sidebarmute';
import { initListBulletLine, destroyListBulletLine } from '../extension/listbulletline';
import { initFocusBlockIndicator, destroyFocusBlockIndicator } from '../extension/focusblockindicator';
import { initImmersiveMode, destroyImmersiveMode } from '../extension/immersivemode';
import { initPinnedToolbar, destroyPinnedToolbar } from '../extension/pinnedtoolbar';
import { initSideMemo, destroySideMemo } from '../extension/sidememo';
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
    getCurrentThemeMode() === 'dark' ? 'neo-mode-dark' : 'neo-mode-light',
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
  { init: initScrollEffect, destroy: destroyScrollEffect },
  { init: initFluidCursor, destroy: destroyFluidCursor },
  { init: initVerticalTabs, destroy: destroyVerticalTabs },
  { init: initSuperFusion, destroy: destroySuperFusion },
  { init: initSidebarMute, destroy: destroySidebarMute },
  { init: initIde, destroy: destroyIde },
  { init: initListBulletLine, destroy: destroyListBulletLine },
  { init: initFocusBlockIndicator, destroy: destroyFocusBlockIndicator },
  { init: initImmersiveMode, destroy: destroyImmersiveMode },
  { init: initPinnedToolbar, destroy: destroyPinnedToolbar },
  { init: initSideMemo, destroy: destroySideMemo },
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
