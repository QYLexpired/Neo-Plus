import { Menu } from 'siyuan';
import { getPlugin } from './guard';
import { loadConfig } from './data';
import { createBrightnessSliderHTML, createColorPickerHTML, createFollowTimeColorPickerHTML, createSliderHTML, getPresetMenuItems, getThemeColor, initPaletteMenuEvents, onInvertClick, onHighContrastClick, switchToPlan } from '../palette/manager';
import { createRandomLabelHTML } from '../palette/random';
import { getTextureMenuItems } from '../texture/manager';
import { onSmoothCaretClick, createSmoothCaretLabelHTML } from '../visual/smoothcaret';
import { onFluidCursorClick, createFluidCursorLabelHTML } from '../visual/fluidcursor';
import { onListBulletLineClick } from '../extension/listbulletline';
import { onFocusBlockIndicatorClick, createFocusBlockIndicatorLabelHTML } from '../extension/focusblockindicator';
import { onFrostedGlassClick, createFrostedGlassLabelHTML } from '../visual/frostedglass';
import { onScrollEffectClick } from '../visual/scrolleffect';
import { onIdeClick } from '../ide/ide';
import { onColoredFoldersClick, createColoredFoldersLabelHTML } from '../visual/coloredfolders';
import { onVerticalTabsClick, createVerticalTabsLabelHTML } from '../verticaltabs/verticaltabs';
import { onImmersiveModeClick, createImmersiveModeLabelHTML } from '../extension/immersivemode';
import { onSuperFusionClick, createSuperFusionLabelHTML } from '../superfusion/superfusion';
import { isMobile } from '../modules/env';
import { onSidebarMuteClick } from '../sidebarmute/sidebarmute';
import { onCardSearchListClick } from '../visual/cardsearchlist';
import { onMulticolumnSlashMenuClick, createMulticolumnSlashMenuLabelHTML } from '../visual/multicolumnslashmenu';
import { onColoredListsClick } from '../element/coloredlists';
import { onPinnedToolbarClick, createPinnedToolbarLabelHTML } from '../extension/pinnedtoolbar';
import { onSideMemoClick, createSideMemoLabelHTML } from '../extension/sidememo';
import { onColoredHeadingsClick } from '../element/coloredheadings';
import { onColorfulSelectionClick } from '../element/colorfulselection';
import { onHideToolbarClick } from '../modules/hidetoolbar';
export function buildMenu(
  onClose?: () => void,
): Menu {
  const plugin = getPlugin();
  if (!plugin) {
    throw new Error('Neo+ plugin not available');
  }
  const { i18n } = plugin;
  const menu = new Menu('topBarNeoPlus', () => {
    onClose?.();
  });
  menu.addItem({
    id: 'neo-random-button',
    icon: 'iconDices',
    label: createRandomLabelHTML(i18n),
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
  menu.addItem({
    id: 'neo-custom-color-button',
    iconHTML: createColorPickerHTML(),
    label: i18n.customThemeColor,
    click: () => {
      switchToPlan('custom');
      const colorInput = document.querySelector<HTMLInputElement>('[data-id="neo-custom-color-button"] input[type="color"]');
      colorInput?.click();
      return true;
    },
  });
  menu.addItem({
    id: 'neo-followtime-button',
    iconHTML: createFollowTimeColorPickerHTML(),
    label: i18n.followTime,
    click: () => {
      switchToPlan('followtime');
      const colorInput = document.querySelector<HTMLInputElement>('[data-id="neo-followtime-button"] input[type="color"]');
      colorInput?.click();
      return true;
    },
  });
  configPromise.then((config) => {
    requestAnimationFrame(() => {
      const customPicker = document.querySelector<HTMLInputElement>('[data-id="neo-custom-color-button"] input[type="color"]');
      if (customPicker) {
        customPicker.value = getThemeColor(config);
      }
      const followtimePicker = document.querySelector<HTMLInputElement>('[data-id="neo-followtime-button"] input[type="color"]');
      if (followtimePicker) {
        followtimePicker.value = createFollowTimeColorPickerHTML(config).match(/value="([^"]+)"/)?.[1] || followtimePicker.value;
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
  menu.addItem({
    id: 'neo-followsystem-button',
    icon: '',
    label: i18n.followSystem,
    click: () => {
      switchToPlan('followsystem');
      return true;
    },
  });
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
  menu.addItem({
    id: 'neo-invert-button',
    icon: 'iconNeoInvert',
    label: i18n.invertColor,
    click: () => {
      onInvertClick();
      return true;
    },
  });
  if (!isMobile()) {
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
  if (!isMobile()) {
    menu.addSeparator();
    menu.addItem({
      id: 'neo-ide-button',
      icon: 'iconNeoIde',
      label: i18n.ide,
      click: () => {
        onIdeClick();
        return true;
      },
    });
  }
  if (!isMobile()) {
    menu.addItem({
      id: 'neo-super-fusion-button',
      icon: 'iconNeoSuperFusion',
      label: createSuperFusionLabelHTML(i18n),
      click: () => {
        onSuperFusionClick();
        return true;
      },
    });
  }
  if (!isMobile()) {
    menu.addItem({
      id: 'neo-sidebar-mute-button',
      icon: 'iconNeoSidebarMute',
      label: i18n.sidebarMute,
      click: () => {
        onSidebarMuteClick();
        return true;
      },
    });
    menu.addItem({
      id: 'neo-vertical-tabs-button',
      icon: 'iconNeoVerticalTabs',
      label: createVerticalTabsLabelHTML(i18n),
      click: () => {
        onVerticalTabsClick();
        return true;
      },
    });
    menu.addItem({
      id: 'neo-hide-toolbar-button',
      icon: 'iconNeoHideToolbar',
      label: i18n.hideToolbar,
      click: () => {
        onHideToolbarClick();
        return true;
      },
    });
  }
  menu.addSeparator();
  menu.addItem({
    id: 'neo-visual-button',
    icon: 'iconNeoVisual',
    label: i18n.visual,
    submenu: [
      {
        id: 'neo-frosted-glass-button',
        icon: 'iconNeoFrostedGlass',
        label: createFrostedGlassLabelHTML(i18n),
        click: () => {
          onFrostedGlassClick();
          return true;
        },
      },
      {
        id: 'neo-scroll-effect-button',
        icon: 'iconNeoScrollEffect',
        label: i18n.scrollEffect,
        click: () => {
          onScrollEffectClick();
          return true;
        },
      },
      {
        id: 'neo-colored-folders-button',
        icon: 'iconFiles',
        label: createColoredFoldersLabelHTML(i18n),
        click: () => {
          onColoredFoldersClick();
          return true;
        },
      },
      ...(!isMobile() ? [
        {
          id: 'neo-multicolumn-slash-menu-button',
          icon: 'iconNeoMulticolumnSlashMenu',
          label: createMulticolumnSlashMenuLabelHTML(i18n),
          click: () => {
            onMulticolumnSlashMenuClick();
            return true;
          },
        },
      ] : []),
      {
        id: 'neo-card-search-list-button',
        icon: 'iconSearch',
        label: i18n.cardSearchList,
        click: () => {
          onCardSearchListClick();
          return true;
        },
      },
      {
        id: 'neo-smooth-caret-button',
        icon: 'iconNeoSmoothCaret',
        label: createSmoothCaretLabelHTML(i18n),
        click: () => {
          onSmoothCaretClick();
          return true;
        },
      },
      ...(!isMobile() ? [
        {
          id: 'neo-fluid-cursor-button',
          icon: 'iconNeoFluidCursor',
          label: createFluidCursorLabelHTML(i18n),
          click: () => {
            onFluidCursorClick();
            return true;
          },
        },
      ] : []),
    ],
  });
  menu.addItem({
    id: 'neo-texture-button',
    icon: 'iconNeoTexture',
    label: i18n.texture,
    submenu: getTextureMenuItems(i18n),
  });
  menu.addItem({
    id: 'neo-element-button',
    icon: 'iconNeoElement',
    label: i18n.element,
    submenu: [
      {
        id: 'neo-colored-lists-button',
        icon: 'iconNeoList',
        label: i18n.coloredLists,
        click: () => {
          onColoredListsClick();
          return true;
        },
      },
      {
        id: 'neo-colored-headings-button',
        icon: 'iconNeoColoredHeadings',
        label: i18n.coloredHeadings,
        click: () => {
          onColoredHeadingsClick();
          return true;
        },
      },
      {
        id: 'neo-colorful-selection-button',
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
    id: 'neo-extension-button',
    icon: 'iconNeoExtension',
    label: i18n.extension,
    submenu: [
      {
        id: 'neo-immersive-mode-button',
        icon: 'iconNeoImmersiveMode',
        label: createImmersiveModeLabelHTML(i18n),
        click: () => {
          onImmersiveModeClick();
          return true;
        },
      },
      {
        id: 'neo-list-bullet-line-button',
        icon: 'iconNeoList',
        label: i18n.listBulletLine,
        click: () => {
          onListBulletLineClick();
          return true;
        },
      },
      {
        id: 'neo-focus-block-indicator-button',
        icon: 'iconNeoFocusBlockIndicator',
        label: createFocusBlockIndicatorLabelHTML(i18n),
        click: () => {
          onFocusBlockIndicatorClick();
          return true;
        },
      },
      ...(!isMobile() ? [
        {
          id: 'neo-pinned-toolbar-button',
          icon: 'iconNeoPinnedToolbar',
          label: createPinnedToolbarLabelHTML(i18n),
          click: () => {
            onPinnedToolbarClick();
            return true;
          },
        },
      ] : []),
      ...(!isMobile() ? [
        {
          id: 'neo-sidememo-button',
          icon: 'iconNeoSideMemo',
          label: createSideMemoLabelHTML(i18n),
          click: () => {
            onSideMemoClick();
            return true;
          },
        },
      ] : []),
    ],
  });
  initPaletteMenuEvents(i18n);
  return menu;
}
