import type { Config } from '../main/data';
import { getBrightnessKey, getCurrentThemeMode } from './presets';
export function initBrightness(config: Config): void {
  const mode = getCurrentThemeMode();
  const brightnessKey = getBrightnessKey(mode);
  const brightness = config[brightnessKey] ?? 0;
  document.documentElement.style.setProperty('--neo-brightness', String(brightness));
}
export function destroyBrightness(): void {
  document.documentElement.style.removeProperty('--neo-brightness');
}
export function createBrightnessSliderHTML(i18n?: Record<string, string>): string {
  const label = i18n?.brightness ?? 'Brightness';
  let currentValue = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--neo-brightness').trim());
  if (isNaN(currentValue)) currentValue = 0;
  const id = `neo-brightness-slider-${Date.now()}`;
  return `<div style="margin:4px 0;display:flex;align-items:center;width:100%;">
    <div aria-label="${label}：${currentValue.toFixed(2)}" class="b3-tooltips b3-tooltips__n" id="${id}" style="flex:1;">
      <input type="range" class="b3-slider fn__block" id="${id}-input" min="-1" max="1" value="${currentValue}" step="0.01" style="box-sizing:border-box">
    </div>
  </div>`;
}
