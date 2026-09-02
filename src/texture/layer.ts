const textureLayerId = 'neo-texture-layer';
function applyLayerBaseStyle(layer: HTMLElement): void {
  layer.style.position = 'fixed';
  layer.style.inset = '0';
  layer.style.pointerEvents = 'none';
  layer.style.zIndex = 'var(--neo-texture-zlevel, var(--neo-customimage-zlevel, 99))';
}
export function ensureTextureLayer(): HTMLElement {
  const existing = document.getElementById(textureLayerId);
  if (existing) {
    applyLayerBaseStyle(existing);
    return existing;
  }
  const layer = document.createElement('div');
  layer.id = textureLayerId;
  applyLayerBaseStyle(layer);
  document.body.insertAdjacentElement('afterend', layer);
  return layer;
}
export function removeTextureLayer(): void {
  document.getElementById(textureLayerId)?.remove();
}
