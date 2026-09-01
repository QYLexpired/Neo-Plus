type FetchNotificationCallback = () => void;
type FetchResponseCallback = (response: Response, url: string, init?: RequestInit) => void;
type RegisteredFetchCallback = FetchNotificationCallback | FetchResponseCallback;
type FetchRegistration =
  | { cb: FetchNotificationCallback; needsResponse: false }
  | { cb: FetchResponseCallback; needsResponse: true };
let rules: Map<string, Map<RegisteredFetchCallback, FetchRegistration>> = new Map();
interface FetchPatch {
  wrapper: typeof window.fetch;
  downstream: typeof window.fetch;
  state: { active: boolean };
}
let currentPatch: FetchPatch | null = null;
type PendingItem =
  | { cb: FetchNotificationCallback; needsResponse: false }
  | {
      cb: FetchResponseCallback;
      needsResponse: true;
      response: Response;
      url: string;
      init?: RequestInit;
    };
let pendingQueue: PendingItem[] = [];
let pendingCbs: Set<RegisteredFetchCallback> = new Set();
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
  for (const item of batch) {
    try {
      if (item.needsResponse) {
        item.cb(item.response, item.url, item.init);
      } else {
        item.cb();
      }
    } catch {}
  }
}
function schedulePendingFlush(): void {
  if (isDestroyed) return;
  if (rafId) return;
  rafId = requestAnimationFrame(flushPendingQueue);
}
function registerFetch(name: string, registration: FetchRegistration): void {
  let callbacks = rules.get(name);
  if (!callbacks) {
    callbacks = new Map();
    rules.set(name, callbacks);
  }
  callbacks.set(registration.cb, registration);
}
export function onFetch(name: string, callback: FetchNotificationCallback): void {
  registerFetch(name, { cb: callback, needsResponse: false });
}
export function onFetchResponse(name: string, callback: FetchResponseCallback): void {
  registerFetch(name, { cb: callback, needsResponse: true });
}
export function offFetch(name: string, callback?: RegisteredFetchCallback): void {
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
  const callbacks: Array<{ name: string } & FetchRegistration> = [];
  return {
    on(name: string, cb: FetchNotificationCallback): void {
      callbacks.push({ name, cb, needsResponse: false });
    },
    onResponse(name: string, cb: FetchResponseCallback): void {
      callbacks.push({ name, cb, needsResponse: true });
    },
    attach(): void {
      callbacks.forEach(({ name, cb, needsResponse }) => {
        if (needsResponse) {
          onFetchResponse(name, cb);
        } else {
          onFetch(name, cb);
        }
      });
    },
    detach(): void {
      callbacks.forEach(({ name, cb }) => offFetch(name, cb));
    },
  };
}
export function initFetchMonitor(): void {
  if (currentPatch) return;
  isDestroyed = false;
  const downstream = window.fetch;
  const state = { active: true };
  const wrapper = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (!state.active || rules.size === 0) {
      return downstream.call(window, input, init);
    }
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const fetchPromise = downstream.call(window, input, init);
    const matchedCallbacks: FetchRegistration[] = [];
    rules.forEach((callbacks, name) => {
      if (url.includes(name)) {
        callbacks.forEach((registration) => matchedCallbacks.push(registration));
      }
    });
    if (matchedCallbacks.length > 0 && state.active) {
      fetchPromise.catch(() => {});
      const needsResponse = matchedCallbacks.some(({ needsResponse }) => needsResponse);
      fetchPromise.then((response) => {
        if (!state.active) return;
        try {
          let clonedResponse: Response | null = null;
          if (needsResponse) {
            if (response.bodyUsed) return;
            clonedResponse = response.clone();
          }
          matchedCallbacks.forEach((registration) => {
            if (pendingCbs.has(registration.cb)) return;
            if (registration.needsResponse) {
              if (!clonedResponse) return;
              pendingCbs.add(registration.cb);
              pendingQueue.push({
                cb: registration.cb,
                needsResponse: true,
                response: clonedResponse,
                url,
                init,
              });
            } else {
              pendingCbs.add(registration.cb);
              pendingQueue.push({ cb: registration.cb, needsResponse: false });
            }
          });
          schedulePendingFlush();
        } catch {}
      }).catch(() => {});
    }
    return fetchPromise;
  };
  currentPatch = { wrapper, downstream, state };
  window.fetch = wrapper;
}
export function triggerFetchEvent(name: string): void {
  const callbacks = rules.get(name);
  if (!callbacks || callbacks.size === 0) return;
  callbacks.forEach((registration) => {
    if (registration.needsResponse || pendingCbs.has(registration.cb)) return;
    pendingCbs.add(registration.cb);
    pendingQueue.push({ cb: registration.cb, needsResponse: false });
  });
  schedulePendingFlush();
}
export function destroyFetchMonitor(): void {
  const patch = currentPatch;
  if (!patch) return;
  isDestroyed = true;
  patch.state.active = false;
  if (window.fetch === patch.wrapper) {
    window.fetch = patch.downstream;
  }
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  pendingQueue = [];
  pendingCbs.clear();
  rules.clear();
  currentPatch = null;
}
