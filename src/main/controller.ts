import type { Plugin } from 'siyuan';
import { getCurrentThemeMode } from '../modules/thememode';
import { clearPlugin, setPlugin } from './context';
import { startNeoRuntime, stopNeoRuntime, syncNeoRootMode } from './runtime';
function isNeoTheme(): boolean {
  if (getCurrentThemeMode() === 'dark') {
    return document.documentElement.getAttribute('data-dark-theme') === 'Neo';
  }
  return document.documentElement.getAttribute('data-light-theme') === 'Neo';
}
export class NeoPlusController {
  private themeObserver: MutationObserver | null = null;
  private neoThemeActive = false;
  constructor(private readonly plugin: Plugin) {}
  init(): void {
    setPlugin(this.plugin);
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
    if (this.neoThemeActive) stopNeoRuntime();
    this.neoThemeActive = false;
    clearPlugin(this.plugin);
  }
  private handleThemeChange(): void {
    const neoThemeActive = isNeoTheme();
    if (neoThemeActive && !this.neoThemeActive) {
      startNeoRuntime();
    } else if (!neoThemeActive && this.neoThemeActive) {
      stopNeoRuntime();
    } else if (neoThemeActive) {
      syncNeoRootMode();
    }
    this.neoThemeActive = neoThemeActive;
  }
}
