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
      cssMatch: (c) => true,
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.annotationLayer .richText') && s.includes('> *'),
      cssMatch: (c) => true,
    },
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('hljs') && s.includes('::selection'),
      cssMatch: (c) => true,
    },
    dynamic: true,
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.katex *'),
      cssMatch: (c) => true,
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
      cssMatch: (c) => true,
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
function processAllRules(
  rules: CSSRuleList,
  entries: RuleFilterEntry[],
  parentRule: CSSRule | null,
  mediaContext: Map<RuleFilterEntry, boolean> | null,
): void {
  for (let j = 0; j < rules.length; j++) {
    const rule = rules[j];
    if (rule instanceof CSSMediaRule) {
      const childContext = new Map<RuleFilterEntry, boolean>();
      for (const entry of entries) {
        const parentMatch = mediaContext?.get(entry) ?? true;
        const selfMatch = entry.filter.mediaMatch?.(rule.conditionText) ?? true;
        childContext.set(entry, parentMatch && selfMatch);
      }
      processAllRules(rule.cssRules, entries, rule, childContext);
    } else if (rule instanceof CSSStyleRule) {
      for (const entry of entries) {
        const inMatchingMedia = mediaContext?.get(entry) ?? true;
        if (parentRule instanceof CSSMediaRule && !inMatchingMedia) {
          continue;
        }
        if (rule.selectorText && entry.filter.selectorMatch(rule.selectorText)) {
          if (entry.filter.cssMatch(rule.cssText)) {
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
  }
}
function removeMatchingRules(entries?: RuleFilterEntry[]): void {
  const targets = entries ?? _ruleFilters;
  for (let i = 0; i < document.styleSheets.length; i++) {
    const ss = document.styleSheets[i];
    const ownerNode = ss.ownerNode as HTMLElement | null;
    if (ownerNode && (ownerNode.dataset.neoCss || ownerNode.id === 'themeStyle')) {
      continue;
    }
    try {
      processAllRules(ss.cssRules, targets, null, null);
    } catch {}
  }
}
const _fetchListener = fetchListener();
_fetchListener.onNotify('setUILayout', () => {
  const dynamicEntries = _ruleFilters.filter((e) => e.dynamic);
  if (dynamicEntries.length > 0) {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => removeMatchingRules(dynamicEntries));
    } else {
      setTimeout(() => removeMatchingRules(dynamicEntries), 0);
    }
  }
});
export function initPerformanceTuning(): void {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => removeMatchingRules());
  } else {
    setTimeout(() => removeMatchingRules(), 0);
  }
  _fetchListener.attach();
}
export function destroyPerformanceTuning(): void {
  _fetchListener.detach();
}
