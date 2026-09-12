import { getPlugin } from './context';
import { switchToPlan } from '../palette/manager';
import { openNeoMenu } from './topbar';
export function initShortcuts(isActive: () => boolean): void {
  const plugin = getPlugin();
  if (!plugin) return;
  plugin.addCommand({
    langKey: 'neoMenu',
    hotkey: '',
    callback: () => {
      if (!isActive()) return;
      openNeoMenu();
    },
  });
  plugin.addCommand({
    langKey: 'random',
    hotkey: '',
    callback: () => {
      if (!isActive()) return;
      switchToPlan('random');
    },
  });
}
