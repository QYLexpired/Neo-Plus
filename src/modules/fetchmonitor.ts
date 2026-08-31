type FetchCallback = (response: Response, url: string, init?: RequestInit) => void;
let rules: Map<string, Set<FetchCallback>> = new Map();
let patchedFetch: (typeof window.fetch) | null = null;
let downstreamFetch: (typeof window.fetch) | null = null;
let isPatched = false;
interface PendingItem {
  cb: FetchCallback;
  response: Response;
  url: string;
  init?: RequestInit;
}
let pendingQueue: PendingItem[] = [];
let pendingCbs: Set<FetchCallback> = new Set();
let rafId = 0;
let isDestroyed = false;
function flushPendingQueue(): void {
  if (isDestroyed) {
    pendingQueue = [];
    pendingCbs.clear();
    return;
  }
  rafId = 0;
  const batch = pendingQueue;
  pendingQueue = [];
  pendingCbs.clear();
  for (const { cb, response, url, init } of batch) {
    try { cb(response, url, init); } catch {}
  }
}
function schedulePendingFlush(): void {
  if (isDestroyed) return;
  if (rafId) return;
  rafId = requestAnimationFrame(flushPendingQueue);
}
export function onFetch(name: string, callback: FetchCallback): void {
  if (!rules.has(name)) {
    rules.set(name, new Set());
  }
  rules.get(name)!.add(callback);
}
export function offFetch(name: string, callback?: FetchCallback): void {
  if (callback) {
    const callbacks = rules.get(name);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        rules.delete(name);
      }
    }
  } else {
    rules.delete(name);
  }
}
export function fetchListener() {
  const callbacks: Array<{ name: string; cb: FetchCallback }> = [];
  return {
    on(name: string, cb: FetchCallback): void {
      callbacks.push({ name, cb });
    },
    attach(): void {
      callbacks.forEach(({ name, cb }) => onFetch(name, cb));
    },
    detach(): void {
      callbacks.forEach(({ name, cb }) => offFetch(name, cb));
    },
  };
}
export function initFetchMonitor(): void {
  if (isPatched) return;
  isDestroyed = false;
  downstreamFetch = window.fetch;
  patchedFetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const currentDownstream = downstreamFetch;
    if (!currentDownstream) {
      return window.fetch(input, init);
    }
    window.fetch = currentDownstream;
    try {
      if (rules.size === 0) {
        return currentDownstream.call(window, input, init);
      }
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const fetchPromise = currentDownstream.call(window, input, init);
      const matchedCallbacks: FetchCallback[] = [];
      rules.forEach((callbacks, name) => {
        if (url.includes(name)) {
          callbacks.forEach((cb) => matchedCallbacks.push(cb));
        }
      });
      if (matchedCallbacks.length > 0) {
        fetchPromise.catch(() => {});
        const needsResponse = matchedCallbacks.some(cb => cb.length >= 1);
        fetchPromise.then((response) => {
          try {
            if (needsResponse) {
              if (response.bodyUsed) return;
              const clonedResponse = response.clone();
              matchedCallbacks.forEach((cb) => {
                if (pendingCbs.has(cb)) return;
                pendingCbs.add(cb);
                pendingQueue.push({ cb, response: clonedResponse, url, init });
              });
            } else {
              matchedCallbacks.forEach((cb) => {
                if (pendingCbs.has(cb)) return;
                pendingCbs.add(cb);
                pendingQueue.push({ cb, response: undefined as any, url, init });
              });
            }
            schedulePendingFlush();
          } catch {}
        }).catch(() => {});
      }
      return fetchPromise;
    } finally {
      window.fetch = patchedFetch!;
    }
  };
  window.fetch = patchedFetch;
  isPatched = true;
}
export function triggerFetchEvent(name: string): void {
    const callbacks = rules.get(name);
    if (!callbacks || callbacks.size === 0) return;
    callbacks.forEach((cb) => {
        if (pendingCbs.has(cb)) return;
        pendingCbs.add(cb);
        pendingQueue.push({ cb, response: undefined as any, url: name, init: undefined });
    });
    schedulePendingFlush();
}
export function destroyFetchMonitor(): void {
  if (!isPatched) return;
  isDestroyed = true;
  if (window.fetch === patchedFetch) {
    window.fetch = downstreamFetch!;
  }
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  pendingQueue = [];
  pendingCbs.clear();
  rules.clear();
  patchedFetch = null;
  downstreamFetch = null;
  isPatched = false;
}