import { fetchListener } from './fetchmonitor';
interface StyleRuleFilter {
  selectorMatch: (selector: string) => boolean;
  cssMatch: (cssText: string) => boolean;
  mediaMatch?: (conditionText: string) => boolean;
}
interface RuleFilterEntry {
  filter: StyleRuleFilter;
  dynamic?: boolean;
}
type ScanScope = 'all' | 'dynamic';
interface ScheduledScan {
  id: number;
  kind: 'idle' | 'timeout';
}
const _ruleFilters: RuleFilterEntry[] = [
  {
    filter: {
      selectorMatch: (s) => s.includes('::selection'),
      cssMatch: () => true,
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.xfaLeft') || s.includes('.xfaRight'),
      cssMatch: (c) => c.includes('max-height: 100%'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.av__gallery-content') && s.includes('~ div'),
      cssMatch: (c) => c.includes('content: ""'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.xfaTop') || s.includes('.xfaBottom'),
      cssMatch: (c) => c.includes('width: 100%'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.xfaTop') || s.includes('.xfaBottom'),
      cssMatch: (c) => c.includes('flex: 0 1 auto'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.xfaNonInteractive') || s.includes('.xfaDisabled') || s.includes('.xfaReadOnly'),
      cssMatch: (c) => c.includes('background: initial'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('#documentPropertiesOverlay .row > *'),
      cssMatch: (c) => c.includes('min-width: 100px'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('#documentPropertiesOverlay .row > *'),
      cssMatch: (c) => c.includes('text-align: left'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.rect-to-annotation') && s.includes(':not'),
      cssMatch: (c) => c.includes('cursor: inherit'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.grab-to-pan-grab') && s.includes(':not'),
      cssMatch: (c) => c.includes('cursor: inherit'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.xfaLayer *') && !s.includes(':required'),
      cssMatch: (c) => c.includes('color: inherit') && c.includes('font: inherit'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.xfaLayer *:required') || s.includes('.xfaLayer :required'),
      cssMatch: () => true,
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.annotationLayer .textWidgetAnnotation') && s.includes(':is('),
      cssMatch: () => true,
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.annotationLayer .richText') && s.includes('> *'),
      cssMatch: () => true,
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('hljs') && s.includes('::selection'),
      cssMatch: () => true,
    },
    dynamic: true,
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.katex *'),
      cssMatch: () => true,
    },
    dynamic: true,
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.pdfPresentationMode.pdfPresentationModeControls') && s.includes('> *'),
      cssMatch: (c) => c.includes('cursor: default'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.pdfPresentationMode.pdfPresentationModeControls .textLayer span'),
      cssMatch: (c) => c.includes('cursor: default'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.annotationLayer .popup') && s.includes('*'),
      cssMatch: () => true,
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('#dialogContainer') && s.includes('.row') && s.includes('*'),
      cssMatch: () => true,
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.b3-menu__item') && s.includes('[disabled') && s.includes(':not(.b3-menu__submenu)'),
      cssMatch: (c) => c.includes('opacity'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.file-tree') && s.includes('.sy__file--disablehover') && s.includes('.b3-list-item') && s.includes('*'),
      cssMatch: (c) => c.includes('pointer-events: none'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.xfaLayer'),
      cssMatch: (c) => c.includes('pointer-events: none'),
    },
  },
  {
    filter: {
      mediaMatch: (c) => c.includes('forced-colors'),
      selectorMatch: (s) => s.includes(':root') || s.includes('.xfaLayer :required'),
      cssMatch: (c) => c.includes('--xfa-focus-outline') || c.includes('outline: selecteditem'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('#layersView') && s.includes('treeItem') && s.includes('a') && s.includes('>'),
      cssMatch: (c) => c.includes('cursor: pointer'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.spread') && s.includes(':is(') && s.includes('.page') && s.includes('.pdfViewer') && s.includes('.scrollHorizontal'),
      cssMatch: (c) => c.includes('vertical-align'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.toolbar') && s.includes(':not(#drag)'),
      cssMatch: (c) => c.includes('z-index: 7'),
    },
    dynamic: true,
  },
  {
    filter: {
      selectorMatch: (s) => /table\s+thead\s*>\s*tr:first-child/.test(s) || /table\s+tbody:last-of-type\s*>\s*tr:last-child/.test(s),
      cssMatch: (c) => c.includes('border-top-left-radius') || c.includes('border-top-right-radius') || c.includes('border-bottom-left-radius') || c.includes('border-bottom-right-radius'),
    },
  },
  {
    filter: {
      selectorMatch: (s) => /\.textLayer\s+:is\(span\s*,\s*br\)/.test(s),
      cssMatch: (c) => /white-space\s*:\s*pre/.test(c),
    },
  },
];
const _dynamicRuleFilters = _ruleFilters.filter((entry) => entry.dynamic);
let _performanceTuningActive = false;
let _pendingScanScope: ScanScope | null = null;
let _scheduledScan: ScheduledScan | null = null;
let _scanIterator: Generator<void> | null = null;
function* processAllRules(
  rules: CSSRuleList,
  entries: RuleFilterEntry[],
  parentRule: CSSRule | null,
  mediaContext: Map<RuleFilterEntry, boolean> | null,
): Generator<void> {
  for (let j = 0; j < rules.length; j++) {
    const rule = rules[j];
    if (rule instanceof CSSMediaRule) {
      const childContext = new Map<RuleFilterEntry, boolean>();
      for (const entry of entries) {
        const parentMatch = mediaContext?.get(entry) ?? true;
        const selfMatch = entry.filter.mediaMatch?.(rule.conditionText) ?? true;
        childContext.set(entry, parentMatch && selfMatch);
      }
      yield;
      yield* processAllRules(rule.cssRules, entries, rule, childContext);
    } else if (rule instanceof CSSStyleRule) {
      const selectorText = rule.selectorText;
      let cssText: string | null = null;
      for (const entry of entries) {
        const inMatchingMedia = mediaContext?.get(entry) ?? true;
        if (parentRule instanceof CSSMediaRule && !inMatchingMedia) {
          continue;
        }
        if (selectorText && entry.filter.selectorMatch(selectorText)) {
          cssText ??= rule.cssText;
          if (entry.filter.cssMatch(cssText)) {
            if (parentRule instanceof CSSMediaRule) {
              parentRule.deleteRule(j);
            } else {
              (rule.parentStyleSheet as CSSStyleSheet).deleteRule(j);
            }
            j--;
            break;
          }
        }
      }
    }
    yield;
  }
}
function* removeMatchingRules(entries?: RuleFilterEntry[]): Generator<void> {
  const targets = entries ?? _ruleFilters;
  for (const ss of Array.from(document.styleSheets)) {
    yield;
    const ownerNode = ss.ownerNode as HTMLElement | null;
    if (ownerNode && (ownerNode.dataset.neoCss || ownerNode.id === 'themeStyle')) {
      continue;
    }
    try {
      yield* processAllRules(ss.cssRules, targets, null, null);
    } catch {}
  }
}
function runScheduledScan(deadline?: IdleDeadline): void {
  _scheduledScan = null;
  if (!_performanceTuningActive) {
    return;
  }
  if (!_scanIterator) {
    const scope = _pendingScanScope;
    _pendingScanScope = null;
    if (scope === null) {
      return;
    }
    _scanIterator = removeMatchingRules(scope === 'all' ? undefined : _dynamicRuleFilters);
  }
  const startTime = performance.now();
  for (let count = 0; count < 200; count++) {
    if (count > 0 && (performance.now() - startTime >= 4 || (deadline && !deadline.didTimeout && deadline.timeRemaining() < 1))) {
      break;
    }
    if (_scanIterator.next().done) {
      _scanIterator = null;
      const delay = _pendingScanScope === null ? 5000 : 1000;
      _pendingScanScope ??= 'dynamic';
      queueScan(delay);
      return;
    }
  }
  queueScan();
}
function queueScan(delay = 0): void {
  if (_scheduledScan || !_performanceTuningActive) {
    return;
  }
  if (delay > 0) {
    _scheduledScan = {
      id: window.setTimeout(() => {
        _scheduledScan = null;
        queueScan();
      }, delay),
      kind: 'timeout',
    };
  } else if (typeof requestIdleCallback === 'function' && typeof cancelIdleCallback === 'function') {
    _scheduledScan = {
      id: requestIdleCallback(runScheduledScan, { timeout: 1000 }),
      kind: 'idle',
    };
  } else {
    _scheduledScan = {
      id: window.setTimeout(runScheduledScan, 16),
      kind: 'timeout',
    };
  }
}
function scheduleScan(scope: ScanScope): void {
  if (!_performanceTuningActive) {
    return;
  }
  if (scope === 'all' || _pendingScanScope === null) {
    _pendingScanScope = scope;
  }
  queueScan();
}
function cancelScheduledScan(): void {
  if (_scheduledScan?.kind === 'idle') {
    cancelIdleCallback(_scheduledScan.id);
  } else if (_scheduledScan) {
    window.clearTimeout(_scheduledScan.id);
  }
  _scheduledScan = null;
  _pendingScanScope = null;
  _scanIterator = null;
}
const _fetchListener = fetchListener();
_fetchListener.onNotify('setUILayout', () => {
  if (_dynamicRuleFilters.length > 0) {
    scheduleScan('dynamic');
  }
});
export function initPerformanceTuning(): void {
  _performanceTuningActive = true;
  scheduleScan('all');
  _fetchListener.attach();
}
export function destroyPerformanceTuning(): void {
  _performanceTuningActive = false;
  cancelScheduledScan();
  _fetchListener.detach();
}
