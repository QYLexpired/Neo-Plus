import { showMessage, type Menu } from 'siyuan';
import { Dialog } from '../modules/dialog';
import { openSearchableMenu, showNamedMessage } from '../modules/searchablemenu';
import { getPlugin } from '../main/context';
import { loadConfig, saveConfigIfUnchanged, type Config, type FreeColorKey, type FreeColors } from '../main/data';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { paletteLibrary } from './library';
import { getThemeMode, getPresetsByMode, type ThemeMode } from './presets';
const colorFields: ReadonlyArray<readonly [FreeColorKey, string, string, string]> = [
  ['base', 'freeBase', '--b3-base-color', 'freeBaseTip'],
  ['primary', 'freePrimary', '--b3-theme-primary', 'freePrimaryTip'],
  ['accent', 'freeAccent', '--b3-theme-accent', 'freeAccentTip'],
  ['background', 'freeBackground', '--b3-theme-background', 'freeBackgroundTip'],
  ['surface', 'freeSurface', '--b3-theme-surface', 'freeSurfaceTip'],
  ['onbackground', 'freeOnBackground', '--b3-theme-on-background', 'freeOnBackgroundTip'],
];
export function setFreePresetAttr(name: string): void {
  const value = name.trim();
  if (value) {
    document.documentElement.setAttribute('data-neo-free', value);
  } else {
    document.documentElement.removeAttribute('data-neo-free');
  }
}
function readPresetColors(preset: string, mode: ThemeMode): Required<FreeColors> {
  const probe = document.createElement('div');
  probe.hidden = true;
  probe.classList.add(`neo-palette-${preset}`, `neo-mode-${mode}`);
  probe.setAttribute('data-theme-mode', mode);
  document.body.append(probe);
  try {
    const style = getComputedStyle(probe);
    const colors = {} as Required<FreeColors>;
    for (const [key, , variable] of colorFields) {
      const value = style.getPropertyValue(variable).trim();
      if (!/^#[\da-f]{6}$/i.test(value)) throw new Error(`Invalid preset color: ${variable}`);
      colors[key] = value;
    }
    return colors;
  } finally {
    probe.remove();
  }
}
function getCurrentPresetName(config: Config, mode: ThemeMode): string {
  const presets = config[`free-presets-${mode}`] ?? {};
  const selected = config[`free-preset-current-${mode}`] ?? '';
  return Object.prototype.hasOwnProperty.call(presets, selected) ? selected : '';
}
function getColors(config: Config, mode: ThemeMode): Required<FreeColors> {
  return getFreePresetColors(config, mode, getCurrentPresetName(config, mode))
    ?? readPresetColors('default', mode);
}
export function getFreePresetColors(config: Config, mode: ThemeMode, name: string): Required<FreeColors> | null {
  const presets = config[`free-presets-${mode}`] ?? {};
  if (!Object.prototype.hasOwnProperty.call(presets, name)) return null;
  const saved = presets[name];
  if (!saved) return null;
  const colors = readPresetColors('default', mode);
  for (const [key] of colorFields) {
    const value = saved[key];
    if (typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)) colors[key] = value;
  }
  return colors;
}
export function applyFreeColors(colors: Required<FreeColors>): void {
  applyColors(colors);
  document.documentElement.style.setProperty('--b3-theme-on-surface', 'oklch(from var(--b3-theme-on-background) l c h / 0.65)');
}
export function clearFreeColors(): void {
  for (const [, , variable] of colorFields) {
    document.documentElement.style.removeProperty(variable);
  }
  document.documentElement.style.removeProperty('--b3-theme-on-surface');
}
function applyColors(colors: Required<FreeColors>): void {
  for (const [key, , variable] of colorFields) {
    document.documentElement.style.setProperty(variable, colors[key]);
  }
}
export function initFree(config: Config): void {
  const mode = getThemeMode();
  applyFreeColors(getColors(config, mode));
  setFreePresetAttr(getCurrentPresetName(config, mode));
}
export function destroyFree(): void {
  clearFreeColors();
  setFreePresetAttr('');
}
function buildSettingsHTML(i18n: Record<string, string>, colors: Required<FreeColors>, mode: ThemeMode): string {
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-title">${i18n.freePresetGroupTitle}</div>
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${mode === 'dark' ? i18n.freePresetSelectDark : i18n.freePresetSelectLight}</div>
              <div class="b3-label__text">${i18n.freePresetSelectTip}</div>
            </div>
            <span class="fn__space"></span>
            <button type="button" class="b3-select fn__flex-center fn__size200 fn__ellipsis" style="text-align:left" id="neo-free-preset-select" aria-label="${mode === 'dark' ? i18n.freePresetSelectDark : i18n.freePresetSelectLight}" aria-haspopup="listbox" aria-expanded="false">&nbsp;</button>
          </label>
        </div>
      </div>
      <div class="config-group">
        <div class="config-title">${i18n.freeColorGroupTitle}</div>
        <div class="config-items" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr))">
          ${colorFields.map(([key, label]) => {
            const color = colors[key];
            return `<label class="fn__flex b3-label config-item" style="min-width:0" for="neo-free-${key}">
              <div class="fn__flex-1 config-item__main">
                <div class="config-name">${i18n[label]}<span class="neo-config-name-tip" data-free-tip="${key}">${i18n.customimagePathTipToggle}</span></div>
              </div>
              <span class="fn__space"></span>
              <input id="neo-free-${key}" class="b3-text-field fn__flex-center" type="color" value="${color}" aria-label="${i18n[label]}">
            </label>`;
          }).join('')}
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-free-cancel">${i18n.close}</button>
    <span class="fn__space"></span>
    <button class="b3-button" id="neo-free-new-preset">${i18n.freeNewPreset}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-free-confirm">${i18n.freeUpdateApply}</button>
  </div>`;
}
function showReferencePalette(
  mode: ThemeMode,
  onPreview: (colors: Required<FreeColors>) => void,
  onCreate: (colors: Required<FreeColors>, suggestedName: string) => Promise<boolean>,
  onRestore: () => void,
): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const { i18n } = plugin;
  const presets = getPresetsByMode(mode);
  const library = [...paletteLibrary[mode]].sort((a, b) =>
    (i18n[a.nameKey] ?? a.nameKey).localeCompare(i18n[b.nameKey] ?? b.nameKey, undefined, { sensitivity: 'base' }));
  let keepPreview = false;
  let referenceMenu: Menu | null = null;
  const dialog = new Dialog({
    title: i18n.freeReference,
    content: `<div class="b3-dialog__content">
      <div class="config__tab-container">
        <div class="config-group">
          <div class="config-items">
            <label class="fn__flex b3-label config-item">
              <div class="fn__flex-1 config-item__main">
                <div class="config-name">${i18n.colorScheme}</div>
                <div class="b3-label__text">${i18n.freeReferenceTip}</div>
              </div>
              <span class="fn__space"></span>
              <button type="button" class="b3-select fn__flex-center fn__size200 fn__ellipsis" style="text-align:left" id="neo-free-reference-preset" aria-label="${i18n.colorScheme}" aria-haspopup="listbox" aria-expanded="false">&nbsp;</button>
            </label>
          </div>
        </div>
        <div class="config-group">
          <div class="config-items">
            <label class="fn__flex b3-label config-item">
              <div class="fn__flex-1 config-item__main">
                <div class="config-name">${i18n.freeLibrary}</div>
                <div class="b3-label__text">${i18n.freeLibraryTip}</div>
              </div>
              <span class="fn__space"></span>
              <button type="button" class="b3-select fn__flex-center fn__size200 fn__ellipsis" style="text-align:left" id="neo-free-reference-library" aria-label="${i18n.freeLibrary}" aria-haspopup="listbox" aria-expanded="false">&nbsp;</button>
            </label>
          </div>
        </div>
      </div>
    </div>
    <div class="b3-dialog__action">
      <button class="b3-button b3-button--cancel" id="neo-free-reference-cancel">${i18n.freeUnsavedBack}</button>
      <span class="fn__space"></span>
      <button class="b3-button b3-button--text" id="neo-free-reference-confirm">${i18n.freeReferenceNewPreset}</button>
    </div>`,
    destroyCallback: () => {
      referenceMenu?.close();
      if (!keepPreview) onRestore();
    },
  });
  dialog.element.classList.add('neo-settings-dialog');
  const presetButton = dialog.element.querySelector<HTMLButtonElement>('#neo-free-reference-preset')!;
  const libraryButton = dialog.element.querySelector<HTMLButtonElement>('#neo-free-reference-library')!;
  const createButton = dialog.element.querySelector<HTMLButtonElement>('#neo-free-reference-confirm')!;
  let source: 'preset' | 'library' | null = null;
  let creating = false;
  createButton.disabled = true;
  function getSourceName(): string {
    if (source === 'library') {
      const item = library.find(candidate => candidate.key === libraryButton.value);
      return item ? (i18n[item.nameKey] ?? item.key) : '';
    }
    if (source === 'preset') {
      const preset = presets.find(candidate => candidate.key === presetButton.value);
      return preset ? (i18n[preset.nameKey] ?? preset.key) : '';
    }
    return '';
  }
  function getSelectedColors(): Required<FreeColors> | null {
    if (!source) return null;
    if (source === 'library') {
      const item = library.find(candidate => candidate.key === libraryButton.value);
      return item ? { ...item.colors } : null;
    }
    if (!presets.some(preset => preset.key === presetButton.value)) return null;
    try {
      return readPresetColors(presetButton.value, mode);
    } catch {
      showMessage(i18n.freeReferenceFailed);
      return null;
    }
  }
  function selectSource(next: 'preset' | 'library', key: string): void {
    source = next;
    const active = next === 'preset' ? presetButton : libraryButton;
    const inactive = next === 'preset' ? libraryButton : presetButton;
    active.value = key;
    active.textContent = getSourceName();
    inactive.value = '';
    inactive.textContent = '\u00a0';
    const colors = getSelectedColors();
    createButton.disabled = creating || !colors;
    if (colors) onPreview(colors);
  }
  function openReferenceMenu(next: 'preset' | 'library'): void {
    if (creating) return;
    referenceMenu?.close();
    const trigger = next === 'preset' ? presetButton : libraryButton;
    const items: ReadonlyArray<{ key: string; nameKey: string }> = next === 'preset' ? presets : library;
    referenceMenu = openSearchableMenu(
      trigger,
      items.map(item => ({ key: item.key, label: i18n[item.nameKey] ?? item.key })),
      i18n.freeReferenceSearch,
      next === 'preset' ? i18n.colorScheme : i18n.freeLibrary,
      key => selectSource(next, key),
      () => { referenceMenu = null; },
    );
  }
  presetButton.addEventListener('click', () => openReferenceMenu('preset'));
  libraryButton.addEventListener('click', () => openReferenceMenu('library'));
  dialog.element.querySelector('#neo-free-reference-cancel')?.addEventListener('click', () => dialog.destroy());
  createButton.addEventListener('click', async () => {
    if (creating) return;
    const colors = getSelectedColors();
    if (!colors) return;
    creating = true;
    createButton.disabled = true;
    if (await onCreate(colors, getSourceName())) {
      keepPreview = true;
      dialog.destroy();
      return;
    }
    creating = false;
    createButton.disabled = false;
  });
}
function confirmPresetAction(title: string, content: string, action: string, cancel: string): Promise<boolean> {
  return new Promise(resolve => {
    const dialog = new Dialog({
      title,
      content: `<div class="b3-dialog__content"></div><div class="b3-dialog__action">
        <button class="b3-button b3-button--cancel" id="neo-free-action-cancel">${cancel}</button>
        <span class="fn__space"></span>
        <button class="b3-button b3-button--remove" id="neo-free-action-confirm">${action}</button>
      </div>`,
      destroyCallback: () => resolve(false),
    });
    dialog.element.classList.add('neo-settings-dialog');
    dialog.element.querySelector('.b3-dialog__content')!.textContent = content;
    dialog.element.querySelector('#neo-free-action-cancel')?.addEventListener('click', () => dialog.destroy());
    dialog.element.querySelector('#neo-free-action-confirm')?.addEventListener('click', () => {
      resolve(true);
      dialog.destroy();
    });
  });
}
export async function showFreeSettings(): Promise<void> {
  const plugin = getPlugin();
  if (!plugin) return;
  const isCurrent = createNeoLifecycleGuard();
  let config = await loadConfig();
  if (!isCurrent()) return;
  const mode = getThemeMode();
  const presetsKey = mode === 'dark' ? 'free-presets-dark' : 'free-presets-light';
  const currentKey = mode === 'dark' ? 'free-preset-current-dark' : 'free-preset-current-light';
  const { i18n } = plugin;
  let presets = config[presetsKey] ?? {};
  let selected = config[currentKey] ?? '';
  if (!Object.prototype.hasOwnProperty.call(presets, selected)) selected = '';
  let savedColors = getColors(config, mode);
  const colors = { ...savedColors };
  let saving = false;
  let presetMenu: Menu | null = null;
  let closePromptOpen = false;
  let dirty = false;
  function canPreview(): boolean {
    return isCurrent() && getThemeMode() === mode
      && document.documentElement.classList.contains('neo-palette-free');
  }
  const dialog = new Dialog({
    title: `<div class="fn__flex">
      <div class="fn__ellipsis">${i18n.freePaletteSettings}</div>
      <span class="fn__space"></span>
      <button class="b3-button b3-button--small fn__flex-center" id="neo-free-reference">${i18n.freeReferenceView}</button>
    </div>`,
    content: buildSettingsHTML(i18n, colors, mode),
    destroyCallback: () => {
      presetMenu?.close();
      if (canPreview()) applyColors(savedColors);
    },
  });
  dialog.element.classList.add('neo-settings-dialog');
  const presetButton = dialog.element.querySelector<HTMLButtonElement>('#neo-free-preset-select')!;
  for (const [key, label, , tip] of colorFields) {
    dialog.element.querySelector(`[data-free-tip="${key}"]`)?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      new Dialog({
        title: i18n[label],
        content: `<div class="b3-dialog__content"><div class="b3-label__text">${i18n[tip]}</div></div>`,
      });
    });
  }
  function setColors(values: Required<FreeColors>): void {
    Object.assign(colors, values);
    for (const [key] of colorFields) {
      const input = dialog.element.querySelector<HTMLInputElement>(`#neo-free-${key}`);
      if (input) input.value = colors[key];
    }
    if (canPreview()) applyColors(colors);
  }
  function updatePresetButton(): void {
    presetButton.value = selected;
    presetButton.textContent = selected || '\u00a0';
  }
  updatePresetButton();
  async function persist(nextPresets: Record<string, FreeColors>, name: string, preserveDraft = false): Promise<boolean> {
    if (!isCurrent() || saving || !dialog.element.isConnected) return false;
    saving = true;
    const controls = dialog.element.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('input, select, button');
    controls.forEach(control => { control.disabled = true; });
    const patch: Partial<Config> = {};
    patch[presetsKey] = nextPresets;
    patch[currentKey] = name;
    const expected: Partial<Config> = {};
    expected[presetsKey] = config[presetsKey];
    expected[currentKey] = config[currentKey];
    try {
      if (!await saveConfigIfUnchanged(patch, expected)) {
        if (isCurrent()) showMessage(i18n.freePaletteChanged);
        return false;
      }
      if (!isCurrent()) return false;
      config = { ...config, ...patch };
      presets = nextPresets;
      selected = name;
      savedColors = getColors(config, mode);
      updatePresetButton();
      if (!preserveDraft) {
        setColors(savedColors);
        dirty = false;
      }
      if (canPreview()) setFreePresetAttr(selected);
      return true;
    } catch {
      if (isCurrent()) showMessage(i18n.freePaletteSaveFailed);
      return false;
    } finally {
      saving = false;
      controls.forEach(control => { control.disabled = false; });
    }
  }
  dialog.element.querySelector('#neo-free-reference')?.addEventListener('click', () => {
    if (!isCurrent() || saving) return;
    const root = document.documentElement;
    const variables = [...colorFields.map(([, , variable]) => variable), '--b3-theme-on-surface'];
    const snapshot = variables.map(variable => [
      variable,
      root.style.getPropertyValue(variable),
      root.style.getPropertyPriority(variable),
    ] as const);
    function restorePreview(): void {
      if (!isCurrent() || getThemeMode() !== mode) return;
      for (const [variable, value, priority] of snapshot) {
        if (value) root.style.setProperty(variable, value, priority);
        else root.style.removeProperty(variable);
      }
    }
    showReferencePalette(
      mode,
      imported => {
        if (!isCurrent() || getThemeMode() !== mode) return;
        applyColors(imported);
        root.style.setProperty('--b3-theme-on-surface', 'oklch(from var(--b3-theme-on-background) l c h / 0.65)');
      },
      async (imported, suggestedName) => {
        if (dirty && !await confirmPresetAction(i18n.freeUnsavedTitle, i18n.freeReferenceUnsavedContent, i18n.freeReferenceUnsavedConfirm, i18n.freeUnsavedBack)) return false;
        const created = await showNewPreset(imported, i18n.freeReferenceNewPreset, suggestedName);
        if (created && !canPreview()) restorePreview();
        return created;
      },
      restorePreview,
    );
  });
  for (const [key, , variable] of colorFields) {
    const input = dialog.element.querySelector<HTMLInputElement>(`#neo-free-${key}`);
    input?.addEventListener('input', () => {
      colors[key] = input.value;
      dirty = true;
      if (canPreview()) document.documentElement.style.setProperty(variable, input.value);
    });
  }
  const originalDestroy = dialog.destroy.bind(dialog);
  dialog.destroy = (): void => {
    if (saving || closePromptOpen) return;
    if (!isCurrent() || !dirty) {
      originalDestroy();
      return;
    }
    closePromptOpen = true;
    void confirmPresetAction(i18n.freeUnsavedTitle, i18n.freeUnsavedContent, i18n.freeUnsavedExit, i18n.freeUnsavedBack)
      .then(discard => {
        closePromptOpen = false;
        if (discard) originalDestroy();
      });
  };
  dialog.element.querySelector('#neo-free-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-free-confirm')?.addEventListener('click', async () => {
    if (!selected) { showMessage(i18n.freePresetNotSelected); return; }
    if (await persist({ ...presets, [selected]: { ...colors } }, selected)) {
      showNamedMessage(i18n.freePresetUpdated, selected);
      dialog.destroy();
    }
  });
  presetButton.addEventListener('click', () => {
    if (!isCurrent() || saving) return;
    presetMenu?.close();
    presetMenu = openSearchableMenu(
      presetButton,
      Object.keys(presets).map(name => ({ key: name, label: name })),
      i18n.freePresetSearch,
      mode === 'dark' ? i18n.freePresetSelectDark : i18n.freePresetSelectLight,
      async name => {
        if (!name || name === selected) return;
        if (dirty && !await confirmPresetAction(i18n.freePresetSwitchTitle, i18n.freePresetSwitchContent, i18n.freePresetSwitchConfirm, i18n.freePresetSwitchCancel)) return;
        await persist(presets, name);
      },
      () => { presetMenu = null; },
      [
        { label: i18n.freeRenamePreset, icon: 'iconEdit', rename: renamePreset },
        { label: i18n.freeDeletePreset, icon: 'iconTrashcan', click: deletePreset },
      ],
    );
  });
  async function deletePreset(name: string): Promise<void> {
    if (!isCurrent() || saving || !Object.prototype.hasOwnProperty.call(presets, name)) return;
    if (!await confirmPresetAction(i18n.freePresetDeleteConfirmTitle, i18n.freePresetDeleteConfirmContent.replace('${name}', () => name), i18n.freeDeletePreset, i18n.cancel)) return;
    const next = { ...presets };
    delete next[name];
    if (await persist(next, name === selected ? '' : selected, name !== selected)) {
      showNamedMessage(i18n.freePresetDeleted, name);
    }
  }
  async function renamePreset(oldName: string, name: string): Promise<boolean> {
    if (!isCurrent() || saving || !dialog.element.isConnected || !Object.prototype.hasOwnProperty.call(presets, oldName)) return false;
    name = name.trim();
    if (!name) {
      showMessage(i18n.freePresetNameEmpty);
      return false;
    }
    if (name === oldName) return true;
    if (Object.prototype.hasOwnProperty.call(presets, name)) {
      showMessage(i18n.freePresetNameExists);
      return false;
    }
    const next = Object.fromEntries(Object.entries(presets).map(([key, value]) => [key === oldName ? name : key, value]));
    return persist(next, selected === oldName ? name : selected, true);
  }
  function showNewPreset(source: Required<FreeColors>, title: string, suggestedName = ''): Promise<boolean> {
    return showPresetName(title, suggestedName, async name => {
      if (Object.prototype.hasOwnProperty.call(presets, name)
        && !await confirmPresetAction(i18n.freePresetOverwriteTitle, i18n.freePresetOverwriteContent.replace('${name}', () => name), i18n.confirm, i18n.cancel)) return false;
      if (!await persist({ ...presets, [name]: { ...source } }, name)) return false;
      showNamedMessage(i18n.freePresetSaved, name);
      return true;
    });
  }
  function showPresetName(title: string, suggestedName: string, onSave: (name: string) => Promise<boolean>): Promise<boolean> {
    return new Promise(resolve => {
      const nameDialog = new Dialog({
        title,
        content: `<div class="b3-dialog__content"><label class="fn__flex b3-label config-item">
          <div class="fn__flex-1 config-item__main"><div class="config-name">${i18n.freePresetName}</div><div class="b3-label__text">${i18n.freePresetNameTip}</div></div>
          <span class="fn__space"></span><input class="b3-text-field fn__flex-center fn__size200" id="neo-free-preset-name" spellcheck="false">
        </label></div><div class="b3-dialog__action">
          <button class="b3-button b3-button--cancel" id="neo-free-name-cancel">${i18n.cancel}</button><span class="fn__space"></span>
          <button class="b3-button b3-button--text" id="neo-free-name-confirm">${i18n.confirm}</button>
        </div>`,
        destroyCallback: () => resolve(false),
      });
      nameDialog.element.classList.add('neo-settings-dialog');
      const nameInput = nameDialog.element.querySelector<HTMLInputElement>('#neo-free-preset-name')!;
      if (suggestedName) {
        nameInput.value = suggestedName;
        nameInput.select();
      }
      nameInput.focus();
      nameDialog.element.querySelector('#neo-free-name-cancel')?.addEventListener('click', () => nameDialog.destroy());
      const confirmButton = nameDialog.element.querySelector<HTMLButtonElement>('#neo-free-name-confirm')!;
      let submitting = false;
      const destroyNameDialog = nameDialog.destroy.bind(nameDialog);
      nameDialog.destroy = (): void => {
        if (!submitting || !isCurrent()) destroyNameDialog();
      };
      const controls = nameDialog.element.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button');
      const submit = async (): Promise<void> => {
        if (submitting || !isCurrent() || !nameDialog.element.isConnected || !dialog.element.isConnected) return;
        const name = nameInput.value.trim();
        if (!name) { showMessage(i18n.freePresetNameEmpty); return; }
        submitting = true;
        controls.forEach(control => { control.disabled = true; });
        try {
          if (await onSave(name)) {
            resolve(true);
            destroyNameDialog();
          }
        } finally {
          submitting = false;
          controls.forEach(control => { control.disabled = false; });
        }
      };
      confirmButton.addEventListener('click', () => { void submit(); });
    });
  }
  dialog.element.querySelector('#neo-free-new-preset')?.addEventListener('click', () => {
    void showNewPreset({ ...colors }, i18n.freeNewPresetTitle);
  });
}
