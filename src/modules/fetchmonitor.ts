type FetchNotificationCallback = () => void;
type FetchResponseCallback = (response: Response, url: string, init?: RequestInit) => void;
type RegisteredFetchCallback = FetchNotificationCallback | FetchResponseCallback;
type FetchCallback =
  | { cb: FetchNotificationCallback; needsResponse: false }
  | { cb: FetchResponseCallback; needsResponse: true };
type FetchRegistration = FetchCallback & { active: boolean };
let rules: Map<string, Map<RegisteredFetchCallback, FetchRegistration>> = new Map();
interface FetchPatch {
  wrapper: typeof window.fetch;
  downstream: typeof window.fetch;
  state: { active: boolean };
}
let currentPatch: FetchPatch | null = null;
type PendingItem = { registrations: FetchRegistration[] } & (
  | { cb: FetchNotificationCallback; needsResponse: false }
  | {
      cb: FetchResponseCallback;
      needsResponse: true;
      response: Response;
      url: string;
      init?: RequestInit;
    }
);
let pendingQueue: PendingItem[] = [];
let pendingCbs: Map<FetchNotificationCallback, FetchRegistration[]> = new Map();
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
    if (isDestroyed || !item.registrations.some(registration => registration.active)) continue;
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
function enqueueNotification(registration: FetchRegistration): void {
  if (!registration.active || registration.needsResponse) return;
  const pending = pendingCbs.get(registration.cb);
  if (pending) {
    if (!pending.includes(registration)) pending.push(registration);
    return;
  }
  const registrations = [registration];
  pendingCbs.set(registration.cb, registrations);
  pendingQueue.push({ cb: registration.cb, needsResponse: false, registrations });
}
function registerFetch(name: string, registration: FetchRegistration): void {
  let callbacks = rules.get(name);
  if (!callbacks) {
    callbacks = new Map();
    rules.set(name, callbacks);
  }
  const existing = callbacks.get(registration.cb);
  if (existing?.needsResponse === registration.needsResponse) return;
  if (existing) existing.active = false;
  callbacks.set(registration.cb, registration);
}
function onFetch(name: string, callback: FetchNotificationCallback): void {
  registerFetch(name, { cb: callback, needsResponse: false, active: true });
}
function onFetchResponse(name: string, callback: FetchResponseCallback): void {
  registerFetch(name, { cb: callback, needsResponse: true, active: true });
}
function offFetch(name: string, callback?: RegisteredFetchCallback): void {
  if (callback) {
    const callbacks = rules.get(name);
    if (callbacks) {
      const registration = callbacks.get(callback);
      if (registration) registration.active = false;
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        rules.delete(name);
      }
    }
  } else {
    rules.get(name)?.forEach(registration => { registration.active = false; });
    rules.delete(name);
  }
}
export function fetchListener() {
  const callbacks: Array<{ name: string } & FetchCallback> = [];
  return {
    onNotify(name: string, cb: FetchNotificationCallback): void {
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
      fetchPromise.then((response) => {
        if (!state.active) return;
        const responseCallbacks = new Map<FetchResponseCallback, FetchRegistration[]>();
        for (const registration of matchedCallbacks) {
          if (!registration.active) continue;
          if (registration.needsResponse) {
            const registrations = responseCallbacks.get(registration.cb) || [];
            registrations.push(registration);
            responseCallbacks.set(registration.cb, registrations);
          } else {
            enqueueNotification(registration);
          }
        }
        for (const [cb, registrations] of responseCallbacks) {
          try {
            pendingQueue.push({ cb, needsResponse: true, response: response.clone(), url, init, registrations });
          } catch {}
        }
        if (pendingQueue.length > 0) schedulePendingFlush();
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
  callbacks.forEach(enqueueNotification);
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
  rules.forEach(callbacks => callbacks.forEach(registration => { registration.active = false; }));
  rules.clear();
  currentPatch = null;
}
