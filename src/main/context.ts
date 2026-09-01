import type { Plugin } from 'siyuan';
let plugin: Plugin | null = null;
export function setPlugin(instance: Plugin): void {
  plugin = instance;
}
export function clearPlugin(instance: Plugin): void {
  if (plugin === instance) plugin = null;
}
export function getPlugin(): Plugin | null {
  return plugin;
}
