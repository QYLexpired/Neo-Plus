import type { Config } from '../main/data';
import { getThemeMode, getSaturationKey } from './presets';
export function initSaturation(config: Config): void {
  const mode = getThemeMode();
  const satKey = getSaturationKey(mode);
  const saturation = config[satKey] ?? 1;
  document.documentElement.style.setProperty('--neo-saturation', String(saturation));
}
export function destroySaturation(): void {
  document.documentElement.style.removeProperty('--neo-saturation');
}
export function createSliderHTML(i18n?: Record<string, string>): string {
  const label = i18n?.saturation ?? 'Saturation';
  let currentValue = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--neo-saturation').trim());
  if (isNaN(currentValue)) currentValue = 1;
  const id = `neo-saturation-slider-${Date.now()}`;
  return `<div style="display:flex;align-items:center;width:100%;">
    <div aria-label="${label}：${currentValue.toFixed(2)}" class="b3-tooltips b3-tooltips__n" id="${id}" style="flex:1;">
      <input type="range" class="b3-slider fn__block" id="${id}-input" min="0" max="5" value="${currentValue}" step="0.01" style="box-sizing:border-box">
    </div>
  </div>`;
}
