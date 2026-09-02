// localStorage-backed persistence: settings, current player, pending sync
// queue, resolved-id map, "repeat last entry" cache, and a small cache of
// recently-synced Workout Logs (used to optionally link a Strength Log).

const LS_KEYS = {
  settings: 'pw_settings',
  currentPlayer: 'pw_current_player',
  queue: 'pw_queue',
  resolvedIds: 'pw_resolved_ids',
  lastEntry: 'pw_last_entry',
  lastSaved: 'pw_last_saved',
  recentWorkouts: 'pw_recent_workouts',
  shootingDrafts: 'pw_shooting_copractice',
  strengthDrafts: 'pw_strength_session_drafts',
  playerScreenOverrides: 'pw_player_screen_overrides',
  onboarded: 'pw_onboarded',
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const Settings = {
  get() {
    return readJSON(LS_KEYS.settings, { pat: '' });
  },
  set(settings) {
    writeJSON(LS_KEYS.settings, settings);
  },
  hasToken() {
    const s = Settings.get();
    return !!(s.pat && s.pat.trim());
  },
};

const CurrentPlayer = {
  get() {
    return localStorage.getItem(LS_KEYS.currentPlayer) || PLAYERS[0].id;
  },
  set(playerId) {
    localStorage.setItem(LS_KEYS.currentPlayer, playerId);
  },
};

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Queue item shape:
// { localId, tableId, fields, dependsOn: [{localId, linkField}, ...],
//   status: 'pending'|'error', error, createdAt, screenLabel }
const Queue = {
  all() {
    return readJSON(LS_KEYS.queue, []);
  },
  save(items) {
    writeJSON(LS_KEYS.queue, items);
  },
  add(item) {
    const items = Queue.all();
    items.push(item);
    Queue.save(items);
    return item;
  },
  addMany(items) {
    const all = Queue.all();
    all.push(...items);
    Queue.save(all);
  },
  remove(localId) {
    Queue.save(Queue.all().filter((i) => i.localId !== localId));
  },
  update(localId, patch) {
    const items = Queue.all();
    const idx = items.findIndex((i) => i.localId === localId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...patch };
      Queue.save(items);
    }
  },
  pendingCount() {
    return Queue.all().length;
  },
  errorCount() {
    return Queue.all().filter((i) => i.status === 'error').length;
  },
};

const ResolvedIds = {
  get(localId) {
    return readJSON(LS_KEYS.resolvedIds, {})[localId];
  },
  set(localId, realId) {
    const map = readJSON(LS_KEYS.resolvedIds, {});
    map[localId] = realId;
    writeJSON(LS_KEYS.resolvedIds, map);
  },
};

const LastEntry = {
  key(screen, playerId) {
    return `${screen}:${playerId}`;
  },
  get(screen, playerId) {
    const all = readJSON(LS_KEYS.lastEntry, {});
    return all[LastEntry.key(screen, playerId)] || null;
  },
  set(screen, playerId, values) {
    const all = readJSON(LS_KEYS.lastEntry, {});
    all[LastEntry.key(screen, playerId)] = values;
    writeJSON(LS_KEYS.lastEntry, all);
  },
};

// Unlike LastEntry (a few prefill fields for the *next new* entry),
// LastSaved stores enough to re-locate and update the *exact* record just
// saved: { localId, tableId, fields, screenLabel, savedAt }. localId stays
// valid indefinitely as a lookup key whether the record has synced yet or
// not — see ResolvedIds (never expires) and Queue (removed once synced).
const LastSaved = {
  key(screen, playerId) {
    return `${screen}:${playerId}`;
  },
  get(screen, playerId) {
    const all = readJSON(LS_KEYS.lastSaved, {});
    return all[LastSaved.key(screen, playerId)] || null;
  },
  set(screen, playerId, entry) {
    const all = readJSON(LS_KEYS.lastSaved, {});
    all[LastSaved.key(screen, playerId)] = entry;
    writeJSON(LS_KEYS.lastSaved, all);
  },
  clear(screen, playerId) {
    const all = readJSON(LS_KEYS.lastSaved, {});
    delete all[LastSaved.key(screen, playerId)];
    writeJSON(LS_KEYS.lastSaved, all);
  },
};

// Co-practice shooting drafts: multiple players' in-progress Shooting
// Session entries can exist at once (a co-practice session with two kids
// shooting at once shouldn't have switching the active player wipe the
// other one's rows).
// Persisted to localStorage on every change so backgrounding the browser
// mid-drill between shots never loses a row.
function emptyShootingDraft(date) {
  // routineTouched distinguishes "never interacted with the routine picker
  // yet" (safe to auto-prefill the default routine) from "deliberately
  // picked Custom / blank" (must NOT be silently re-prefilled later) --
  // both states can otherwise look identical (routineName: '', rows: []).
  return { date, routineName: '', intensity: '2', grade: '2', comments: '', rows: [], routineTouched: false };
}

const ShootingDrafts = {
  get() {
    return readJSON(LS_KEYS.shootingDrafts, { activePlayers: [], currentActivePlayerId: null, drafts: {} });
  },
  save(state) {
    writeJSON(LS_KEYS.shootingDrafts, state);
  },
  clear() {
    writeJSON(LS_KEYS.shootingDrafts, { activePlayers: [], currentActivePlayerId: null, drafts: {} });
  },
};

// A batch of in-progress Strength Log rows for one player, persisted so
// backgrounding the browser mid-workout doesn't lose a row — same
// motivation as ShootingDrafts, just without co-practice's multi-player
// bookkeeping (Strength Logs have no parent "session" record to link
// through, so each row is just an independent draft entry).
const StrengthDrafts = {
  get(playerId) {
    const all = readJSON(LS_KEYS.strengthDrafts, {});
    return all[playerId] || [];
  },
  save(playerId, rows) {
    const all = readJSON(LS_KEYS.strengthDrafts, {});
    all[playerId] = rows;
    writeJSON(LS_KEYS.strengthDrafts, all);
  },
  clear(playerId) {
    const all = readJSON(LS_KEYS.strengthDrafts, {});
    delete all[playerId];
    writeJSON(LS_KEYS.strengthDrafts, all);
  },
};

// PLAYERS[].screens is a hardcoded const in js/data.js, not persistable at
// runtime — onboarding's sport-list step can't literally rewrite it, so a
// per-player override lives here instead. effectiveScreens() is what every
// screen-gating check should read, not player.screens directly.
const PlayerScreenOverrides = {
  get(playerId) {
    const all = readJSON(LS_KEYS.playerScreenOverrides, {});
    return all[playerId] || null;
  },
  set(playerId, screens) {
    const all = readJSON(LS_KEYS.playerScreenOverrides, {});
    all[playerId] = screens;
    writeJSON(LS_KEYS.playerScreenOverrides, all);
  },
};

function effectiveScreens(player) {
  return PlayerScreenOverrides.get(player.id) || player.screens;
}

const Onboarding = {
  isComplete() {
    if (localStorage.getItem(LS_KEYS.onboarded) === '1') return true;
    // Grandfather in installs that were already using the app before this
    // flow existed — a pre-existing CurrentPlayer choice is reliable
    // evidence of that, since every player switcher writes it on first tap.
    // Without this, shipping onboarding would force it on this app's real,
    // already-established family users, not just genuinely fresh installs.
    if (localStorage.getItem(LS_KEYS.currentPlayer)) {
      Onboarding.markComplete();
      return true;
    }
    return false;
  },
  markComplete() {
    localStorage.setItem(LS_KEYS.onboarded, '1');
  },
};

const RecentWorkouts = {
  forPlayer(playerId) {
    const all = readJSON(LS_KEYS.recentWorkouts, {});
    return all[playerId] || [];
  },
  add(playerId, entry) {
    const all = readJSON(LS_KEYS.recentWorkouts, {});
    const list = all[playerId] || [];
    list.unshift(entry);
    all[playerId] = list.slice(0, 10);
    writeJSON(LS_KEYS.recentWorkouts, all);
  },
};
