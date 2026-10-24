import { getPlugin } from '../main/context';
import { loadConfig, saveConfig, type Config } from '../main/data';
import { createNeoLifecycleGuard } from '../main/lifecycle';
import { Dialog } from '../modules/dialog';
type InitialHueRule = 'theme' | 'fixed' | 'accent';
type ColorStyle = 'soft' | 'default' | 'vivid';
type LinkStyle = 'icon' | 'underline';
interface HeadingSettings {
  enabled: boolean;
  outline: boolean;
  level: boolean;
  colorStyle: ColorStyle;
  initialHueRule: InitialHueRule;
  initialHue: number;
}
const headingClassOptions = {
  colored: ['off', 'on'],
  'colored-outline': ['off', 'on'],
  'colored-initial-hue-rule': ['theme', 'fixed', 'accent'],
  'colored-color-style': ['soft', 'default', 'vivid'],
  level: ['off', 'on'],
} as const;
function applyHeadingClass(name: keyof typeof headingClassOptions, value: string): void {
  for (const option of headingClassOptions[name]) {
    document.documentElement.classList.toggle(`neo-element-heading-${name}-${option}`, option === value);
  }
}
function applyLinkStyle(style: LinkStyle): void {
  document.documentElement.classList.toggle('neo-element-link-style-icon', style === 'icon');
  document.documentElement.classList.toggle('neo-element-link-style-underline', style === 'underline');
}
function readHeadingSettings(config: Config): HeadingSettings {
  const colorStyle = config['element-heading-colored-color-style'];
  const rule = config['element-heading-colored-initial-hue-rule'];
  const hue = Number(config['element-heading-colored-initial-hue']);
  return {
    enabled: config['element-heading-colored'] === 'on',
    outline: config['element-heading-colored-outline'] !== 'off',
    level: config['element-heading-level'] === 'on',
    colorStyle: colorStyle === 'soft' || colorStyle === 'vivid' ? colorStyle : 'default',
    initialHueRule: rule === 'fixed' || rule === 'accent' ? rule : 'theme',
    initialHue: Number.isFinite(hue) ? Math.min(360, Math.max(0, Math.round(hue))) : 0,
  };
}
function applyElementSettings(config: Config): void {
  applyLinkStyle(config['element-link-style'] === 'icon' ? 'icon' : 'underline');
  const heading = readHeadingSettings(config);
  applyHeadingClass('colored', heading.enabled ? 'on' : 'off');
  applyHeadingClass('colored-outline', heading.outline ? 'on' : 'off');
  applyHeadingClass('colored-initial-hue-rule', heading.initialHueRule);
  applyHeadingClass('colored-color-style', heading.colorStyle);
  applyHeadingClass('level', heading.level ? 'on' : 'off');
  if (heading.enabled && heading.initialHueRule === 'fixed') {
    document.documentElement.style.setProperty('--_element-heading-colored-initial-hue', String(heading.initialHue));
  } else {
    document.documentElement.style.removeProperty('--_element-heading-colored-initial-hue');
  }
}
export function initElement(): Promise<void> {
  const isCurrent = createNeoLifecycleGuard();
  return loadConfig().then((config) => {
    if (!isCurrent()) return;
    applyElementSettings(config);
  });
}
function buildSettingsHTML(i18n: Record<string, string>, heading: HeadingSettings): string {
  const colorStyleOptions = ['soft', 'default', 'vivid']
    .map(value => `<option value="${value}">${i18n[`elementHeadingColoredColorStyle${value.charAt(0).toUpperCase() + value.slice(1)}`]}</option>`)
    .join('');
  const ruleOptions = ['theme', 'fixed', 'accent']
    .map(value => `<option value="${value}">${i18n[`elementHeadingColoredInitialHueRule${value.charAt(0).toUpperCase() + value.slice(1)}`]}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-title">${i18n.elementLink}</div>
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.elementLinkStyle}</div>
              <div class="b3-label__text">${i18n.elementLinkStyleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-element-link-style">
              <option value="underline">${i18n.elementLinkStyleUnderline}</option>
              <option value="icon">${i18n.elementLinkStyleIcon}</option>
            </select>
          </label>
        </div>
      </div>
      <div class="config-group">
        <div class="config-title">${i18n.elementHeading}</div>
        <div class="config-items">
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.elementHeadingColored}</div>
              <div class="b3-label__text">${i18n.elementHeadingColoredTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-element-heading-colored">
              <option value="off">${i18n.off}</option>
              <option value="on">${i18n.on}</option>
            </select>
          </label>
          <label class="fn__flex b3-label config-item fn__none">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.elementHeadingColoredInitialHueRule}</div>
              <div class="b3-label__text">${i18n.elementHeadingColoredInitialHueRuleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-element-heading-colored-initial-hue-rule">
              ${ruleOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item fn__none">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.elementHeadingColoredColorStyle}</div>
              <div class="b3-label__text">${i18n.elementHeadingColoredColorStyleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-element-heading-colored-color-style">
              ${colorStyleOptions}
            </select>
          </label>
          <label class="fn__flex b3-label config-item fn__none" id="neo-element-heading-colored-initial-hue-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.elementHeadingColoredInitialHue}</div>
              <div class="b3-label__text">${i18n.elementHeadingColoredInitialHueTip}</div>
            </div>
            <span class="fn__space"></span>
            <div class="b3-tooltips b3-tooltips__n fn__flex-center" id="neo-element-heading-colored-initial-hue-tooltip" aria-label="${heading.initialHue}deg">
              <input class="b3-slider fn__size200 neo-colored-hue-slider neo-colored-hue-slider--element-heading" data-colorstyle="${heading.colorStyle}" id="neo-element-heading-colored-initial-hue" min="0" max="360" step="1" type="range" value="${heading.initialHue}">
            </div>
          </label>
          <label class="fn__flex b3-label config-item fn__none">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.elementHeadingColoredOutline}</div>
              <div class="b3-label__text">${i18n.elementHeadingColoredOutlineTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-element-heading-colored-outline" type="checkbox">
          </label>
          <label class="fn__flex b3-label config-item">
            <div class="fn__flex-1 config-item__main">
              <div class="config-name">${i18n.elementHeadingLevel}</div>
              <div class="b3-label__text">${i18n.elementHeadingLevelTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-element-heading-level" type="checkbox">
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button type="button" class="b3-button b3-button--cancel" id="neo-element-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button type="button" class="b3-button b3-button--text" id="neo-element-confirm">${i18n.confirm}</button>
  </div>`;
}
export async function showElementSettings(): Promise<void> {
  const plugin = getPlugin();
  if (!plugin) return;
  const isCurrent = createNeoLifecycleGuard();
  const config = await loadConfig();
  if (!isCurrent()) return;
  const heading = readHeadingSettings(config);
  const dialog = new Dialog({
    title: `<div class="fn__flex">
      <div class="fn__ellipsis">${plugin.i18n.elementSettings}</div>
      <span class="fn__space"></span>
      <button type="button" class="b3-button b3-button--small fn__flex-center" id="neo-element-reset-default">${plugin.i18n.elementResetDefault}</button>
    </div>`,
    content: buildSettingsHTML(plugin.i18n, heading),
  });
  dialog.element.classList.add('neo-settings-dialog');
  const linkStyleSelect = dialog.element.querySelector<HTMLSelectElement>('#neo-element-link-style')!;
  const headingSelect = dialog.element.querySelector<HTMLSelectElement>('#neo-element-heading-colored')!;
  const ruleSelect = dialog.element.querySelector<HTMLSelectElement>('#neo-element-heading-colored-initial-hue-rule')!;
  const colorStyleSelect = dialog.element.querySelector<HTMLSelectElement>('#neo-element-heading-colored-color-style')!;
  const outlineSwitch = dialog.element.querySelector<HTMLInputElement>('#neo-element-heading-colored-outline')!;
  const levelSwitch = dialog.element.querySelector<HTMLInputElement>('#neo-element-heading-level')!;
  const hueItem = dialog.element.querySelector<HTMLElement>('#neo-element-heading-colored-initial-hue-item')!;
  const hueSlider = dialog.element.querySelector<HTMLInputElement>('#neo-element-heading-colored-initial-hue')!;
  const hueTooltip = dialog.element.querySelector<HTMLElement>('#neo-element-heading-colored-initial-hue-tooltip')!;
  linkStyleSelect.value = config['element-link-style'] === 'icon' ? 'icon' : 'underline';
  headingSelect.value = heading.enabled ? 'on' : 'off';
  ruleSelect.value = heading.initialHueRule;
  colorStyleSelect.value = heading.colorStyle;
  outlineSwitch.checked = heading.outline;
  levelSwitch.checked = heading.level;
  const updateVisibility = (): void => {
    const enabled = headingSelect.value === 'on';
    ruleSelect.closest('.config-item')?.classList.toggle('fn__none', !enabled);
    colorStyleSelect.closest('.config-item')?.classList.toggle('fn__none', !enabled || ruleSelect.value === 'accent');
    outlineSwitch.closest('.config-item')?.classList.toggle('fn__none', !enabled);
    hueItem.classList.toggle('fn__none', !enabled || ruleSelect.value !== 'fixed');
  };
  headingSelect.addEventListener('change', updateVisibility);
  ruleSelect.addEventListener('change', updateVisibility);
  colorStyleSelect.addEventListener('change', () => {
    const value = colorStyleSelect.value;
    hueSlider.setAttribute('data-colorstyle', value === 'soft' || value === 'vivid' ? value : 'default');
  });
  hueSlider.addEventListener('input', () => {
    hueTooltip.setAttribute('aria-label', `${hueSlider.value}deg`);
  });
  updateVisibility();
  dialog.element.querySelector('#neo-element-reset-default')?.addEventListener('click', () => {
    if (!isCurrent()) return;
    linkStyleSelect.value = 'underline';
    headingSelect.value = 'off';
    ruleSelect.value = 'theme';
    colorStyleSelect.value = 'default';
    outlineSwitch.checked = true;
    levelSwitch.checked = false;
    hueSlider.value = '0';
    hueSlider.setAttribute('data-colorstyle', 'default');
    hueTooltip.setAttribute('aria-label', '0deg');
    updateVisibility();
  });
  dialog.element.querySelector('#neo-element-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-element-confirm')?.addEventListener('click', () => {
    if (!isCurrent()) {
      dialog.destroy();
      return;
    }
    const colorStyle = colorStyleSelect.value;
    const rule = ruleSelect.value;
    const hue = Number(hueSlider.value);
    const patch: Partial<Config> = {
      'element-link-style': linkStyleSelect.value === 'icon' ? 'icon' : 'underline',
      'element-heading-colored': headingSelect.value === 'on' ? 'on' : 'off',
      'element-heading-colored-outline': outlineSwitch.checked ? 'on' : 'off',
      'element-heading-level': levelSwitch.checked ? 'on' : 'off',
      'element-heading-colored-color-style': colorStyle === 'soft' || colorStyle === 'vivid' ? colorStyle : 'default',
      'element-heading-colored-initial-hue-rule': rule === 'fixed' || rule === 'accent' ? rule : 'theme',
      'element-heading-colored-initial-hue': Number.isFinite(hue) ? Math.min(360, Math.max(0, Math.round(hue))) : 0,
    };
    saveConfig(patch);
    applyElementSettings(patch);
    dialog.destroy();
  });
}
export function destroyElement(): void {
  document.documentElement.classList.remove('neo-element-link-style-icon', 'neo-element-link-style-underline');
  for (const [name, values] of Object.entries(headingClassOptions)) {
    document.documentElement.classList.remove(...values.map(value => `neo-element-heading-${name}-${value}`));
  }
  document.documentElement.style.removeProperty('--_element-heading-colored-initial-hue');
}
