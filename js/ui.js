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

// Large-tap-target numeric stepper. onChange(value) fires on every change.
function stepper(initial, { min = 0, max = 999, step = 1, label = '' } = {}, onChange) {
  let value = initial;
  const display = h('div', { class: 'stepper-value', text: String(value) });
  const clamp = (v) => Math.min(max, Math.max(min, v));
  const set = (v) => {
    value = clamp(v);
    display.textContent = String(value);
    onChange(value);
  };
  const wrap = h('div', { class: 'stepper' }, [
    h('button', { class: 'stepper-btn', type: 'button', 'aria-label': `Decrease ${label}`, onclick: () => set(value - step) }, '−'),
    display,
    h('button', { class: 'stepper-btn', type: 'button', 'aria-label': `Increase ${label}`, onclick: () => set(value + step) }, '+'),
  ]);
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
