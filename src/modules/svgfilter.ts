import { liquidGlassFilters } from './liquidglassfilter';
const svgId = 'neo-svg-filter';
function injectSvgFilter(): void {
  if (document.getElementById(svgId)) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = svgId;
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML = `<defs>
    <filter id="neo-brutalism-emoji-light" x="-50%" y="-50%" width="200%" height="200%">
      <feColorMatrix in="SourceGraphic" type="matrix" values="0.25 0 0 0 0 0 0.25 0 0 0 0 0 0.25 0 0 0 0 0 1 0" result="darkened"/>
      <feOffset in="darkened" dx="8" dy="10" result="shadow"/>
      <feMerge>
        <feMergeNode in="shadow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="neo-brutalism-emoji-dark" x="-50%" y="-50%" width="200%" height="200%">
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="darkened"/>
      <feOffset in="darkened" dx="8" dy="10" result="shadow"/>
      <feMerge>
        <feMergeNode in="shadow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    ${Object.values(liquidGlassFilters).join('\n    ')}
  </defs>`;
  document.head.appendChild(svg);
}
function removeSvgFilter(): void {
  const el = document.getElementById(svgId);
  if (el) {
    el.remove();
  }
}
export function initSvgFilter(): void {
  injectSvgFilter();
}
export function destroySvgFilter(): void {
  removeSvgFilter();
}
