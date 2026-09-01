import { Dialog, fetchPost } from 'siyuan';
import { getPlugin } from '../main/guard';
import { saveConfig, loadConfig, type Config } from '../main/data';
import { isMobile } from '../modules/env';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { fetchListener } from '../modules/fetchmonitor';
import { createNeoLifecycleGuard } from '../main/lifecycle';
const _fetchListener = fetchListener();
interface SidememoState {
  enter?: (() => void);
  leave?: (() => void);
  click?: EventListener;
  mousedown?: EventListener;
  _preMove?: (ev: MouseEvent) => void;
  _preUp?: (() => void);
  _dragMove?: ((ev: MouseEvent) => void) | null;
  _dragUp?: (() => void) | null;
  _timer?: number | null;
  _neoContainer?: HTMLElement | null;
  _neoParent?: HTMLElement | null;
}
const _sidememoState = new WeakMap<HTMLElement, SidememoState>();
let _lute: any = null;
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;
let _destroyed = false;
let _rafPending = false;
function scheduleSync(): void {
  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    _debounceTimer = null;
    if (_destroyed || _rafPending) return;
    _rafPending = true;
    requestAnimationFrame(() => {
      _rafPending = false;
      if (_destroyed) return;
      try { syncSidememoState(); } catch {}
    });
  }, 500);
}
_fetchListener.on('setUILayout', scheduleSync);
_fetchListener.on('transactions', scheduleSync);
_fetchListener.on('setBlockAttrs', scheduleSync);
_fetchListener.on('getDoc', scheduleSync);
_fetchListener.on('renameDoc', scheduleSync);
function getLute() {
  if (!_lute && typeof (window as any).Lute !== 'undefined') {
    _lute = (window as any).Lute.New();
    const syConfig = (window as any).siyuan.config.editor.markdown;
    _lute.SetSup(syConfig.inlineSup);
    _lute.SetSub(syConfig.inlineSub);
    _lute.SetMark(syConfig.inlineMark);
    _lute.SetTag(syConfig.inlineTag);
    _lute.SetJSRenderers({
      renderers: {
        Md2HTML: {
          renderTag: (node: any, entering: boolean) => {
            if (entering) {
              return [`<span data-type="tag">`, (window as any).Lute.WalkContinue];
            } else {
              return [`</span>`, (window as any).Lute.WalkContinue];
            }
          },
          renderTagOpenMarker: (node: any, entering: boolean) => {
            return ['', (window as any).Lute.WalkContinue];
          },
          renderTagCloseMarker: (node: any, entering: boolean) => {
            return ['', (window as any).Lute.WalkContinue];
          }
        }
      }
    });
  }
  return _lute;
}
function decodeMemoHTML(str: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
}
function applySyntaxHighlighting(container: HTMLElement) {
  try {
    const globalHljs = (window as any).hljs;
    if (!globalHljs) return;
    const codeEls = Array.from(container.querySelectorAll<HTMLElement>('pre code'));
    codeEls.forEach((el) => {
      if (typeof globalHljs.highlightElement === 'function') {
        globalHljs.highlightElement(el);
      } else {
        const cls = el.className || '';
        const langMatch = cls.match(/language-([a-z0-9-]+)/i);
        const lang = (langMatch && langMatch[1]) || '';
        const codeText = el.textContent || '';
        if (lang && globalHljs.getLanguage && globalHljs.getLanguage(lang)) {
          el.innerHTML = globalHljs.highlight(codeText, { language: lang }).value;
        } else if (globalHljs.highlightAuto) {
          el.innerHTML = globalHljs.highlightAuto(codeText).value;
        }
      }
    });
  } catch {}
}
function renderKatexInContainer(container: HTMLElement) {
  try {
    const globalKatex = (window as any).katex;
    if (!globalKatex) return;
    container.querySelectorAll('span.language-math').forEach((el) => {
      try {
        const text = (el.textContent || '').trim();
        if (text) {
          globalKatex.render(text, el, { throwOnError: false, displayMode: false });
        }
      } catch {}
    });
    container.querySelectorAll('div.language-math').forEach((el) => {
      try {
        const text = (el.textContent || '').trim();
        if (text) {
          globalKatex.render(text, el, { throwOnError: false, displayMode: true });
        }
      } catch {}
    });
  } catch {}
}
let _connectorState: { sourceEl: HTMLElement; targetEl: HTMLElement; container: HTMLElement; targetEdge?: 'top' } | null = null;
let _scrollHandler: (() => void) | null = null;
let _rafId: number | null = null;
function getConnectorSvg(container: HTMLElement): SVGElement | null {
  let svg = container.querySelector<SVGElement>('.neo-sidememo-connector');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('neo-sidememo-connector');
    svg.setAttribute('overflow', 'visible');
    container.appendChild(svg);
  }
  return svg;
}
function getConnectorPath(svg: SVGElement): SVGPathElement {
  let path = svg.querySelector<SVGPathElement>('path');
  if (!path) {
    path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(path);
  }
  return path;
}
function clearConnector(container: HTMLElement): void {
  if (_rafId !== null) {
    cancelAnimationFrame(_rafId);
    _rafId = null;
  }
  const svg = container.querySelector('.neo-sidememo-connector');
  if (svg) {
    svg.innerHTML = '';
  }
  if (_scrollHandler) {
    document.removeEventListener('scroll', _scrollHandler, true);
    _scrollHandler = null;
  }
  _connectorState = null;
}
function updateConnectorPath(sourceEl: HTMLElement, targetEl: HTMLElement, container: HTMLElement, targetEdge?: 'top'): void {
  const svg = getConnectorSvg(container);
  if (!svg) return;
  const sourceRect = sourceEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();
  const sourceCenterX = sourceRect.left + sourceRect.width / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const isSourceLeftOfTarget = sourceCenterX < targetCenterX;
  let x1: number, y1: number, x2: number, y2: number;
  let cpX1: number, cpX2: number;
  if (targetEdge === 'top') {
    if (isSourceLeftOfTarget) {
      x1 = sourceRect.right - svgRect.left;
    } else {
      x1 = sourceRect.left - svgRect.left;
    }
    y1 = sourceRect.top + sourceRect.height / 2 - svgRect.top;
    x2 = targetRect.left + targetRect.width / 2 - svgRect.left;
    y2 = targetRect.top - svgRect.top;
    const cpOffsetX = Math.min(150, Math.abs(x2 - x1) / 2);
    cpX1 = isSourceLeftOfTarget ? x1 + cpOffsetX : x1 - cpOffsetX;
    cpX2 = isSourceLeftOfTarget ? x2 - cpOffsetX : x2 + cpOffsetX;
  } else if (isSourceLeftOfTarget) {
    x1 = sourceRect.right - svgRect.left;
    y1 = sourceRect.top + sourceRect.height / 2 - svgRect.top;
    x2 = targetRect.left - svgRect.left;
    y2 = targetRect.top + targetRect.height / 2 - svgRect.top;
    const cpOffset = Math.min(150, Math.abs(x2 - x1) / 2);
    cpX1 = x1 + cpOffset;
    cpX2 = x2 - cpOffset;
  } else {
    x1 = sourceRect.left - svgRect.left;
    y1 = sourceRect.top + sourceRect.height / 2 - svgRect.top;
    x2 = targetRect.right - svgRect.left;
    y2 = targetRect.top + targetRect.height / 2 - svgRect.top;
    const cpOffset = Math.min(150, Math.abs(x2 - x1) / 2);
    cpX1 = x1 - cpOffset;
    cpX2 = x2 + cpOffset;
  }
  const cpY1 = y1;
  const cpY2 = y2;
  const path = getConnectorPath(svg);
  path.setAttribute('d', `M${x1},${y1} C${cpX1},${cpY1} ${cpX2},${cpY2} ${x2},${y2}`);
}
function drawConnector(sourceEl: HTMLElement, targetEl: HTMLElement, container: HTMLElement, targetEdge?: 'top'): void {
  if (container.classList.contains('neo-sidememo-container-resize')) return;
  updateConnectorPath(sourceEl, targetEl, container, targetEdge);
  _connectorState = { sourceEl, targetEl, container, targetEdge };
  if (!_scrollHandler) {
    _scrollHandler = () => {
      if (_rafId !== null) return;
      _rafId = requestAnimationFrame(() => {
        _rafId = null;
        if (_connectorState?.container) {
          const { sourceEl, targetEl, container, targetEdge: edge } = _connectorState;
          if (
            sourceEl && targetEl &&
            document.contains(sourceEl) &&
            document.contains(targetEl)
          ) {
            updateConnectorPath(sourceEl, targetEl, container, edge);
          } else {
            clearConnector(container);
          }
        }
      });
    };
    document.addEventListener('scroll', _scrollHandler, { capture: true, passive: true });
  }
}
function getUidFromElement(el: HTMLElement): string | null {
  const attrs = el.getAttributeNames();
  for (const attr of attrs) {
    if (attr.startsWith('neo-sidememo-uid-')) {
      return attr.replace('neo-sidememo-uid-', '');
    }
  }
  return null;
}
function setUidToElement(el: HTMLElement, uid: string): void {
  el.setAttribute('neo-sidememo-uid-' + uid, '');
}
function removeUidFromElement(el: HTMLElement, uid: string): void {
  el.removeAttribute('neo-sidememo-uid-' + uid);
}
function renderMemoContent(contentDiv: HTMLElement, contentText: string): void {
  try {
    const lute = getLute();
    const mdHtml = lute ? lute.Md2HTML(decodeMemoHTML(contentText)) : contentText;
    contentDiv.innerHTML = mdHtml;
    try {
      applySyntaxHighlighting(contentDiv);
    } catch {}
  } catch {
    contentDiv.textContent = contentText;
  }
}
function ensureMemoUid(memoEl: HTMLElement): string {
  let uid = getUidFromElement(memoEl);
  if (!uid) {
    uid = `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    try {
      setUidToElement(memoEl, uid);
    } catch {}
  }
  return uid;
}
function queryMemoElementsInWysiwyg(protyleContent: HTMLElement): HTMLElement[] {
  const wysiwyg = protyleContent.querySelector<HTMLElement>('.protyle-wysiwyg');
  if (!wysiwyg) return [];
  const descendants = Array.from(wysiwyg.querySelectorAll<HTMLElement>('[data-type*=\'inline-memo\'], [memo]'));
  if (wysiwyg.matches('[data-type*=\'inline-memo\'], [memo]')) {
    return [wysiwyg, ...descendants];
  }
  return descendants;
}
function hasMemoInWysiwyg(protyleContent: HTMLElement): boolean {
  const wysiwyg = protyleContent.querySelector<HTMLElement>('.protyle-wysiwyg');
  if (!wysiwyg) return false;
  return wysiwyg.matches('[data-type*=\'inline-memo\'], [memo]') ||
         wysiwyg.querySelector('[data-type*=\'inline-memo\'], [memo]') !== null;
}
function calcMemoTop(sourceEl: HTMLElement, container: HTMLElement, protyleContent: HTMLElement): number {
  const sourceRect = sourceEl.getBoundingClientRect();
  const titleRect = container.parentElement?.getBoundingClientRect();
  if (titleRect) {
    return Math.max(0, sourceRect.top - titleRect.bottom + 4);
  }
  const protyleRect = protyleContent.getBoundingClientRect();
  return Math.max(0, sourceRect.top - protyleRect.top);
}
function createMemoItem(config: {
  className: string;
  titleClassName: string;
  contentClassName: string;
  titleText: string;
  contentText: string;
  top: number;
  uid: string;
  sourceEls: HTMLElement[];
  type: 'inline' | 'block' | 'file';
}): HTMLElement {
  const item = document.createElement('div');
  item.className = config.className;
  item.style.position = 'absolute';
  const title = document.createElement('div');
  title.className = config.titleClassName;
  title.textContent = config.titleText;
  const content = document.createElement('div');
  content.className = config.contentClassName;
  renderMemoContent(content, config.contentText);
  item.appendChild(title);
  item.appendChild(content);
  item.setAttribute('neo-sidememo-uid-' + config.uid, '');
  item.style.top = `${config.top}px`;
  return item;
}
function isOnlyZeroWidthSpaces(text: string): boolean {
  if (!text) return true;
  const zeroWidthRegex = /^[\u200B\u200C\u200D\u200E\u200F\uFEFF]*$/;
  return zeroWidthRegex.test(text);
}
function areConsecutiveSiblings(el1: HTMLElement, el2: HTMLElement): boolean {
  if (!el1.parentElement || !el2.parentElement) return false;
  if (el1.parentElement !== el2.parentElement) return false;
  const siblings = Array.from(el1.parentElement.childNodes);
  const index1 = siblings.indexOf(el1);
  const index2 = siblings.indexOf(el2);
  if (index2 <= index1) return false;
  for (let i = index1 + 1; i < index2; i++) {
    const node = siblings[i];
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || '';
      if (!isOnlyZeroWidthSpaces(textContent)) return false;
    }
    if (node.nodeType === Node.ELEMENT_NODE) return false;
  }
  return true;
}
async function initSidememoRely(): Promise<boolean> {
  try {
    const head = document.head;
    const createLink = (id: string, href: string) => {
      try {
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = href;
        head.appendChild(link);
      } catch {}
    };
    const createScript = (id: string, src: string, async = true) =>
      new Promise<void>((resolve, reject) => {
        try {
          if (document.getElementById(id)) {
            resolve();
            return;
          }
          const script = document.createElement('script');
          script.id = id;
          script.src = src;
          script.async = async;
          script.onload = () => resolve();
          script.onerror = () => reject();
          head.appendChild(script);
        } catch (e) { reject(e); }
      });
    const needKatex = !(window as any).katex;
    const needHljs = !(window as any).hljs;
    if (!needKatex && !needHljs) {
      return true;
    }
    const resources: Array<{ type: 'link' | 'script'; id: string; href?: string; src?: string }> = [];
    if (needKatex) {
      resources.push({ type: 'link', id: 'protyleKatexStyle', href: '/stage/protyle/js/katex/katex.min.css?v=0.16.9' });
      try {
        await createScript('protyleKatexScript', '/stage/protyle/js/katex/katex.min.js?v=0.16.9', false);
        await createScript('protyleKatexMhchemScript', '/stage/protyle/js/katex/mhchem.min.js?v=0.16.9', false);
      } catch {}
    }
    if (needHljs) {
      resources.push({ type: 'link', id: 'protyleHljsStyle', href: '/stage/protyle/js/highlight.js/styles/github.min.css?v=11.11.2' });
      resources.push({ type: 'script', id: 'protyleHljsScript', src: '/stage/protyle/js/highlight.js/highlight.min.js?v=11.11.2' });
    }
    for (const r of resources) {
      try {
        if (r.type === 'link') {
          createLink(r.id, r.href!);
        } else {
          await createScript(r.id, r.src!);
        }
      } catch {}
    }
  } catch {}
  return ((window as any).katex !== undefined) || ((window as any).hljs !== undefined);
}
let sideMemoPosition: 'left' | 'right' = 'right';
let sideMemoConnector: boolean = true;
function updateSideMemoPositionClass(position: 'left' | 'right'): void {
  document.body?.classList.remove('neo-sidememo-left', 'neo-sidememo-right');
  document.body?.classList.add(position === 'left' ? 'neo-sidememo-left' : 'neo-sidememo-right');
}
function removeSideMemoPositionClass(): void {
  document.body?.classList.remove('neo-sidememo-left', 'neo-sidememo-right');
}
function attachNoRightClick(el: HTMLElement): void {
  if (!el || el.dataset.neoNoRightClick) return;
  el.dataset.neoNoRightClick = '1';
  const stopAll = (ev: Event) => {
    if (ev.type === 'contextmenu') {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    const me = ev as MouseEvent;
    if (typeof me.button === 'number' && me.button === 2) {
      me.preventDefault();
      me.stopPropagation();
    }
  };
  el.addEventListener('contextmenu', stopAll, { capture: true, passive: false });
  el.addEventListener('mousedown', stopAll, { capture: true, passive: false });
  el.addEventListener('mouseup', stopAll, { capture: true, passive: false });
}
function findBreadcrumb(protyleContent: HTMLElement): HTMLElement | null {
  const protyle = protyleContent.closest('.protyle');
  return protyle ? protyle.querySelector<HTMLElement>('.protyle-breadcrumb') : null;
}
function syncBreadcrumbButton(protyleContent: HTMLElement, show: boolean): void {
  try {
    const breadcrumb = findBreadcrumb(protyleContent);
    if (!breadcrumb) return;
    const existingBtn = breadcrumb.querySelector<HTMLElement>('.neo-sidememo-btn');
    if (!show) {
      if (existingBtn) existingBtn.remove();
      return;
    }
    if (existingBtn) return;
    const space = breadcrumb.querySelector<HTMLElement>('.protyle-breadcrumb__space');
    if (!space) return;
    const btn = document.createElement('button');
    btn.className = 'block__icon fn__flex-center ariaLabel neo-sidememo-btn neo-sidememo-btn-active';
    const i18n = getPlugin()?.i18n || {};
    btn.setAttribute('aria-label', i18n.sideMemo);
    btn.innerHTML = '<svg><use xlink:href="#iconM"></use></svg>';
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      const currentlyHidden = !btn.classList.contains('neo-sidememo-btn-active');
      if (currentlyHidden) {
        btn.classList.add('neo-sidememo-btn-active');
      } else {
        btn.classList.remove('neo-sidememo-btn-active');
      }
      syncSidememoState();
      if (currentlyHidden) {
        setTimeout(() => { try { syncSidememoState(); } catch {} }, 500);
      }
    });
    space.after(btn);
  } catch {}
}
function syncSidememoState(): void {
  const htmlEl = document.documentElement;
  const isActive = !!(htmlEl && htmlEl.classList.contains('neo-extension-sidememo'));
  const protyleContents = Array.from(document.querySelectorAll<HTMLElement>('.protyle-content'));
  protyleContents.forEach((el) => {
    try {
      const hasInlineOrBlockMemo = hasMemoInWysiwyg(el);
      const hasTitle = el.querySelector('.protyle-title:not(.fn__none)') !== null;
      const breadcrumb = findBreadcrumb(el);
      const btn = breadcrumb?.querySelector<HTMLElement>('.neo-sidememo-btn');
      const manuallyHidden = !!(btn && !btn.classList.contains('neo-sidememo-btn-active'));
      if (isActive && hasInlineOrBlockMemo && hasTitle && !manuallyHidden) {
        el.classList.add('neo-sidememo-protyle');
        syncBreadcrumbButton(el, true);
      } else if (isActive && hasInlineOrBlockMemo && hasTitle && manuallyHidden) {
        el.classList.remove('neo-sidememo-protyle');
        syncBreadcrumbButton(el, true);
      } else {
        el.classList.remove('neo-sidememo-protyle');
        syncBreadcrumbButton(el, false);
      }
    } catch {}
  });
  if (isActive) {
    refreshSidememoContainers();
  } else {
    try {
      const leftover = Array.from(document.querySelectorAll<HTMLElement>('.neo-sidememo-container'));
      leftover.forEach((c) => { try { c.remove(); } catch {} });
    } catch {}
  }
}
async function refreshSidememoContainers(): Promise<void> {
  const titleElements = Array.from(
    document.querySelectorAll<HTMLElement>('.neo-sidememo-protyle .protyle-top .protyle-title'),
  );
  for (const titleEl of titleElements) {
    try {
      let container = titleEl.querySelector<HTMLElement>('.neo-sidememo-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'neo-sidememo-container protyle-custom b3-typography';
        titleEl.appendChild(container);
      }
      const protyleContent = titleEl.closest('.protyle-content') as HTMLElement | null;
      if (protyleContent) {
        await populateSidememoContainer(container, protyleContent);
        try { attachNoRightClick(container); } catch {}
      }
    } catch {}
  }
  const allContainers = Array.from(
    document.querySelectorAll<HTMLElement>('.protyle-top .protyle-title > .neo-sidememo-container'),
  );
  allContainers.forEach((container) => {
    const titleParent = container.parentElement;
    if (!titleParent) return;
    if (!titleParent.closest('.neo-sidememo-protyle')) {
      try { container.remove(); } catch {}
    } else {
      try { attachNoRightClick(container); } catch {}
    }
  });
}
async function populateSidememoContainer(container: HTMLElement, protyleContent: HTMLElement): Promise<void> {
  const existingMemoEls = queryMemoElementsInWysiwyg(protyleContent);
  existingMemoEls.forEach((m) => {
    try {
      const handlers = _sidememoState.get(m);
      if (handlers) {
        if (handlers.enter) m.removeEventListener('mouseenter', handlers.enter);
        if (handlers.leave) m.removeEventListener('mouseleave', handlers.leave);
        _sidememoState.delete(m);
      }
    } catch {}
  });
  try {
    const titleMemoAttr = container.closest('.protyle-top')?.querySelector<HTMLElement>('.protyle-title .protyle-attr--memo');
    if (titleMemoAttr) {
      const handlers = _sidememoState.get(titleMemoAttr);
      if (handlers) {
        if (handlers.enter) titleMemoAttr.removeEventListener('mouseenter', handlers.enter);
        if (handlers.leave) titleMemoAttr.removeEventListener('mouseleave', handlers.leave);
        _sidememoState.delete(titleMemoAttr);
      }
      titleMemoAttr.removeAttribute('neo-sidememo-highlight');
    }
  } catch {}
  while (container.firstChild) {
    const child = container.firstChild as HTMLElement;
    try {
      const handlers = _sidememoState.get(child);
      if (handlers) {
        if (handlers.enter) child.removeEventListener('mouseenter', handlers.enter);
        if (handlers.leave) child.removeEventListener('mouseleave', handlers.leave);
        if (handlers.click) child.removeEventListener('click', handlers.click);
        if (handlers.mousedown) child.removeEventListener('mousedown', handlers.mousedown);
        if (handlers._preMove) document.removeEventListener('mousemove', handlers._preMove);
        if (handlers._preUp) document.removeEventListener('mouseup', handlers._preUp);
        if (handlers._dragMove) document.removeEventListener('mousemove', handlers._dragMove);
        if (handlers._dragUp) document.removeEventListener('mouseup', handlers._dragUp);
        if (handlers._timer) clearTimeout(handlers._timer);
        try {
          if (handlers._neoContainer) handlers._neoContainer.classList.remove('neo-sidememo-container-resize');
          if (handlers._neoParent) handlers._neoParent.classList.remove('neo-sidememo-container-resize');
        } catch {}
        _sidememoState.delete(child);
      }
    } catch {}
    container.removeChild(child);
  }
  const memoElements = queryMemoElementsInWysiwyg(protyleContent);
  const items: Array<{
    el: HTMLElement;
    top: number;
    height: number;
    uid?: string;
    sourceEl?: HTMLElement;
    sourceEls?: HTMLElement[];
    index?: number;
    type: 'inline' | 'block' | 'file';
  }> = [];
  const inlineMemoElements = memoElements.filter(memoEl =>
    memoEl.hasAttribute('data-type') &&
    memoEl.getAttribute('data-type')?.split(/\s+/).includes('inline-memo')
  );
  const processedInlineMemos = new Set<HTMLElement>();
  const mergedInlineMemos: Array<{ elements: HTMLElement[]; content: string }> = [];
  inlineMemoElements.forEach((memoEl, index) => {
    if (processedInlineMemos.has(memoEl)) return;
    const content = memoEl.getAttribute('data-inline-memo-content') || '';
    const group: HTMLElement[] = [memoEl];
    processedInlineMemos.add(memoEl);
    for (let i = index + 1; i < inlineMemoElements.length; i++) {
      const nextMemo = inlineMemoElements[i];
      if (processedInlineMemos.has(nextMemo)) continue;
      const nextContent = nextMemo.getAttribute('data-inline-memo-content') || '';
      if (content === nextContent && areConsecutiveSiblings(group[group.length - 1], nextMemo)) {
        group.push(nextMemo);
        processedInlineMemos.add(nextMemo);
      } else {
        break;
      }
    }
    mergedInlineMemos.push({ elements: group, content });
  });
  const blockMemoElements = memoElements.filter(memoEl => memoEl.hasAttribute('memo') && !memoEl.classList.contains('protyle-wysiwyg'));
  const fileMemoElements = memoElements.filter(memoEl => memoEl.hasAttribute('memo') && memoEl.classList.contains('protyle-wysiwyg'));
  const allMemoGroups: Array<{ elements?: HTMLElement[]; content?: string; el?: HTMLElement }> = [
    ...mergedInlineMemos.map(g => ({ elements: g.elements, content: g.content })),
    ...blockMemoElements.map(el => ({ el })),
    ...fileMemoElements.map(el => ({ el })),
  ];
  allMemoGroups.sort((a, b) => {
    const aNode = a.elements?.[0] ?? a.el!;
    const bNode = b.elements?.[0] ?? b.el!;
    const position = aNode.compareDocumentPosition(bNode);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
  allMemoGroups.forEach((memoGroup, groupIndex) => {
    try {
      const isInline = !!memoGroup.elements;
      let memoEl: HTMLElement;
      let titleText: string;
      let contentText: string;
      let sourceEls: HTMLElement[];
      let type: 'inline' | 'block' | 'file';
      if (isInline) {
        const { elements, content } = memoGroup as { elements: HTMLElement[]; content: string };
        memoEl = elements[0];
        titleText = elements.map(el => (el.textContent || '').trim()).join('');
        contentText = content;
        sourceEls = elements;
        type = 'inline';
      } else {
        memoEl = memoGroup.el!;
        const isFileMemo = memoEl.classList.contains('protyle-wysiwyg');
        contentText = memoEl.getAttribute('memo') || '';
        sourceEls = [memoEl];
        type = isFileMemo ? 'file' : 'block';
        if (isFileMemo) {
          titleText = '';
          try {
            const protyleEl = memoEl.closest('.protyle');
            const protyleTop = protyleEl ? protyleEl.querySelector<HTMLElement>('.protyle-top') : null;
            if (protyleTop) {
              const titleInput = protyleTop.querySelector<HTMLElement>('.protyle-title .protyle-title__input');
              if (titleInput) titleText = (titleInput.textContent || '').trim();
            }
          } catch {}
          if (!titleText) titleText = (memoEl.textContent || '').trim();
        } else {
          titleText = (memoEl.textContent || '').trim();
        }
      }
      const uid = (isInline ? getUidFromElement(memoEl) : null) || ensureMemoUid(memoEl);
      if (isInline) sourceEls.forEach(el => { try { setUidToElement(el, uid); } catch {} });
      const top = calcMemoTop(memoEl, container, protyleContent);
      const prefix = `neo-sidememo-${type === 'inline' ? 'inlinememo' : type === 'file' ? 'filememo' : 'blockmemo'}`;
      const item = createMemoItem({
        className: `${prefix}-item`,
        titleClassName: `${prefix}-item-title`,
        contentClassName: `${prefix}-item-content`,
        titleText,
        contentText,
        top,
        uid,
        sourceEls,
        type,
      });
      items.push({ el: item, top, height: 0, uid, sourceEls, sourceEl: sourceEls[0], index: groupIndex, type });
    } catch {}
  });
  const frag = document.createDocumentFragment();
  items.forEach((it) => frag.appendChild(it.el));
  container.appendChild(frag);
  renderKatexInContainer(container);
  items.forEach((it) => {
    try {
      it.height = Math.ceil(it.el.getBoundingClientRect().height);
    } catch {
      it.height = 0;
    }
  });
  const GAP = 8;
  let cursor = 0;
  items.forEach((it) => {
    const desiredTop = Math.max(0, it.top);
    const finalTop = Math.max(desiredTop, cursor);
    it.el.style.top = `${finalTop}px`;
    cursor = finalTop + it.height + GAP;
  });
  const toggleTooltipMemoNoneFor = (relatedEl: HTMLElement | null, add: boolean) => {
    try {
      if (!relatedEl) return;
      const isInlineMemo = relatedEl.hasAttribute?.('data-type') && relatedEl.getAttribute('data-type')!.split(/\s+/).includes('inline-memo');
      if (!isInlineMemo) return;
      const protyleWysiwyg = relatedEl.closest('.protyle-wysiwyg') as HTMLElement | null;
      if (!protyleWysiwyg) return;
      const protyle = protyleWysiwyg.closest('.protyle');
      const protyleTop = protyle ? protyle.querySelector<HTMLElement>('.protyle-top') : null;
      if (!protyleTop) return;
      const neoParent = protyleWysiwyg.closest('.neo-sidememo-protyle') as HTMLElement | null;
      if (!neoParent) return;
      const tooltip = document.querySelector('.tooltip--memo#tooltip') as HTMLElement | null;
      if (!tooltip) return;
      try {
        if (add) tooltip.classList.add('neo-sidememo-tooltip-memo-none');
        else tooltip.classList.remove('neo-sidememo-tooltip-memo-none');
      } catch {}
    } catch {}
  };
  const findMemoIconElement = (memoEl: HTMLElement): HTMLElement | null => {
    try {
      return memoEl.querySelector<HTMLElement>('.protyle-attr .protyle-attr--memo');
    } catch {
      return null;
    }
  };
  items.forEach((it) => {
    try {
      const relatedEls = it.sourceEls || (it.sourceEl ? [it.sourceEl] : []);
      if (relatedEls.length === 0) return;
      const shouldDrawConnector = sideMemoConnector;
      const getConnectorAnchor = () => {
        if (it.type === 'block') return findMemoIconElement(relatedEls[0]);
        if (it.type === 'file') return container.closest('.protyle-top')?.querySelector<HTMLElement>('.protyle-title .protyle-attr--memo') ?? null;
        return relatedEls[0];
      };
      const onItemEnter = () => {
        relatedEls.forEach(el => el.setAttribute('neo-sidememo-highlight', ''));
        if (it.type === 'file') {
          const anchor = getConnectorAnchor();
          if (anchor) anchor.setAttribute('neo-sidememo-highlight', '');
        }
        if (shouldDrawConnector && relatedEls[0] && it.el) {
          const anchor = getConnectorAnchor();
          if (anchor) {
            drawConnector(anchor, it.el, container, it.type === 'file' ? 'top' : undefined);
          }
        }
      };
      const onItemLeave = () => {
        relatedEls.forEach(el => el.removeAttribute('neo-sidememo-highlight'));
        if (it.type === 'file') {
          const anchor = getConnectorAnchor();
          if (anchor) anchor.removeAttribute('neo-sidememo-highlight');
        }
        clearConnector(container);
      };
      const onMemoEnter = () => {
        if (it.type !== 'file') {
          it.el.setAttribute('neo-sidememo-highlight', '');
        }
        try { relatedEls.forEach(el => toggleTooltipMemoNoneFor(el, true)); } catch {}
        if (shouldDrawConnector && relatedEls[0] && it.el && it.type !== 'file') {
          const anchor = getConnectorAnchor();
          if (anchor) {
            if (it.type === 'block') anchor.setAttribute('neo-sidememo-highlight', '');
            drawConnector(anchor, it.el, container);
          }
        }
      };
      const onMemoLeave = () => {
        if (it.type !== 'file') {
          it.el.removeAttribute('neo-sidememo-highlight');
        }
        if (it.type === 'block') {
          const anchor = getConnectorAnchor();
          if (anchor) anchor.removeAttribute('neo-sidememo-highlight');
        }
        try { relatedEls.forEach(el => toggleTooltipMemoNoneFor(el, false)); } catch {}
        if (it.type !== 'file') {
          clearConnector(container);
        }
      };
      it.el.addEventListener('mouseenter', onItemEnter);
      it.el.addEventListener('mouseleave', onItemLeave);
      relatedEls.forEach(related => {
        related.addEventListener('mouseenter', onMemoEnter);
        related.addEventListener('mouseleave', onMemoLeave);
      });
      if (it.type === 'file') {
        const titleMemoAttr = container.closest('.protyle-top')?.querySelector<HTMLElement>('.protyle-title .protyle-attr--memo');
        if (titleMemoAttr) {
          try {
            const old = _sidememoState.get(titleMemoAttr);
            if (old) {
              if (old.enter) titleMemoAttr.removeEventListener('mouseenter', old.enter);
              if (old.leave) titleMemoAttr.removeEventListener('mouseleave', old.leave);
            }
          } catch {}
          const onTitleMemoEnter = () => {
            it.el.setAttribute('neo-sidememo-highlight', '');
            if (shouldDrawConnector && it.el) {
              titleMemoAttr.setAttribute('neo-sidememo-highlight', '');
              drawConnector(titleMemoAttr, it.el, container, 'top');
            }
          };
          const onTitleMemoLeave = () => {
            it.el.removeAttribute('neo-sidememo-highlight');
            titleMemoAttr.removeAttribute('neo-sidememo-highlight');
            clearConnector(container);
          };
          titleMemoAttr.addEventListener('mouseenter', onTitleMemoEnter);
          titleMemoAttr.addEventListener('mouseleave', onTitleMemoLeave);
          _sidememoState.set(titleMemoAttr, { enter: onTitleMemoEnter, leave: onTitleMemoLeave });
        }
      }
      const onItemMouseDown = (startEvent: MouseEvent) => {
        if (startEvent.button !== 0) return;
        let lastClientX = startEvent.clientX;
        let lastClientY = startEvent.clientY;
        const preMove = (moveEv: MouseEvent) => {
          lastClientX = moveEv.clientX;
          lastClientY = moveEv.clientY;
          if (Math.abs(moveEv.clientX - startEvent.clientX) > 6 || Math.abs(moveEv.clientY - startEvent.clientY) > 6) {
            const h = _sidememoState.get(it.el);
            if (h?._timer) { clearTimeout(h._timer); h._timer = null; }
            document.removeEventListener('mousemove', preMove);
            document.removeEventListener('mouseup', cancelBefore);
          }
        };
        const cancelBefore = () => {
          const h = _sidememoState.get(it.el);
          if (h?._timer) { clearTimeout(h._timer); h._timer = null; }
          document.removeEventListener('mousemove', preMove);
          document.removeEventListener('mouseup', cancelBefore);
        };
        document.addEventListener('mousemove', preMove);
        document.addEventListener('mouseup', cancelBefore);
        const timerId = window.setTimeout(() => {
          document.removeEventListener('mousemove', preMove);
          document.removeEventListener('mouseup', cancelBefore);
          const startX = lastClientX;
          const neoParent = relatedEls[0]?.closest('.neo-sidememo-protyle') as HTMLElement | null;
          if (!neoParent) return;
          const containerEl = container;
          try { containerEl.classList.add('neo-sidememo-container-resize'); } catch {}
          clearConnector(container);
          const widthStr = getComputedStyle(neoParent).getPropertyValue('--neo-sidememo-container-width') || '';
          const initialWidth = Math.max(50, Math.min(600, Math.round(parseFloat(widthStr) || 200)));
          const isLeftPosition = sideMemoPosition === 'left';
          let _dragRafId: number | null = null;
          let _pendingWidth: number | null = null;
          const dragMove = (mv: MouseEvent) => {
            try {
              const delta = startX - mv.clientX;
              const computed = Math.round(initialWidth + (isLeftPosition ? -delta : delta));
              const clamped = Math.max(50, Math.min(600, computed));
              _pendingWidth = clamped;
              if (_dragRafId === null) {
                _dragRafId = requestAnimationFrame(() => {
                  try { if (_pendingWidth !== null) neoParent.style.setProperty('--neo-sidememo-container-width', `${_pendingWidth}px`); } catch {}
                  _dragRafId = null; _pendingWidth = null;
                });
              }
            } catch {}
          };
          const dragUp = () => {
            try {
              document.removeEventListener('mousemove', dragMove);
              document.removeEventListener('mouseup', dragUp);
            } catch {}
            try { if (_dragRafId !== null) { cancelAnimationFrame(_dragRafId); _dragRafId = null; _pendingWidth = null; } } catch {}
            const handlers = _sidememoState.get(it.el);
            if (handlers) {
              try {
                if (handlers._neoContainer) handlers._neoContainer.classList.remove('neo-sidememo-container-resize');
                if (handlers._neoParent) handlers._neoParent.classList.remove('neo-sidememo-container-resize');
              } catch {}
              handlers._dragMove = null;
              handlers._dragUp = null;
              handlers._neoParent = null;
              handlers._neoContainer = null;
            }
            try {
              setTimeout(() => { syncSidememoState(); }, 200);
            } catch {}
          };
          const handlers = _sidememoState.get(it.el) || {};
          handlers._dragMove = dragMove;
          handlers._dragUp = dragUp;
          handlers._neoParent = neoParent;
          handlers._neoContainer = containerEl;
          _sidememoState.set(it.el, handlers);
          document.addEventListener('mousemove', dragMove);
          document.addEventListener('mouseup', dragUp);
        }, 300);
        const handlers = _sidememoState.get(it.el) || {};
        handlers._preMove = preMove;
        handlers._preUp = cancelBefore;
        handlers._timer = timerId;
        _sidememoState.set(it.el, handlers);
      };
      try {
        const titleEl = it.el.querySelector<HTMLElement>(
          '.neo-sidememo-inlinememo-item-title, .neo-sidememo-blockmemo-item-title, .neo-sidememo-filememo-item-title',
        );
        let onTitleLeftClick: ((ev: MouseEvent) => void) | undefined;
        if (titleEl) {
          onTitleLeftClick = (ev: MouseEvent) => {
            try { ev.preventDefault(); ev.stopPropagation(); } catch {}
            try {
              if (relatedEls.some(el => el.closest('.av__gallery-content'))) {
                showGalleryMemoTip();
                return;
              }
              if (relatedEls.some(el => el.closest('.render-node[data-type="NodeBlockQueryEmbed"]'))) {
                showEmbedMemoTip();
                return;
              }
              if (it.type === 'file') {
                const firstRelated = relatedEls[0];
                try {
                  const protyleEl = firstRelated.closest('.protyle');
                  const protyleTop = protyleEl ? protyleEl.querySelector<HTMLElement>('.protyle-top') : null;
                  if (protyleTop) {
                    const memoAttr = protyleTop.querySelector<HTMLElement>('.protyle-title .protyle-attr--memo');
                    if (memoAttr) {
                      memoAttr.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, button: 0 }));
                      return;
                    }
                  }
                } catch {}
              }
              const firstRelated = relatedEls[0];
              const isMergedInlineMemo = relatedEls.length > 1;
              if (firstRelated?.hasAttribute?.('memo')) {
                let targetEl: HTMLElement | null = null;
                try {
                  const protyleAttr = firstRelated.querySelector<HTMLElement>(':scope > .protyle-attr');
                  if (protyleAttr) targetEl = protyleAttr.querySelector<HTMLElement>('.protyle-attr--memo');
                } catch { targetEl = null; }
                const rect = (targetEl ?? firstRelated).getBoundingClientRect();
                const clickEvent = new MouseEvent('click', {
                  bubbles: true, cancelable: true, view: window, button: 0,
                  clientX: Math.round(rect.left + rect.width / 2),
                  clientY: Math.round(rect.top + rect.height / 2),
                });
                try { (targetEl ?? firstRelated).dispatchEvent(clickEvent); } catch {}
              } else if (isMergedInlineMemo) {
                showMergeMemoTip();
              } else {
                const targetRect = firstRelated.getBoundingClientRect();
                const ctxEvent = new MouseEvent('contextmenu', {
                  bubbles: true, cancelable: true, view: window, button: 2,
                  clientX: Math.round(targetRect.left + targetRect.width / 2),
                  clientY: Math.round(targetRect.top + targetRect.height / 2),
                });
                try { firstRelated.dispatchEvent(ctxEvent); } catch {}
              }
            } catch {}
          };
          titleEl.addEventListener('click', onTitleLeftClick);
        }
        const prev = _sidememoState.get(it.el) || {};
        const merged = Object.assign(prev, {
          enter: onItemEnter, leave: onItemLeave,
          ...(onTitleLeftClick ? { click: onTitleLeftClick } : {}),
          mousedown: onItemMouseDown,
        });
        _sidememoState.set(it.el, merged);
        it.el.addEventListener('mousedown', onItemMouseDown);
      } catch {}
      try {
        relatedEls.forEach(related => {
          _sidememoState.set(related, { enter: onMemoEnter, leave: onMemoLeave });
        });
      } catch {}
    } catch {}
  });
}
function showMergeMemoTip(): void {
  try {
    const plugin = getPlugin();
    if (!plugin) return;
    fetchPost('/api/notification/pushMsg', {
      msg: plugin.i18n?.mergedSideMemoEditTip || '',
      timeout: 3000
    }, () => {});
  } catch {}
}
function showGalleryMemoTip(): void {
  try {
    const plugin = getPlugin();
    if (!plugin) return;
    fetchPost('/api/notification/pushMsg', {
      msg: plugin.i18n?.galleryMemoEditTip || '',
      timeout: 3000
    }, () => {});
  } catch {}
}
function showEmbedMemoTip(): void {
  try {
    const plugin = getPlugin();
    if (!plugin) return;
    fetchPost('/api/notification/pushMsg', {
      msg: plugin.i18n?.embedMemoEditTip || '',
      timeout: 3000
    }, () => {});
  } catch {}
}
export function cleanupSideMemo(): void {
  try {
    if (_rafId !== null) {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
    if (_scrollHandler) {
      document.removeEventListener('scroll', _scrollHandler, true);
      _scrollHandler = null;
    }
    _connectorState = null;
    document.querySelectorAll('.neo-sidememo-connector').forEach(el => {
      try { el.remove(); } catch {}
    });
  } catch {}
  try {
    const containers = Array.from(document.querySelectorAll<HTMLElement>('.neo-sidememo-container'));
    containers.forEach((container) => {
      try {
        Array.from(container.children).forEach((child) => {
          const htmlChild = child as HTMLElement;
          try {
            const handlers = _sidememoState.get(htmlChild);
            if (handlers) {
              if (handlers.enter) htmlChild.removeEventListener('mouseenter', handlers.enter);
              if (handlers.leave) htmlChild.removeEventListener('mouseleave', handlers.leave);
              if (handlers.click) htmlChild.removeEventListener('click', handlers.click);
              if (handlers.mousedown) htmlChild.removeEventListener('mousedown', handlers.mousedown);
              if (handlers._preMove) document.removeEventListener('mousemove', handlers._preMove);
              if (handlers._preUp) document.removeEventListener('mouseup', handlers._preUp);
              if (handlers._dragMove) document.removeEventListener('mousemove', handlers._dragMove);
              if (handlers._dragUp) document.removeEventListener('mouseup', handlers._dragUp);
              if (handlers._timer) clearTimeout(handlers._timer);
              try { if (handlers._neoContainer) handlers._neoContainer.classList.remove('neo-sidememo-container-resize'); } catch {}
              try { if (handlers._neoParent) handlers._neoParent.classList.remove('neo-sidememo-container-resize'); } catch {}
              _sidememoState.delete(htmlChild);
            }
          } catch {}
        });
        try { container.remove(); } catch {}
      } catch {}
    });
    document.querySelectorAll<HTMLElement>('.protyle-title .protyle-attr--memo').forEach((attr) => {
      try {
        const handlers = _sidememoState.get(attr);
        if (handlers) {
          if (handlers.enter) attr.removeEventListener('mouseenter', handlers.enter);
          if (handlers.leave) attr.removeEventListener('mouseleave', handlers.leave);
          _sidememoState.delete(attr);
        }
        attr.removeAttribute('neo-sidememo-highlight');
      } catch {}
    });
    const protyles = Array.from(document.querySelectorAll<HTMLElement>('.protyle-content'));
    protyles.forEach((el) => {
      try {
        el.classList.remove('neo-sidememo-protyle');
        const memos = queryMemoElementsInWysiwyg(el);
        memos.forEach((m) => {
          try {
            const handlers = _sidememoState.get(m);
            if (handlers) {
              if (handlers.enter) m.removeEventListener('mouseenter', handlers.enter);
              if (handlers.leave) m.removeEventListener('mouseleave', handlers.leave);
              _sidememoState.delete(m);
            }
            try {
              const uid = getUidFromElement(m);
              if (uid) removeUidFromElement(m, uid);
            } catch {}
            try { m.removeAttribute('neo-sidememo-highlight'); } catch {}
          } catch {}
        });
      } catch {}
    });
    document.querySelectorAll('.neo-sidememo-container-resize').forEach(el => {
      try { (el as HTMLElement).classList.remove('neo-sidememo-container-resize'); } catch {}
    });
    document.querySelectorAll('.neo-sidememo-protyle').forEach(el => {
      try {
        (el as HTMLElement).style.removeProperty('--neo-sidememo-container-width');
        (el as HTMLElement).classList.remove('neo-sidememo-protyle');
      } catch {}
    });
    document.querySelectorAll('.neo-sidememo-btn').forEach(el => {
      try { el.remove(); } catch {}
    });
    document.querySelectorAll('.tooltip--memo#tooltip').forEach(el => {
      try { (el as HTMLElement).classList.remove('neo-sidememo-tooltip-memo-none'); } catch {}
    });
  } catch {}
}
export function onSideMemoClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-extension-sidememo');
  const plugin = getPlugin();
  if (!plugin) return;
  if (isActive) {
    saveConfig({ 'sidememo': false } as Partial<Config>);
    destroySideMemo();
  } else {
    _destroyed = false;
    ensureCss('extension-sidememo', featureCss['extension-sidememo']);
    htmlEl.classList.add('neo-extension-sidememo');
    saveConfig({ 'sidememo': true } as Partial<Config>);
    initSidememoRely();
    const position = sideMemoPosition || 'right';
    updateSideMemoPositionClass(position);
    syncSidememoState();
    _fetchListener.attach();
  }
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const positionOptions = ['right', 'left']
    .map(v => `<option value="${v}">${i18n[`sidememoPosition${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.sidememoPosition}</div>
              <div class="b3-label__text">${i18n.sidememoPositionTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-sidememo-position">
              ${positionOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.sidememoConnector}</div>
              <div class="b3-label__text">${i18n.sidememoConnectorTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-sidememo-connector" type="checkbox"${sideMemoConnector ? ' checked' : ''}>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-sidememo-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-sidememo-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showSideMemoSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.sidememoSettings,
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const positionSelect = dialog.element.querySelector('#neo-sidememo-position') as HTMLSelectElement;
  const connectorSwitch = dialog.element.querySelector('#neo-sidememo-connector') as HTMLInputElement;
  if (positionSelect) positionSelect.value = sideMemoPosition;
  if (connectorSwitch) connectorSwitch.checked = sideMemoConnector;
  dialog.element.querySelector('#neo-sidememo-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-sidememo-confirm')?.addEventListener('click', () => {
    const newPosition = (positionSelect?.value || 'right') as 'left' | 'right';
    const newConnector = connectorSwitch ? connectorSwitch.checked : false;
    sideMemoPosition = newPosition;
    sideMemoConnector = newConnector;
    saveConfig({
      'sidememo-position': newPosition,
      'sidememo-connector': newConnector,
    } as Partial<Config>);
    const isActive = document.documentElement.classList.contains('neo-extension-sidememo');
    if (isActive) {
      updateSideMemoPositionClass(sideMemoPosition);
      syncSidememoState();
    }
    dialog.destroy();
  });
}
export function initSideMemo(): void {
  if (isMobile()) return;
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    const savedPosition = (config?.['sidememo-position'] as 'left' | 'right') || 'right';
    const savedConnector = config?.['sidememo-connector'] !== false;
    sideMemoPosition = savedPosition;
    sideMemoConnector = savedConnector;
    if (config?.['sidememo'] === true) {
      _destroyed = false;
      ensureCss('extension-sidememo', featureCss['extension-sidememo']);
      document.documentElement.classList.add('neo-extension-sidememo');
      updateSideMemoPositionClass(savedPosition);
      initSidememoRely();
      syncSidememoState();
      _fetchListener.attach();
    }
  });
}
export function destroySideMemo(): void {
  removeCss('extension-sidememo');
  _destroyed = true;
  _rafPending = false;
  _lute = null;
  if (_debounceTimer !== null) {
    clearTimeout(_debounceTimer);
    _debounceTimer = null;
  }
  _fetchListener.detach();
  cleanupSideMemo();
  removeSideMemoPositionClass();
  const htmlEl = document.documentElement;
  if (htmlEl) {
    htmlEl.classList.remove('neo-extension-sidememo');
  }
}
