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
    <filter id="neo-neon-emoji" x="-50%" y="-50%" width="200%" height="200%">
      <feMorphology in="SourceGraphic" operator="dilate" radius="1" result="dilated"/>
      <feComposite in="dilated" in2="SourceGraphic" operator="out" result="outline"/>
      <feGaussianBlur in="outline" stdDeviation="1.5" result="glow1"/>
      <feGaussianBlur in="outline" stdDeviation="4" result="glow2"/>
      <feComponentTransfer in="glow2" result="glow2-fade">
        <feFuncA type="linear" slope="0.5" intercept="0"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="glow2-fade"/>
        <feMergeNode in="glow1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
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
