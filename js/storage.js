// localStorage-backed persistence: settings, current player, pending sync
// queue, resolved-id map, "repeat last entry" cache, and a small cache of
// recently-synced Workout Logs (used to optionally link a Strength Log).

const LS_KEYS = {
  settings: 'pw_settings',
  currentPlayer: 'pw_current_player',
  queue: 'pw_queue',
  resolvedIds: 'pw_resolved_ids',
  lastEntry: 'pw_last_entry',
  recentWorkouts: 'pw_recent_workouts',
  shootingDrafts: 'pw_shooting_copractice',
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

// Co-practice shooting drafts: multiple players' in-progress Shooting
// Session entries can exist at once (a co-practice session with two kids
// shooting at once shouldn't have switching the active player wipe the
// other one's rows).
// Persisted to localStorage on every change so backgrounding the browser
// mid-drill between shots never loses a row.
function emptyShootingDraft(date) {
  return { date, routineName: '', intensity: '2', grade: '2', comments: '', rows: [] };
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
