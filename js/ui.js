// Small DOM helpers + reusable tap-friendly UI components shared by every
// entry screen. No framework — plain DOM construction so there's no build
// step and nothing to bundle.

function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) el.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c === null || c === undefined) return;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return el;
}

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

// Big 3-button player switcher, pinned at the top of every screen.
// Photo avatars replace the visible name where one is set in js/data.js
// (PLAYERS[].avatar); the name still becomes the button's accessible name
// via aria-label, so it's never actually gone, just not shown on screen.
// A player with no avatar (avatar: null) falls back to a plain text button.
function playerSwitcher(onChange) {
  const current = CurrentPlayer.get();
  const wrap = h('div', { class: 'player-switcher' });
  PLAYERS.forEach((p) => {
    const btn = h('button', {
      class: 'player-btn' + (p.avatar ? ' player-btn-photo' : '') + (p.id === current ? ' active' : ''),
      type: 'button',
      'aria-label': p.name,
      onclick: () => {
        CurrentPlayer.set(p.id);
        onChange(p.id);
      },
    }, p.avatar ? h('img', { class: 'player-avatar', src: p.avatar, alt: '' }) : p.name);
    wrap.appendChild(btn);
  });
  return wrap;
}

// Segmented tap-select group. options: [{value, label}]. Calls onChange(value).
function tapSelect(options, selectedValue, onChange, extraClass = '') {
  const wrap = h('div', { class: `tap-select ${extraClass}` });
  let current = selectedValue;
  const buttons = [];
  options.forEach((opt) => {
    const btn = h('button', {
      class: 'tap-option' + (opt.value === current ? ' active' : ''),
      type: 'button',
      onclick: () => {
        current = opt.value;
        buttons.forEach((b) => b.classList.toggle('active', b.dataset.value === String(current)));
        onChange(current);
      },
      text: opt.label,
    });
    btn.dataset.value = String(opt.value);
    buttons.push(btn);
    wrap.appendChild(btn);
  });
  wrap.getValue = () => current;
  return wrap;
}

// Large-tap-target numeric stepper. onChange(value) fires on every change —
// from the -/+ buttons, from typing a number directly into the field, or
// from a quickAdds shortcut button. quickAdds (e.g. [5, 10]) renders a row
// of "+5"/"+10"-style buttons below the main row for quickly bumping a
// count by a fixed chunk, like hitting a preset button on a microwave.
function stepper(initial, { min = 0, max = 999, step = 1, label = '', quickAdds = [] } = {}, onChange) {
  let value = initial;
  const clamp = (v) => Math.min(max, Math.max(min, v));

  const input = h('input', {
    class: 'stepper-value stepper-input',
    type: 'number',
    inputmode: 'numeric',
    min: String(min),
    max: String(max),
    value: String(value),
    'aria-label': label,
  });

  const set = (v) => {
    value = clamp(v);
    input.value = String(value);
    onChange(value);
  };

  // Typing isn't clamped keystroke-by-keystroke (that would fight a user
  // mid-type on a two-digit number) — it commits, and clamps, on blur/Enter.
  const commitTyped = () => {
    const parsed = parseInt(input.value, 10);
    set(isNaN(parsed) ? value : parsed);
  };
  input.addEventListener('blur', commitTyped);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
  });

  const mainRow = h('div', { class: 'stepper' }, [
    h('button', { class: 'stepper-btn', type: 'button', 'aria-label': `Decrease ${label}`, onclick: () => set(value - step) }, '−'),
    input,
    h('button', { class: 'stepper-btn', type: 'button', 'aria-label': `Increase ${label}`, onclick: () => set(value + step) }, '+'),
  ]);

  let wrap = mainRow;
  if (quickAdds.length > 0) {
    const quickAddRow = h('div', { class: 'stepper-quickadds' }, quickAdds.map((n) =>
      h('button', { class: 'stepper-quickadd', type: 'button', 'aria-label': `Add ${n} to ${label}`, onclick: () => set(value + n) }, `+${n}`)
    ));
    wrap = h('div', { class: 'stepper-group' }, [mainRow, quickAddRow]);
  }
  wrap.getValue = () => value;
  wrap.setValue = set;
  return wrap;
}

function fieldRow(labelText, control) {
  return h('div', { class: 'field-row' }, [
    h('label', { class: 'field-label', text: labelText }),
    control,
  ]);
}

// Alternates a background tint across every other top-level .field-row in
// a container, purely so a long sequential form is easier to scan at a
// glance. Call once after a form's fieldRow()s are all appended (not per
// field) — deliberately DOM-order-based via querySelectorAll, not CSS
// :nth-of-type, which counts by tag name among ALL sibling elements of
// that tag, not just .field-row ones; that would silently misalign
// whenever a non-field-row div (a fetch-error banner, an inline-add-form)
// is interspersed. Field-rows already living inside their own bordered box
// (an inline-add-form, Shooting's spot-entry-row) are skipped — those
// already have their own visual separation, and stripe those containers
// individually if they need it (see Shooting's own per-row alternating).
function stripeFieldRows(container) {
  const rows = Array.from(container.querySelectorAll('.field-row'))
    .filter((el) => !el.closest('.inline-add-form') && !el.closest('.spot-entry-row'));
  rows.forEach((el, i) => {
    el.classList.toggle('field-row-alt', i % 2 === 1);
  });
}

function selectEl(options, selectedValue, onChange) {
  const sel = h('select', { class: 'native-select', onchange: (e) => onChange(e.target.value) });
  options.forEach((opt) => {
    const o = h('option', { value: opt.value, text: opt.label });
    if (opt.value === selectedValue) o.setAttribute('selected', 'selected');
    sel.appendChild(o);
  });
  return sel;
}

function textArea(placeholder, initial, onChange) {
  return h('textarea', {
    class: 'text-area',
    placeholder,
    rows: '3',
    oninput: (e) => onChange(e.target.value),
    text: initial || '',
  });
}

function primaryButton(label, onClick) {
  return h('button', { class: 'btn-primary', type: 'button', onclick: onClick, text: label });
}

function secondaryButton(label, onClick) {
  return h('button', { class: 'btn-secondary', type: 'button', onclick: onClick, text: label });
}

function toast(message, kind = 'success') {
  const t = h('div', { class: `toast toast-${kind}`, text: message });
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 2200);
}

function backHeader(title) {
  return h('div', { class: 'screen-header' }, [
    h('a', { class: 'back-link', href: '#home', text: '← Home' }),
    h('div', { class: 'screen-title', text: title }),
    syncBadge(),
  ]);
}

function syncBadge() {
  const badge = h('div', { class: 'sync-badge', id: 'sync-badge' });
  const render = (status) => {
    if (!status.hasToken) {
      badge.textContent = '⚠ set up token';
      badge.className = 'sync-badge sync-warn';
    } else if (status.error > 0) {
      badge.textContent = `⚠ ${status.error} failed`;
      badge.className = 'sync-badge sync-error';
    } else if (status.pending > 0) {
      badge.textContent = status.online ? `⟳ Saved locally — syncing ${status.pending}` : `⏸ Sync pending — offline (${status.pending})`;
      badge.className = 'sync-badge sync-pending';
    } else {
      badge.textContent = '✓ Synced';
      badge.className = 'sync-badge sync-ok';
    }
  };
  render(Sync.status());
  Sync.onChange(render);
  badge.addEventListener('click', () => Sync.flush());
  return badge;
}
