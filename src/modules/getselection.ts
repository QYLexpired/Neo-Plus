export function getCursorRect(): DOMRect | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.focusNode) return null;
  const range = document.createRange();
  try {
    range.setStart(sel.focusNode, sel.focusOffset);
    range.collapse(true);
    const rect = Array.from(range.getClientRects()).find(rect => rect.height > 0);
    if (rect) return rect;
    const node = sel.focusNode;
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.length) {
      const offset = sel.focusOffset;
      const useNextChar = offset < node.textContent.length;
      range.setStart(node, useNextChar ? offset : offset - 1);
      range.setEnd(node, useNextChar ? offset + 1 : offset);
      const rects = range.getClientRects();
      const charRect = useNextChar ? rects[0] : rects[rects.length - 1];
      if (charRect?.height > 0) {
        const rtl = node.parentElement && window.getComputedStyle(node.parentElement).direction === 'rtl';
        const x = useNextChar !== !!rtl ? charRect.left : charRect.right;
        return new DOMRect(x, charRect.top, 0, charRect.height);
      }
    }
    const element = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement;
    if (!element || element.textContent || !element.matches('[contenteditable="true"], [contenteditable="true"] *')) return null;
    const bounds = element.getBoundingClientRect();
    if (bounds.height <= 0) return null;
    const style = window.getComputedStyle(element);
    const fontSize = parseFloat(style.fontSize) || 16;
    const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2;
    const x = style.direction === 'rtl'
      ? bounds.right - (parseFloat(style.borderRightWidth) || 0) - (parseFloat(style.paddingRight) || 0)
      : bounds.left + (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.paddingLeft) || 0);
    const y = bounds.top + (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.paddingTop) || 0) + Math.max(0, (lineHeight - fontSize) / 2);
    return new DOMRect(x, y, 0, fontSize);
  } catch {
    return null;
  }
}
export function getTextColor(focusNode: Node | null, fallbackElement: Element): string | null {
  let textColor: string | null = null;
  if (focusNode) {
    if (focusNode.nodeType === Node.TEXT_NODE) {
      const parentElement = focusNode.parentElement;
      if (parentElement) {
        textColor = window.getComputedStyle(parentElement).color;
      }
    } else if (focusNode.nodeType === Node.ELEMENT_NODE) {
      textColor = window.getComputedStyle(focusNode as Element).color;
    }
  }
  if (!textColor) {
    textColor = window.getComputedStyle(fallbackElement).color;
  }
  if (textColor && textColor !== 'transparent') {
    const rgbaMatch = textColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
    if (rgbaMatch && parseFloat(rgbaMatch[4]) === 0) {
      return null;
    }
    return textColor;
  }
  return null;
}
export function getCharWidthAtCursor(): number | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const workRange = !range.collapsed && sel.focusNode
    ? (() => {
        const cr = document.createRange();
        try {
          cr.setStart(sel.focusNode!, sel.focusOffset);
          cr.collapse(true);
          return cr;
        } catch {
          return range.cloneRange();
        }
      })()
    : range.cloneRange();
  const textNode = workRange.endContainer;
  if (!workRange.collapsed || !(textNode instanceof Text)) return null;
  const offset = workRange.endOffset;
  const afterRange = workRange.cloneRange();
  try {
    afterRange.setEnd(textNode, Math.min(offset + 1, textNode.length));
  } catch { return null; }
  let rects = afterRange.getClientRects();
  if (rects.length > 0 && rects[0].width > 0) return rects[0].width;
  const beforeRange = workRange.cloneRange();
  try {
    beforeRange.setStart(textNode, Math.max(offset - 1, 0));
  } catch { return null; }
  rects = beforeRange.getClientRects();
  if (rects.length > 0 && rects[0].width > 0) return rects[0].width;
  return null;
}
export function getScrollContainer(): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const focusNode = sel.focusNode;
  if (!focusNode) return null;
  const element = focusNode instanceof HTMLElement ? focusNode : focusNode.parentElement;
  if (!element) return null;
  return element.closest('.protyle-content') as HTMLElement | null;
}
