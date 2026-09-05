import { fetchListener } from '../modules/fetchmonitor';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { saveConfig, loadConfig, type Config } from '../main/data';
import { createNeoLifecycleGuard } from '../main/lifecycle';
const fetchMonitor = fetchListener();
const searchListSelectors = ['#searchList', '#searchAssetList', '#searchUnRefList'];
const settleInterval = 50;
const settleLimit = 10;
let featureActive = false;
let settleTimer: ReturnType<typeof setTimeout> | undefined;
let settlePassesLeft = 0;
function cancelSettleFallback(): void {
  if (settleTimer) {
    clearTimeout(settleTimer);
    settleTimer = undefined;
  }
  settlePassesLeft = 0;
}
function reconcileCardSearchListClass(): boolean {
  if (!featureActive) return true;
  let anyItem = false;
  try {
    const results = searchListSelectors
      .map(selector => document.querySelector(selector))
      .filter(Boolean);
    if (results.length === 0) return true;
    results.forEach(el => {
      try {
        const firstChild = (el as Element).firstElementChild;
        const isCard = firstChild
          ? firstChild.matches('[data-type="search-item"]')
          : false;
        (el as Element).classList.toggle('neo-cardsearchlist', isCard);
        if (isCard) anyItem = true;
      } catch {}
    });
  } catch {}
  return anyItem;
}
function scheduleSettlePass(): void {
  if (!featureActive || settlePassesLeft <= 0) return;
  settlePassesLeft--;
  settleTimer = setTimeout(() => {
    settleTimer = undefined;
    if (reconcileCardSearchListClass()) return;
    scheduleSettlePass();
  }, settleInterval);
}
function armSettleFallback(): void {
  if (!featureActive) return;
  if (settleTimer) {
    clearTimeout(settleTimer);
    settleTimer = undefined;
  }
  settlePassesLeft = settleLimit;
  scheduleSettlePass();
}
function onSearchActivity(): void {
  if (!featureActive) return;
  if (!reconcileCardSearchListClass()) {
    armSettleFallback();
  }
}
fetchMonitor.onNotify('fullTextSearchBlock', onSearchActivity);
fetchMonitor.onNotify('getCriteria', onSearchActivity);
fetchMonitor.onNotify('fullTextSearchAssetContent', onSearchActivity);
fetchMonitor.onNotify('getRecentUpdatedBlocks', onSearchActivity);
function enableCardSearchList(): void {
  if (featureActive) return;
  ensureCss('extension-cardsearchlist', featureCss['extension-cardsearchlist']);
  document.documentElement.classList.add('neo-cardsearchlist');
  featureActive = true;
  fetchMonitor.attach();
  onSearchActivity();
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
  cancelSettleFallback();
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
