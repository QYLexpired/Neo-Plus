import { Plugin } from 'siyuan';
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
function isNeoTheme(): boolean {
  if (getCurrentThemeMode() === 'dark') {
    return document.documentElement.getAttribute('data-dark-theme') === 'Neo';
  }
  return document.documentElement.getAttribute('data-light-theme') === 'Neo';
}
function initNeoRootClass(): void {
  document.documentElement.classList.add('neo-enabled');
  document.documentElement.classList.remove('neo-mode-light', 'neo-mode-dark');
  if (getCurrentThemeMode() === 'dark') {
    document.documentElement.classList.add('neo-mode-dark');
  } else {
    document.documentElement.classList.add('neo-mode-light');
  }
}
function destroyNeoRootClass(): void {
  document.documentElement.classList.remove('neo-enabled');
  document.documentElement.classList.remove('neo-mode-light', 'neo-mode-dark');
}
function initBaseCss(): void {
  ensureCss('base', baseCss);
}
function destroyBaseCss(): void {
  removeCss('base');
}
let _plugin: Plugin | null = null;
export function getPlugin(): Plugin | null {
  return _plugin;
}
export class NeoPlusController {
  private themeObserver: MutationObserver | null = null;
  private isNeoTheme: boolean = false;
  constructor(plugin: Plugin) {
    _plugin = plugin;
  }
  init(): void {
    this.handleThemeChange();
    this.themeObserver = new MutationObserver(() => {
      this.handleThemeChange();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme-mode', 'data-light-theme', 'data-dark-theme'],
    });
  }
  destroy(): void {
    this.themeObserver?.disconnect();
    this.themeObserver = null;
    if (this.isNeoTheme) {
      this.destroyNeoPlus();
    }
    this.isNeoTheme = false;
    _plugin = null;
  }
  private handleThemeChange(): void {
    const isNowNeo = isNeoTheme();
    if (isNowNeo && !this.isNeoTheme) {
      this.initNeoPlus();
    } else if (!isNowNeo && this.isNeoTheme) {
      this.destroyNeoPlus();
    } else if (isNowNeo && this.isNeoTheme) {
      document.documentElement.classList.remove('neo-mode-light', 'neo-mode-dark');
      if (getCurrentThemeMode() === 'dark') {
        document.documentElement.classList.add('neo-mode-dark');
      } else {
        document.documentElement.classList.add('neo-mode-light');
      }
    }
    this.isNeoTheme = isNowNeo;
  }
  private initNeoPlus(): void {
    beginNeoLifecycle();
    const modules: Array<() => void> = [
      initBaseCss,
      initNeoRootClass,
      initEnv,
      initNeoIcons,
      initMenuSettings,
      initTopBarButton,
      initShortcuts,
      initStatusHidden,
      initHideScrollbar,
      initLayout,
      initFetchMonitor,
      initPerformanceTuning,
      initCardSearchList,
      initSvgFilter,
      initPalette,
      initTexture,
      initColoredLists,
      initColoredHeadings,
      initColorfulSelection,
      initSmoothCaret,
      initColoredFolders,
      initMulticolumnSlashMenu,
      initFrostedGlass,
      initScrollEffect,
      initFluidCursor,
      initVerticalTabs,
      initSuperFusion,
      initSidebarMute,
      initIde,
      initListBulletLine,
      initFocusBlockIndicator,
      initImmersiveMode,
      initPinnedToolbar,
      initSideMemo,
      initModeTransition,
    ];
    for (const fn of modules) {
      try { fn(); } catch {}
    }
  }
  private destroyNeoPlus(): void {
    endNeoLifecycle();
    const modules: Array<() => void> = [
      destroyPinnedToolbar,
      destroySideMemo,
      destroyImmersiveMode,
      destroyFocusBlockIndicator,
      destroyListBulletLine,
      destroyIde,
      destroySidebarMute,
      destroySuperFusion,
      destroyVerticalTabs,
      destroyFluidCursor,
      destroyScrollEffect,
      destroyFrostedGlass,
      destroyMulticolumnSlashMenu,
      destroyColoredFolders,
      destroySmoothCaret,
      destroyColorfulSelection,
      destroyColoredHeadings,
      destroyColoredLists,
      destroyTexture,
      destroyPalette,
      destroySvgFilter,
      destroyCardSearchList,
      destroyPerformanceTuning,
      destroyFetchMonitor,
      destroyLayout,
      destroyHideScrollbar,
      destroyStatusHidden,
      destroyShortcuts,
      destroyTopBarButton,
      destroyMenuSettings,
      destroyNeoIcons,
      destroyEnv,
      destroyNeoRootClass,
      destroyModeTransition,
      destroyBaseCss,
    ];
    for (const fn of modules) {
      try { fn(); } catch {}
    }
  }
}
