export function getCursorRect(): DOMRect | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!range.collapsed && sel.focusNode) {
    const cursorRange = document.createRange();
    try {
      cursorRange.setStart(sel.focusNode, sel.focusOffset);
      cursorRange.collapse(true);
      const rects = cursorRange.getClientRects();
      if (rects.length > 0 && rects[0].height > 0) {
        return rects[0];
      }
      let textNode: Text | null = null;
      try {
        textNode = document.createTextNode('\u200B');
        cursorRange.insertNode(textNode);
        cursorRange.selectNode(textNode);
        const rect = cursorRange.getBoundingClientRect();
        if (rect && rect.height > 0) {
          return rect;
        }
        if (rect) {
          return new DOMRect(rect.left, rect.top, 0, rect.height);
        }
      } catch {
      } finally {
        if (textNode?.parentNode) {
          textNode.parentNode.removeChild(textNode);
        }
      }
    } catch {
    }
  }
  const rects = range.getClientRects();
  if (rects.length > 0 && rects[0].height > 0) {
    return rects[0];
  }
  let textNode: Text | null = null;
  try {
    const cloneRange = range.cloneRange();
    textNode = document.createTextNode('\u200B');
    cloneRange.insertNode(textNode);
    cloneRange.selectNode(textNode);
    const rect = cloneRange.getBoundingClientRect();
    if (rect && rect.height > 0) {
      return rect;
    }
    if (rect) {
      return new DOMRect(rect.left, rect.top, 0, rect.height);
    }
  } catch {
  } finally {
    if (textNode?.parentNode) {
      textNode.parentNode.removeChild(textNode);
    }
  }
  return null;
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
  if (!workRange.collapsed || workRange.endContainer.nodeType !== Node.TEXT_NODE) return null;
  const textNode = workRange.endContainer as Text;
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
