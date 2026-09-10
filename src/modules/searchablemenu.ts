import { Menu, showMessage } from 'siyuan';
function editMenuItemName(
  label: HTMLElement,
  onSave: (name: string) => Promise<boolean>,
  onFinish: (name: string | undefined, refocus: boolean) => void,
): { commit: () => Promise<void>; cancel: () => void } {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'b3-text-field b3-text-field--small fn__flex-1';
  input.value = label.textContent ?? '';
  input.setAttribute('aria-label', label.getAttribute('aria-label') ?? '');
  let submitting = false;
  let finished = false;
  const finish = (name?: string): void => {
    finished = true;
    const refocus = document.activeElement === input;
    input.replaceWith(label);
    onFinish(name, refocus);
  };
  const cancel = (): void => {
    if (!submitting && !finished) finish();
  };
  const commit = async (): Promise<void> => {
    if (submitting || finished) return;
    submitting = true;
    input.readOnly = true;
    try {
      const name = input.value.trim();
      if (await onSave(name)) finish(name);
      else if (input.isConnected) input.focus();
      else finish();
    } finally {
      submitting = false;
      input.readOnly = false;
    }
  };
  input.addEventListener('click', event => event.stopPropagation());
  input.addEventListener('blur', () => { void commit(); });
  input.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.isComposing) return;
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault();
      if (event.key === 'Enter') void commit();
      else cancel();
    }
  });
  label.replaceWith(input);
  input.focus();
  input.select();
  return { commit, cancel };
}
export function openSearchableMenu(
  trigger: HTMLButtonElement,
  items: ReadonlyArray<{ key: string; label: string }>,
  searchLabel: string,
  listLabel: string,
  onSelect: (key: string) => void | Promise<void>,
  onClose: () => void,
  actions: ReadonlyArray<{ label: string; icon: string } & ({ click: (key: string) => void | Promise<void> } | { rename: (key: string, name: string) => Promise<boolean> })> = [],
): Menu {
  let editing: ReturnType<typeof editMenuItemName> | null = null;
  const menu = new Menu(trigger.id, () => {
    void editing?.commit();
    trigger.setAttribute('aria-expanded', 'false');
    onClose();
  });
  menu.addItem({
    type: 'empty',
    label: '<div class="fn__flex-column b3-menu__filter"><div class="fn__flex"><input class="b3-text-field fn__flex-1" autocomplete="off" spellcheck="false"></div><div class="fn__hr"></div><div class="b3-list fn__flex-1 b3-list--background" role="listbox"></div></div>',
    bind: element => {
      const filter = element.firstElementChild as HTMLElement;
      const searchInput = element.querySelector('input')!;
      searchInput.placeholder = searchLabel;
      searchInput.setAttribute('aria-label', searchLabel);
      searchInput.setAttribute('role', 'combobox');
      searchInput.setAttribute('aria-expanded', 'true');
      searchInput.setAttribute('aria-controls', 'neo-searchable-menu-options');
      const list = element.querySelector<HTMLElement>('[role="listbox"]')!;
      list.id = 'neo-searchable-menu-options';
      list.setAttribute('aria-label', listLabel);
      let matched = items;
      let focused = Math.max(0, items.findIndex(item => item.key === trigger.value));
      const choose = (key: string): void => {
        menu.close();
        trigger.focus();
        void onSelect(key);
      };
      const updateFocus = (): void => {
        list.querySelector('.b3-list-item--focus')?.classList.remove('b3-list-item--focus');
        const row = matched.length ? list.children[focused] : null;
        if (row) {
          row.classList.add('b3-list-item--focus');
          searchInput.setAttribute('aria-activedescendant', row.id);
        } else {
          searchInput.removeAttribute('aria-activedescendant');
        }
      };
      const render = (): void => {
        list.replaceChildren();
        matched.forEach((item, index) => {
          const row = document.createElement('div');
          row.className = 'b3-list-item b3-list-item--narrow';
          row.classList.toggle('b3-list-item--hide-action', actions.length > 0);
          row.setAttribute('role', 'option');
          row.setAttribute('aria-selected', String(item.key === trigger.value));
          row.id = `neo-searchable-menu-option-${index}`;
          const label = document.createElement('span');
          label.className = 'b3-list-item__text ariaLabel';
          label.dataset.position = 'parentW';
          label.setAttribute('aria-label', item.label);
          label.textContent = item.label;
          row.append(label);
          for (const action of actions) {
            const button = document.createElement('span');
            button.className = 'b3-list-item__action b3-tooltips b3-tooltips__nw';
            button.setAttribute('aria-label', action.label);
            button.setAttribute('role', 'button');
            button.tabIndex = 0;
            button.innerHTML = `<svg><use xlink:href="#${action.icon}"></use></svg>`;
            button.addEventListener('click', event => {
              event.stopPropagation();
              if (editing) return;
              if ('rename' in action) {
                focused = index;
                updateFocus();
                searchInput.disabled = true;
                editing = editMenuItemName(label, name => action.rename(item.key, name), (name, refocus) => {
                  if (name !== undefined) {
                    item.key = name;
                    item.label = name;
                  }
                  editing = null;
                  searchInput.disabled = false;
                  if (list.isConnected) {
                    filterItems();
                    if (refocus) searchInput.focus();
                  }
                });
              } else {
                menu.close();
                trigger.focus();
                void action.click(item.key);
              }
            });
            button.addEventListener('keydown', event => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              event.stopPropagation();
              button.click();
            });
            row.append(button);
          }
          row.addEventListener('click', event => {
            event.stopPropagation();
            if (!editing) choose(item.key);
          });
          list.append(row);
        });
        updateFocus();
      };
      const filterItems = (): void => {
        const query = searchInput.value.trim().toLocaleLowerCase();
        matched = items.filter(item => `${item.label} ${item.key}`.toLocaleLowerCase().includes(query));
        focused = 0;
        render();
      };
      searchInput.addEventListener('input', filterItems);
      filter.addEventListener('keydown', event => {
        if (event.isComposing) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          event.stopPropagation();
          if (!matched.length) return;
          focused = (focused + (event.key === 'ArrowDown' ? 1 : -1) + matched.length) % matched.length;
          updateFocus();
          list.children[focused]?.scrollIntoView({ block: 'nearest' });
        } else if (event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          if (matched[focused]) choose(matched[focused].key);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          menu.close();
          trigger.focus();
        }
      });
      render();
    },
  });
  const rect = trigger.getBoundingClientRect();
  menu.open({ x: rect.left, y: rect.bottom, h: rect.height });
  menu.element.querySelector('.b3-menu__items')!.setAttribute('style', 'overflow: initial');
  trigger.setAttribute('aria-expanded', 'true');
  menu.element.querySelector('input')!.focus();
  menu.element.querySelector('.b3-list-item--focus')?.scrollIntoView({ block: 'nearest' });
  return menu;
}
export function showNamedMessage(message: string, name: string): void {
  showMessage(message.replace('${name}', () => name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')), 3000);
}
