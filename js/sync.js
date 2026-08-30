// Background sync engine: pushes queued records to Airtable, resolving
// parent -> child dependencies (e.g. a Shooting Session must land before its
// Shot Spot Results can reference it) by substituting the real record ID
// once the parent has synced. A queue item can depend on more than one
// not-yet-synced parent at once — e.g. a Shot Spot Result created against a
// brand-new (still-queued) Move as well as a brand-new Session — so
// `item.dependsOn` is a list of { localId, linkField } pairs, all of which
// must resolve before the item itself can push.

function unresolvedDependencies(item) {
  return (item.dependsOn || []).filter((dep) => !ResolvedIds.get(dep.localId));
}

const Sync = {
  running: false,
  listeners: [],

  onChange(fn) {
    Sync.listeners.push(fn);
  },

  notify() {
    const status = Sync.status();
    Sync.listeners.forEach((fn) => fn(status));
  },

  status() {
    const items = Queue.all();
    return {
      pending: items.filter((i) => i.status === 'pending').length,
      error: items.filter((i) => i.status === 'error').length,
      total: items.length,
      online: navigator.onLine,
      hasToken: Settings.hasToken(),
    };
  },

  async flush() {
    if (Sync.running) return;
    if (!navigator.onLine) return;
    if (!Settings.hasToken()) return;
    Sync.running = true;
    try {
      let progressed = true;
      // Loop passes so a parent synced this pass unblocks its children in
      // the same flush, without needing a second trigger.
      while (progressed) {
        progressed = false;
        const items = Queue.all();
        for (const item of items) {
          if (item.status === 'error') continue;
          if (unresolvedDependencies(item).length > 0) continue; // a parent hasn't synced yet, try next pass
          const ok = await Sync.pushOne(item);
          if (ok) progressed = true;
        }
      }
    } finally {
      Sync.running = false;
      Sync.notify();
    }
  },

  async pushOne(item) {
    try {
      let fields = { ...item.fields };
      for (const dep of (item.dependsOn || [])) {
        const parentReal = ResolvedIds.get(dep.localId);
        if (!parentReal) return false;
        fields[dep.linkField] = [parentReal];
      }
      const { pat } = Settings.get();
      const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${item.tableId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pat}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      });
      if (!res.ok) {
        const body = await res.text();
        if (res.status === 401 || res.status === 403) {
          Queue.update(item.localId, { status: 'error', error: 'Auth failed — check token in Settings' });
        } else if (res.status === 422) {
          Queue.update(item.localId, { status: 'error', error: `Rejected by Airtable: ${body.slice(0, 200)}` });
        }
        // 429/5xx and network hiccups: leave as pending, retry later.
        return false;
      }
      const data = await res.json();
      const realId = data.records[0].id;
      ResolvedIds.set(item.localId, realId);
      Queue.remove(item.localId);
      if (item.onSyncedTag === 'workoutLog') {
        RecentWorkouts.add(item.playerIdForCache, {
          id: realId,
          label: item.fields[FIELDS.workoutLogs.logEntry],
        });
      }
      return true;
    } catch (e) {
      return false; // offline mid-request or similar — retry later
    }
  },
};

window.addEventListener('online', () => Sync.flush());
setInterval(() => Sync.flush(), 20000);
