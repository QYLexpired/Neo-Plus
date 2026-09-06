import { Menu } from 'siyuan';
import { getPlugin } from './context';
import { loadConfig } from './data';
import { createBrightnessSliderHTML, createColorPickerHTML, createSliderHTML, getPresetMenuItems, getThemeColor, onInvertClick, onHighContrastClick, switchToPlan } from '../palette/manager';
import { showRandomSettings } from '../palette/random';
import { getTextureMenuItems } from '../texture/manager';
import { onSmoothCaretClick, showSmoothCaretSettings } from '../extension/smoothcaret';
import { onFluidCursorClick, showFluidCursorSettings } from '../extension/fluidcursor';
import { onCardSearchListClick } from '../extension/cardsearchlist';
import { onListBulletLineClick } from '../extension/listbulletline';
import { onFocusBlockIndicatorClick, showFocusBlockIndicatorSettings } from '../extension/focusblockindicator';
import { onFrostedGlassClick, showFrostedGlassSettings } from '../interface/frostedglass';
import { onIdeClick } from '../interface/ide';
import { onColoredFoldersClick, showColoredFoldersSettings } from '../appearance/coloredfolders';
import { onVerticalTabsClick, showVerticalTabsSettings } from '../interface/verticaltabs';
import { onSuperFusionClick, showSuperFusionSettings } from '../interface/superfusion';
import { isDesktop, isMobile } from '../modules/env';
import { getCurrentThemeMode } from '../modules/thememode';
import { onSidebarMuteClick } from '../interface/sidebarmute';
import { onMulticolumnSlashMenuClick, showMulticolumnSlashMenuSettings } from '../extension/multicolumnslashmenu';
import { onColoredListsClick, showColoredListsSettings } from '../appearance/coloredlists';
import { onColoredHeadingsClick, showColoredHeadingsSettings } from '../appearance/coloredheadings';
import { onColorfulSelectionClick } from '../appearance/colorfulselection';
import { onHideToolbarClick } from '../interface/hidetoolbar';
import { createSettingsMenuLabel } from '../modules/menusettings';
import { createNeoLifecycleGuard } from './lifecycle';
export function buildMenu(
  onClose?: () => void,
): Menu {
  const plugin = getPlugin();
  if (!plugin) {
    throw new Error('Neo+ plugin not available');
  }
  const { i18n } = plugin;
  let menuActive = true;
  const menu = new Menu('topBarNeoPlus', () => {
    menuActive = false;
    onClose?.();
  });
  menu.addItem({
    id: 'neo-random-button',
    icon: 'iconDices',
    label: createSettingsMenuLabel(
      'random',
      i18n.random,
      i18n.randomSettings,
      showRandomSettings,
    ),
    click: () => {
      switchToPlan('random');
      return true;
    },
  });
  menu.addItem({
    id: 'neo-scheme-button',
    icon: 'iconNeoPalette',
    label: i18n.colorScheme,
    submenu: getPresetMenuItems(i18n),
  });
  const configPromise = loadConfig();
  const isCurrent = createNeoLifecycleGuard();
  menu.addItem({
    id: 'neo-customcolor-button',
    iconHTML: createColorPickerHTML(),
    label: i18n.customThemeColor,
    click: () => {
      switchToPlan('custom');
      const colorInput = document.querySelector<HTMLInputElement>('[data-id="neo-customcolor-button"] input[type="color"]');
      colorInput?.click();
      return true;
    },
  });
  configPromise.then((config) => {
    if (!isCurrent() || !menuActive) return;
    requestAnimationFrame(() => {
      if (!isCurrent() || !menuActive) return;
      const customPicker = document.querySelector<HTMLInputElement>('[data-id="neo-customcolor-button"] input[type="color"]');
      if (customPicker) {
        customPicker.value = getThemeColor(config);
      }
    });
  });
  menu.addItem({
    id: 'neo-followbanner-button',
    icon: '',
    label: i18n.followBanner,
    click: () => {
      switchToPlan('followbanner');
      return true;
    },
  });
  if (isDesktop()) {
    menu.addItem({
      id: 'neo-followsystem-button',
      icon: '',
      label: i18n.followSystem,
      click: () => {
        switchToPlan('followsystem');
        return true;
      },
    });
  }
  menu.addSeparator();
  menu.addItem({
    id: 'neo-saturation-button',
    icon: 'iconNeoSaturation',
    label: createSliderHTML(i18n),
    type: 'readonly',
  });
  menu.addItem({
    id: 'neo-brightness-button',
    icon: 'iconNeoBrightness',
    label: createBrightnessSliderHTML(i18n),
    type: 'readonly',
  });
  if (getCurrentThemeMode() === 'dark') {
    menu.addItem({
      id: 'neo-invert-button',
      icon: 'iconNeoInvert',
      label: i18n.invertColor,
      click: () => {
        onInvertClick();
        return true;
      },
    });
  } else if (!isMobile()) {
    menu.addItem({
      id: 'neo-highcontrast-button',
      icon: 'iconNeoContrast',
      label: i18n.highContrast,
      click: () => {
        onHighContrastClick();
        return true;
      },
    });
  }
  menu.addSeparator();
  menu.addItem({
    id: 'neo-interface-button',
    icon: 'iconNeoInterface',
    label: i18n.interface,
    submenu: [
      ...(!isMobile() ? [
        {
          id: 'neo-ide-button',
          icon: 'iconNeoIde',
          label: i18n.ide,
          click: () => {
            onIdeClick();
            return true;
          },
        },
        {
          id: 'neo-superfusion-button',
          icon: 'iconNeoSuperFusion',
          label: createSettingsMenuLabel(
            'superFusion',
            i18n.superFusion,
            i18n.superFusionSettings,
            showSuperFusionSettings,
          ),
          click: () => {
            onSuperFusionClick();
            return true;
          },
        },
        {
          id: 'neo-sidebarmute-button',
          icon: 'iconNeoSidebarMute',
          label: i18n.sidebarMute,
          click: () => {
            onSidebarMuteClick();
            return true;
          },
        },
        {
          id: 'neo-verticaltabs-button',
          icon: 'iconNeoVerticalTabs',
          label: createSettingsMenuLabel(
            'verticalTabs',
            i18n.verticalTabs,
            i18n.verticaltabsSettings,
            showVerticalTabsSettings,
          ),
          click: () => {
            onVerticalTabsClick();
            return true;
          },
        },
        {
          id: 'neo-hidetoolbar-button',
          icon: 'iconNeoHideToolbar',
          label: i18n.hideToolbar,
          click: () => {
            onHideToolbarClick();
            return true;
          },
        },
      ] : []),
      {
        id: 'neo-frostedglass-button',
        icon: 'iconNeoFrostedGlass',
        label: createSettingsMenuLabel(
          'frostedGlass',
          i18n.frostedGlass,
          i18n.frostedGlassSettings,
          showFrostedGlassSettings,
        ),
        click: () => {
          onFrostedGlassClick();
          return true;
        },
      },
    ],
  });
  menu.addItem({
    id: 'neo-appearance-button',
    icon: 'iconNeoAppearance',
    label: i18n.appearance,
    submenu: [
      {
        id: 'neo-coloredfolders-button',
        icon: 'iconFiles',
        label: createSettingsMenuLabel(
          'coloredFolders',
          i18n.coloredFolders,
          i18n.coloredFoldersSettings,
          showColoredFoldersSettings,
        ),
        click: () => {
          onColoredFoldersClick();
          return true;
        },
      },
      {
        id: 'neo-coloredheadings-button',
        icon: 'iconNeoColoredHeadings',
        label: createSettingsMenuLabel(
          'coloredHeadings',
          i18n.coloredHeadings,
          i18n.coloredHeadingsSettings,
          showColoredHeadingsSettings,
        ),
        click: () => {
          onColoredHeadingsClick();
          return true;
        },
      },
      {
        id: 'neo-coloredlists-button',
        icon: 'iconNeoList',
        label: createSettingsMenuLabel(
          'coloredLists',
          i18n.coloredLists,
          i18n.coloredListsSettings,
          showColoredListsSettings,
        ),
        click: () => {
          onColoredListsClick();
          return true;
        },
      },
      {
        id: 'neo-colorfulselection-button',
        icon: 'iconNeoColorfulSelection',
        label: i18n.colorfulSelection,
        click: () => {
          onColorfulSelectionClick();
          return true;
        },
      },
    ],
  });
  menu.addItem({
    id: 'neo-texture-button',
    icon: 'iconNeoTexture',
    label: i18n.texture,
    submenu: getTextureMenuItems(i18n),
  });
  menu.addItem({
    id: 'neo-extension-button',
    icon: 'iconNeoExtension',
    label: i18n.extension,
    submenu: [
      {
        id: 'neo-listbulletline-button',
        icon: 'iconNeoList',
        label: i18n.listBulletLine,
        click: () => {
          onListBulletLineClick();
          return true;
        },
      },
      {
        id: 'neo-focusblockindicator-button',
        icon: 'iconNeoFocusBlockIndicator',
        label: createSettingsMenuLabel(
          'focusBlockIndicator',
          i18n.focusBlockIndicator,
          i18n.focusBlockIndicatorSettings,
          showFocusBlockIndicatorSettings,
        ),
        click: () => {
          onFocusBlockIndicatorClick();
          return true;
        },
      },
      ...(!isMobile() ? [
        {
          id: 'neo-multicolumnslashmenu-button',
          icon: 'iconNeoMulticolumnSlashMenu',
          label: createSettingsMenuLabel(
            'multicolumnSlashMenu',
            i18n.multicolumnSlashMenu,
            i18n.multicolumnSlashMenuSettings,
            showMulticolumnSlashMenuSettings,
          ),
          click: () => {
            onMulticolumnSlashMenuClick();
            return true;
          },
        },
      ] : []),
      {
        id: 'neo-cardsearchlist-button',
        icon: 'iconSearch',
        label: i18n.cardSearchList,
        click: () => {
          onCardSearchListClick();
          return true;
        },
      },
      {
        id: 'neo-smoothcaret-button',
        icon: 'iconNeoSmoothCaret',
        label: createSettingsMenuLabel(
          'smoothCaret',
          i18n.smoothCaret,
          i18n.smoothCaretSettings,
          showSmoothCaretSettings,
        ),
        click: () => {
          onSmoothCaretClick();
          return true;
        },
      },
      ...(!isMobile() ? [
        {
          id: 'neo-fluidcursor-button',
          icon: 'iconNeoFluidCursor',
          label: createSettingsMenuLabel(
            'fluidCursor',
            i18n.fluidCursor,
            i18n.fluidCursorSettings,
            showFluidCursorSettings,
          ),
          click: () => {
            onFluidCursorClick();
            return true;
          },
        },
      ] : []),
    ],
  });
  return menu;
}
