import { fetchListener } from '../modules/fetchmonitor';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { saveConfig, loadConfig, type Config } from '../main/data';
import { createNeoLifecycleGuard } from '../main/lifecycle';
const _fetchListener = fetchListener();
const _searchListSelectors = ['#searchList', '#searchAssetList', '#searchUnRefList'];
function updateCardSearchListClass(): void {
  try {
    const results = _searchListSelectors
      .map(selector => document.querySelector(selector))
      .filter(Boolean);
    if (results.length === 0) return;
    results.forEach(el => {
      try {
        const firstChild = (el as Element).firstElementChild;
        const isCard = firstChild
          ? firstChild.matches('[data-type="search-item"]')
          : false;
        (el as Element).classList.toggle('neo-cardsearchlist', isCard);
      } catch {}
    });
  } catch {}
}
_fetchListener.onNotify('fullTextSearchBlock', updateCardSearchListClass);
_fetchListener.onNotify('getCriteria', updateCardSearchListClass);
_fetchListener.onNotify('fullTextSearchAssetContent', updateCardSearchListClass);
_fetchListener.onNotify('getRecentUpdatedBlocks', updateCardSearchListClass);
export function initCardSearchList(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    if (config['card-searchlist'] === true) {
      ensureCss('visual-cardsearchlist', featureCss['visual-cardsearchlist']);
      document.documentElement.classList.add('neo-visual-cardsearchlist');
      _fetchListener.attach();
      requestAnimationFrame(() => {
        if (!isCurrent()) return;
        try { updateCardSearchListClass(); } catch {}
      });
    }
  });
}
export function onCardSearchListClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-visual-cardsearchlist');
  if (isActive) {
    destroyCardSearchList();
    saveConfig({ 'card-searchlist': false } as Partial<Config>);
  } else {
    ensureCss('visual-cardsearchlist', featureCss['visual-cardsearchlist']);
    htmlEl.classList.add('neo-visual-cardsearchlist');
    saveConfig({ 'card-searchlist': true } as Partial<Config>);
    _fetchListener.attach();
    requestAnimationFrame(() => {
      try { updateCardSearchListClass(); } catch {}
    });
  }
}
export function destroyCardSearchList(): void {
  try {
    removeCss('visual-cardsearchlist');
    _fetchListener.detach();
    document.documentElement?.classList.remove('neo-visual-cardsearchlist');
    _searchListSelectors.forEach(selector => {
      try {
        document.querySelector(selector)?.classList.remove('neo-cardsearchlist');
      } catch {}
    });
  } catch {}
}
