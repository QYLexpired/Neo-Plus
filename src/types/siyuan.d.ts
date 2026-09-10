declare module 'siyuan' {
  export const Constants: {
    SIYUAN_VERSION: string;
  };
  export function getFrontend(): string;
  export function getBackend(): string;
  export function adaptHotkey(hotkey: string): string;
  export function openSetting(app: App): void;
  export function openMobileFileById(app: App, id: string): void;
  export function openTab<T = any>(config: {
    app: App;
    custom?: {
      icon: string;
      title: string;
      data: T;
      id: string;
    };
    asset?: {
      path: string;
    };
    doc?: {
      id: string;
    };
    search?: {
      k: string;
    };
    card?: {
      type: string;
    };
  }): Promise<any>;
  export function openWindow(config: {
    doc?: { id: string };
    refDefs?: Array<{ refID: string }>;
    x?: number;
    y?: number;
    isBacklink?: boolean;
  }): void;
  export function openAttributePanel(config: {
    nodeElement: Element;
    protyle: Protyle;
    focusName: string;
  }): void;
  export function getAllEditor(): Protyle[];
  export function getModelByDockType(type: string): any;
  export function showMessage(msg: string, timeout?: number): void;
  export function confirm(title: string, msg: string, confirmCallback: () => void): void;
  export function lockScreen(app: App): void;
  export function exitSiYuan(): void;
  export function saveLayout(callback: () => void): void;
  export function fetchPost(url: string, body: any, callback: (res: any) => void): void;
  export const platformUtils: {
    isHuawei(): boolean;
    isMobile(): boolean;
  };
  export class Plugin {
    name: string;
    app: App;
    i18n: Record<string, string>;
    commands: any[];
    protyleOptions?: { toolbar?: string[] };
    protyleSlash?: any[];
    constructor(options?: any);
    onload(): void;
    onLayoutReady(): void;
    onunload(): void;
    uninstall(): void;
    loadData<T = any>(key: string): Promise<T>;
    saveData<T = any>(key: string, data: T): Promise<void>;
    removeData(key: string): Promise<void>;
    addIcons(svg: string): void;
    addTopBar(config: {
      icon: string;
      title: string;
      position: 'left' | 'right';
      callback: () => void;
    }): HTMLElement;
    addStatusBar(config: { element: Element }): void;
    addDock(config: {
      config: {
        position: string;
        size: { width: number; height: number };
        icon: string;
        title: string;
        hotkey?: string;
      };
      data?: any;
      type: string;
      resize?: () => void;
      update?: () => void;
      init: (data: any) => void;
      destroy?: () => void;
    }): void;
    addTab(config: {
      type: string;
      init: () => void;
      beforeDestroy?: () => void;
      destroy?: () => void;
    }): any;
    addCommand(config: {
      langKey: string;
      hotkey?: string;
      callback?: () => void;
      globalCallback?: () => void;
    }): void;
    addFloatLayer(config: {
      refDefs: Array<{ refID: string }>;
      x: number;
      y: number;
      isBacklink: boolean;
    }): void;
    eventBus: EventBus;
    getEditor(): Protyle;
    getOpenedTab(): any[];
  }
  export class Setting {
    constructor(config: { confirmCallback: () => void });
    addItem(item: {
      title: string;
      direction: string;
      description: string;
      createActionElement?: () => HTMLElement;
      actionElement?: HTMLElement;
    }): void;
  }
  export class Dialog {
    constructor(config: {
      destroyCallback?: () => void;
      title: string;
      content: string;
      width?: string;
      height?: string;
    });
    element: HTMLElement;
    destroy(): void;
  }
  export class Menu {
    element: HTMLElement;
    close(): void;
    constructor(name: string, closeCallback?: () => void);
    addItem(item: {
      id?: string;
      icon?: string;
      iconHTML?: string;
      label: string;
      accelerator?: string;
      bind?: (element: HTMLElement) => void;
      click?: () => void;
      type?: string;
      submenu?: any[];
    }): void;
    addSeparator(): void;
    open(position: { x: number; y: number; h?: number; isLeft?: boolean }): void;
    fullscreen(): void;
  }
  export class Protyle {
    constructor(
      app: App,
      element: HTMLElement,
      config: { blockId: string }
    );
    wysiwyg: { element: HTMLElement };
    block: { rootID: string; notebookId: string; path: string };
    getInstance(): any;
    transaction(operations: any[]): void;
  }
  export class EventBus {
    on(event: string, handler: (detail: any) => void): void;
    off(event: string, handler: (detail: any) => void): void;
  }
  export class App {
    appId: string;
  }
}
