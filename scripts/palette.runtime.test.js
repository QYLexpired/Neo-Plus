import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createContext, runInContext } from 'vm';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bundle = await build({
  stdin: {
    contents: "export * from './src/palette/manager'; export * from './src/palette/presets'; export * from './src/palette/definitions'; export * from './src/palette/library'; export * from './src/main/context'; export * from './src/main/lifecycle'; export * from './src/main/data';",
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'neo',
  platform: 'browser',
  external: ['@electron/remote'],
  plugins: [{
    name: 'siyuan-fixture',
    setup(builder) {
      builder.onResolve({ filter: /^siyuan$/ }, () => ({ path: 'siyuan', namespace: 'fixture' }));
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export class Dialog {} export class Menu {} export function showMessage() {} export function getFrontend() { return "desktop"; }' }));
    },
  }],
});
const i18n = JSON.parse(readFileSync(resolve(root, 'i18n/zh-CN.json'), 'utf8'));
const settle = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const attributes = new Map([['data-theme-mode', 'light']]);
  const classes = new Set();
  const inline = new Map();
  const listeners = new Map();
  const observers = [];
  const transitions = [];
  let saved = { 'color-plan-light': 'preset', 'preset-light': 'default', 'color-plan-dark': 'preset', 'preset-dark': 'classic' };
  let failObserver = false;
  let failSave = false;
  let delayLoad = false;
  const pendingLoads = [];
  const documentElement = {
    getAttribute: key => attributes.get(key) ?? null,
    setAttribute(key, value) {
      const changed = attributes.get(key) !== value;
      attributes.set(key, value);
      if (changed) queueMicrotask(() => observers.filter(observer => observer.active).forEach(observer => observer.callback([])));
    },
    removeAttribute: key => attributes.delete(key),
    classList: { add: (...values) => values.forEach(value => classes.add(value)), remove: (...values) => values.forEach(value => classes.delete(value)), [Symbol.iterator]: () => classes[Symbol.iterator]() },
    style: { setProperty: (key, value) => inline.set(key, value), removeProperty: key => inline.delete(key) },
  };
  const document = {
    documentElement,
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: (name, handler) => { if (listeners.get(name) === handler) listeners.delete(name); },
  };
  const context = createContext({
    document,
    window: {},
    Math: Object.create(Math),
    setTimeout,
    clearTimeout,
    MutationObserver: class {
      constructor(callback) {
        if (failObserver) { failObserver = false; throw new Error('observer fixture failure'); }
        this.callback = callback;
        this.active = false;
        observers.push(this);
      }
      observe() { this.active = true; }
      disconnect() { this.active = false; }
    },
  });
  runInContext(bundle.outputFiles[0].text, context);
  const { neo } = context;
  saved = {
    ...saved,
    'free-presets-light': { untouched: structuredClone(neo.paletteLibrary.light[0].colors) },
    'free-presets-dark': { untouched: structuredClone(neo.paletteLibrary.dark[0].colors) },
    'free-preset-current-light': 'untouched',
    'free-preset-current-dark': 'untouched',
  };
  const plugin = {
    i18n,
    loadData: async () => delayLoad ? new Promise(resolve => pendingLoads.push(resolve)) : structuredClone(saved),
    saveData: async (_, data) => { if (failSave) throw new Error('save fixture failure'); saved = structuredClone(data); },
  };
  neo.setPlugin(plugin);
  neo.beginNeoLifecycle();
  return {
    neo, context, classes, listeners, observers, transitions,
    activeObservers: () => observers.filter(observer => observer.active).length,
    setMode: mode => documentElement.setAttribute('data-theme-mode', mode),
    failObserver: () => { failObserver = true; },
    failSave: value => { failSave = value; },
    delayLoad: value => { delayLoad = value; },
    releaseLoad: () => pendingLoads.shift()(structuredClone(saved)),
    saved: () => saved,
    delayTransitions: () => {
      document.startViewTransition = callback => {
        transitions.push(callback);
        return { ready: Promise.resolve(), updateCallbackDone: Promise.resolve(), finished: Promise.resolve() };
      };
    },
    shuffle: () => {
      const input = { setAttribute() {}, addEventListener() {} };
      const button = { setAttribute() {}, handlers: {}, addEventListener(name, handler) { this.handlers[name] = handler; } };
      neo.getPresetMenuItems(i18n, () => {})[0].bind({ querySelector: selector => selector === 'input' ? input : button, addEventListener() {} });
      return button.handlers.click;
    },
  };
}
test('initialization is shared and destruction removes observers and menu listeners', async () => {
  const f = fixture();
  const first = f.neo.initPalette();
  assert.equal(first, f.neo.initPalette());
  await first;
  assert.equal(f.neo.initPalette(), first);
  assert.equal(f.observers.length, 1);
  assert.equal(f.activeObservers(), 1);
  assert.equal(f.listeners.size, 4);
  f.neo.destroyPalette();
  f.neo.destroyPalette();
  assert.equal(f.activeObservers(), 0);
  assert.equal(f.listeners.size, 0);
  assert.equal(f.classes.size, 0);
  await f.neo.initPalette();
  assert.equal(f.activeObservers(), 1);
  f.neo.destroyPalette();
});
test('an initialization destroyed while loading cannot create a second observer', async () => {
  const f = fixture();
  f.delayLoad(true);
  const first = f.neo.initPalette();
  f.neo.destroyPalette();
  const restarted = f.neo.initPalette();
  assert.notEqual(first, restarted);
  f.delayLoad(false);
  f.releaseLoad();
  await Promise.all([first, restarted]);
  assert.equal(f.observers.length, 1);
  assert.equal(f.activeObservers(), 1);
  f.neo.destroyPalette();
});
test('a stopped lifecycle ignores pending initialization', async () => {
  const f = fixture();
  f.delayLoad(true);
  const pending = f.neo.initPalette();
  f.neo.destroyPalette();
  f.neo.endNeoLifecycle();
  f.releaseLoad();
  await pending;
  assert.equal(f.observers.length, 0);
  assert.equal(f.classes.size, 0);
});
test('failed initialization cleans up and can be retried', async () => {
  const f = fixture();
  f.failObserver();
  await assert.rejects(f.neo.initPalette(), /observer fixture failure/);
  assert.equal(f.classes.size, 0);
  assert.equal(f.listeners.size, 0);
  await f.neo.initPalette();
  assert.equal(f.activeObservers(), 1);
  f.neo.destroyPalette();
});
test('mode restoration does not cancel a selection requested immediately after switching mode', async () => {
  const f = fixture();
  await f.neo.initPalette();
  for (const mode of ['dark', 'light']) {
    f.setMode(mode);
    const key = f.neo.getLibraryPresetKey(f.neo.paletteLibrary[mode][3].key);
    f.neo.switchToPreset(key);
    await settle();
    assert.ok(f.classes.has(`neo-palette-${key}`));
    assert.equal(f.saved()[`preset-${mode}`], key);
  }
  f.neo.destroyPalette();
});
test('outdated and destroyed transitions cannot override the latest selection', async () => {
  const f = fixture();
  f.delayTransitions();
  f.neo.switchToPreset('default'); await settle();
  f.neo.switchToPreset('classic'); await settle();
  assert.equal(f.transitions.length, 2);
  f.transitions[1](); f.transitions[0]();
  assert.ok(f.classes.has('neo-palette-classic'));
  f.neo.switchToPreset('default'); await settle();
  f.neo.destroyPalette();
  f.transitions[2]();
  assert.equal(f.classes.size, 0);
});
test('invalid, missing and wrong-mode stored keys fall back without invalid DOM classes', () => {
  const f = fixture();
  const darkKey = f.neo.getLibraryPresetKey(f.neo.paletteLibrary.dark[0].key);
  for (const key of [undefined, '', null, 123, {}, 'invalid key', 'removed', darkKey]) {
    f.neo.applyCurrentPlan({ 'color-plan-light': 'preset', 'preset-light': key });
    assert.deepEqual([...f.classes], ['neo-palette-default']);
  }
  assert.equal(f.neo.getCurrentPlan({ 'color-plan-light': 'unknown' }, 'light'), 'preset');
});
test('source weighting survives singleton and empty pools', async () => {
  const f = fixture();
  f.neo.presets.splice(1);
  f.neo.paletteLibrary.light = [f.neo.paletteLibrary.light[0]];
  const shuffle = f.shuffle();
  for (const source of [0.1, 0.1, 0.499999, 0.5, 0.9, 0.9]) {
    const rolls = [source, 0];
    f.context.Math.random = () => rolls.shift();
    shuffle(); await settle();
    assert.equal(rolls.length, 0);
    assert.equal([...f.classes].some(key => key.startsWith('neo-palette-library-')), source >= 0.5);
  }
  f.neo.presets.splice(0);
  f.context.Math.random = () => 0;
  f.shuffle()(); await settle();
  assert.ok([...f.classes].some(key => key.startsWith('neo-palette-library-')));
  f.neo.paletteLibrary.light = [];
  const before = [...f.classes];
  let draws = 0;
  f.context.Math.random = () => { draws++; return 0; };
  f.shuffle()(); await settle();
  assert.equal(draws, 0);
  assert.deepEqual([...f.classes], before);
});
test('a failed save keeps the session usable and preserves free schemes on the next successful save', async () => {
  const f = fixture();
  const freeSnapshot = Object.fromEntries(Object.entries(f.saved()).filter(([key]) => key.startsWith('free-')));
  await f.neo.initPalette();
  f.failSave(true);
  f.neo.switchToPlan('free'); await settle();
  assert.ok(f.classes.has('neo-palette-free'));
  assert.equal(f.neo.getConfig()['color-plan-light'], 'free');
  assert.equal(f.saved()['color-plan-light'], 'preset');
  f.failSave(false);
  const key = f.neo.getLibraryPresetKey(f.neo.paletteLibrary.light[0].key);
  f.neo.switchToPreset(key); await settle();
  assert.equal(f.saved()['preset-light'], key);
  assert.equal(f.saved()['color-plan-light'], 'preset');
  assert.deepEqual(Object.fromEntries(Object.entries(f.saved()).filter(([key]) => key.startsWith('free-'))), freeSnapshot);
  f.neo.destroyPalette();
});
