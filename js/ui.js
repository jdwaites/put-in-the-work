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

// Same idea as h(), but for SVG — document.createElement() builds SVG tags
// in the wrong namespace (they silently fail to render), so this exists as
// a separate helper rather than teaching h() to guess by tag name.
function svgEl(tag, attrs = {}, children = []) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) el.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c === null || c === undefined) return;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return el;
}

// SVG path for one equal wedge of a pie, used by courtDiagram below to
// split a single spot into one colored slice per player who has data
// there. Angles in degrees, 0 = 12 o'clock, increasing clockwise.
function pieWedgePath(cx, cy, r, startDeg, endDeg) {
  const toRad = (deg) => ((deg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

// Schematic basketball half-court with tappable zones — built for the Game
// Log shot chart. It's a visual mnemonic for the 14 named Spot Definitions,
// not real court geometry, so the lines/arc are stylized rather than to
// scale. One shared diagram covers every active player at once: `spots` is
// [{id, number, name, x, y, isActive, series}] in a 0–300 viewBox, where
// `series` is one entry per active player — [{color, hasRow, makes,
// attempts}]. A spot with no data from anyone stays a plain neutral circle;
// one player with data fills it solid in their color; two or more split it
// into equal colored pie wedges (order matches `series`) so it's legible at
// a glance whose shot is whose without needing a legend. Tapping a zone
// calls onTap(spotId).
function courtDiagram(spots, onTap) {
  const svg = svgEl('svg', { viewBox: '0 0 300 300', class: 'court-diagram', role: 'group', 'aria-label': 'Court shot chart' }, [
    svgEl('path', { d: 'M20 298 L20 235 A130 130 0 0 1 280 235 L280 298', class: 'court-line' }),
    svgEl('rect', { x: '110', y: '165', width: '80', height: '133', class: 'court-line' }),
    svgEl('circle', { cx: '150', cy: '165', r: '40', class: 'court-line court-dashed' }),
    svgEl('line', { x1: '0', y1: '298', x2: '300', y2: '298', class: 'court-line' }),
    svgEl('line', { x1: '135', y1: '282', x2: '165', y2: '282', class: 'court-line' }),
    svgEl('circle', { cx: '150', cy: '284', r: '4', class: 'court-rim' }),
  ]);
  spots.forEach((s) => {
    const withData = (s.series || []).filter((d) => d.hasRow);
    const classes = ['court-spot'];
    if (s.isActive) classes.push('court-spot-active');
    const g = svgEl('g', {
      class: classes.join(' '),
      tabindex: '0',
      role: 'button',
      'aria-label': `${s.name} — Spot ${s.number}`,
      onclick: () => onTap(s.id),
      onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(s.id); } },
    });

    if (withData.length === 0) {
      g.appendChild(svgEl('circle', { cx: String(s.x), cy: String(s.y), r: '18', class: 'court-spot-circle' }));
    } else if (withData.length === 1) {
      g.appendChild(svgEl('circle', { cx: String(s.x), cy: String(s.y), r: '18', class: 'court-spot-circle', style: `fill:${withData[0].color}` }));
    } else {
      const step = 360 / withData.length;
      withData.forEach((d, i) => {
        g.appendChild(svgEl('path', { d: pieWedgePath(s.x, s.y, 18, i * step, (i + 1) * step), style: `fill:${d.color}` }));
      });
      g.appendChild(svgEl('circle', { cx: String(s.x), cy: String(s.y), r: '18', class: 'court-spot-outline' }));
    }
    g.appendChild(svgEl('text', { x: String(s.x), y: String(s.y + 1), class: 'court-spot-number', text: String(s.number) }));
    svg.appendChild(g);

    if (withData.length > 0) {
      const statText = svgEl('text', { x: String(s.x), y: String(s.y + 30), class: 'court-spot-stat' });
      withData.forEach((d, i) => {
        if (i > 0) statText.appendChild(document.createTextNode('  '));
        statText.appendChild(svgEl('tspan', { style: `fill:${d.color}`, text: `${d.makes}/${d.attempts}` }));
      });
      svg.appendChild(statText);
    }
  });
  return svg;
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
// from the -/+ buttons or from typing a number directly into the field.
function stepper(initial, { min = 0, max = 999, step = 1, label = '' } = {}, onChange) {
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

  const wrap = h('div', { class: 'stepper' }, [
    h('button', { class: 'stepper-btn', type: 'button', 'aria-label': `Decrease ${label}`, onclick: () => set(value - step) }, '−'),
    input,
    h('button', { class: 'stepper-btn', type: 'button', 'aria-label': `Increase ${label}`, onclick: () => set(value + step) }, '+'),
  ]);
  wrap.getValue = () => value;
  wrap.setValue = set;
  return wrap;
}

// Two labeled controls side by side on one row — used where real estate
// matters more than it used to (e.g. Shooting's Attempts/Makes, now that
// direct typing means the steppers don't need full-width tap targets).
function pairedFieldRow(labelA, controlA, labelB, controlB) {
  return h('div', { class: 'field-row-pair' }, [
    h('div', { class: 'field-row-pair-item' }, [h('label', { class: 'field-label', text: labelA }), controlA]),
    h('div', { class: 'field-row-pair-item' }, [h('label', { class: 'field-label', text: labelB }), controlB]),
  ]);
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
