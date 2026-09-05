import { fetchListener } from '../modules/fetchmonitor';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { saveConfig, loadConfig, type Config } from '../main/data';
import { createNeoLifecycleGuard } from '../main/lifecycle';
const fetchMonitor = fetchListener();
const searchListSelectors = ['#searchList', '#searchAssetList', '#searchUnRefList'];
let featureActive = false;
function updateCardSearchListClass(): void {
  try {
    const results = searchListSelectors
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
fetchMonitor.onNotify('fullTextSearchBlock', updateCardSearchListClass);
fetchMonitor.onNotify('getCriteria', updateCardSearchListClass);
fetchMonitor.onNotify('fullTextSearchAssetContent', updateCardSearchListClass);
fetchMonitor.onNotify('getRecentUpdatedBlocks', updateCardSearchListClass);
function enableCardSearchList(): void {
  if (featureActive) return;
  ensureCss('extension-cardsearchlist', featureCss['extension-cardsearchlist']);
  document.documentElement.classList.add('neo-cardsearchlist');
  featureActive = true;
  fetchMonitor.attach();
  requestAnimationFrame(() => {
    if (!featureActive) return;
    try { updateCardSearchListClass(); } catch {}
  });
}
export function initCardSearchList(): void {
  const isCurrent = createNeoLifecycleGuard();
  loadConfig().then((config) => {
    if (!isCurrent()) return;
    if (config['cardsearchlist'] === true) {
      enableCardSearchList();
    }
  });
}
export function onCardSearchListClick(): void {
  if (featureActive) {
    destroyCardSearchList();
    saveConfig({ 'cardsearchlist': false } as Partial<Config>);
  } else {
    enableCardSearchList();
    saveConfig({ 'cardsearchlist': true } as Partial<Config>);
  }
}
export function destroyCardSearchList(): void {
  featureActive = false;
  try {
    removeCss('extension-cardsearchlist');
    fetchMonitor.detach();
    document.documentElement?.classList.remove('neo-cardsearchlist');
    searchListSelectors.forEach(selector => {
      try {
        document.querySelector(selector)?.classList.remove('neo-cardsearchlist');
      } catch {}
    });
  } catch {}
}
