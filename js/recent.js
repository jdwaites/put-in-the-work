// Shared "recent entries" list + delete, used at the bottom of every entry
// screen so a mis-entered value can be fixed without digging into Airtable
// directly. Reads go straight to the REST API (read-only, no local cache of
// other people's entries needed); pending (not-yet-synced) items come from
// the local queue so a just-saved entry shows up immediately.

async function airtableGet(tableId, params) {
  const { pat } = Settings.get();
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${tableId}`);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${pat}` } });
  if (!res.ok) throw new Error(`GET ${tableId} failed: ${res.status}`);
  return res.json();
}

async function airtableDeleteOne(tableId, recordId) {
  const { pat } = Settings.get();
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}/${recordId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${pat}` },
  });
  return res.ok;
}

async function airtableDeleteMany(tableId, recordIds) {
  const { pat } = Settings.get();
  for (let i = 0; i < recordIds.length; i += 10) {
    const chunk = recordIds.slice(i, i + 10);
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${tableId}`);
    chunk.forEach((id) => url.searchParams.append('records[]', id));
    const res = await fetch(url.toString(), { method: 'DELETE', headers: { Authorization: `Bearer ${pat}` } });
    if (!res.ok) return false;
  }
  return true;
}

// Fetches a recent window and filters client-side by linked record ID,
// rather than filtering server-side by the Player's Airtable display name —
// that would require this (public) file's player labels to match whatever
// name is actually typed into the Airtable base, which they deliberately
// don't (see the comment on PLAYERS in js/data.js).
async function fetchRecentRecords(tableId, playerFieldName, playerId, limit) {
  const data = await airtableGet(tableId, {
    maxRecords: '100',
    'sort[0][field]': 'Date',
    'sort[0][direction]': 'desc',
  });
  return data.records
    .filter((r) => (r.fields[playerFieldName] || []).includes(playerId))
    .slice(0, limit);
}

// Deletes a Shooting Session and every Shot Spot Result linked to it, since
// those child rows are meaningless once the parent session is gone.
async function deleteShootingSessionCascade(sessionId) {
  const data = await airtableGet(TABLES.shotSpotResults.id, { 'fields[]': FIELDS.shotSpotResults.session, pageSize: '100' });
  const childIds = data.records
    .filter((r) => (r.fields[FIELDS.shotSpotResults.session] || []).includes(sessionId))
    .map((r) => r.id);
  if (childIds.length > 0) {
    const ok = await airtableDeleteMany(TABLES.shotSpotResults.id, childIds);
    if (!ok) return false;
  }
  return airtableDeleteOne(TABLES.shootingSessions.id, sessionId);
}

function recentRow(label, onDelete, isPending) {
  const row = h('div', { class: 'recent-row' + (isPending ? ' recent-row-pending' : '') });
  const delBtn = h('button', { class: 'btn-remove', type: 'button', 'aria-label': 'Delete entry', text: '✕' });
  let confirming = false;
  let resetTimer = null;
  delBtn.addEventListener('click', () => {
    if (isPending) { onDelete(); return; }
    if (!confirming) {
      confirming = true;
      delBtn.textContent = 'Confirm?';
      delBtn.classList.add('confirming');
      resetTimer = setTimeout(() => {
        confirming = false;
        delBtn.textContent = '✕';
        delBtn.classList.remove('confirming');
      }, 3000);
    } else {
      clearTimeout(resetTimer);
      onDelete();
    }
  });
  row.appendChild(h('div', { class: 'recent-row-label', text: label }));
  row.appendChild(delBtn);
  return row;
}

// opts: { tableId, playerId, playerFieldName, limit, formatSynced(record),
//         formatPending(queueItem), onDeleteRecord(recordId) -> Promise<bool> }
function renderRecentEntries(host, opts) {
  const limit = opts.limit || 5;

  async function refresh() {
    host.innerHTML = '';
    host.appendChild(h('h3', { class: 'section-heading', text: `Recent (last ${limit})` }));

    const pendingItems = Queue.all().filter(
      (i) => i.tableId === opts.tableId
        && i.fields[opts.playerFieldName]
        && i.fields[opts.playerFieldName].includes(opts.playerId)
    );

    let synced = [];
    let fetchOk = false;
    let offlineReason = '';
    if (!Settings.hasToken()) {
      offlineReason = 'Add your Airtable token in Settings to see recent entries.';
    } else if (!navigator.onLine) {
      offlineReason = 'Offline — recent entries unavailable right now.';
    } else {
      try {
        synced = await fetchRecentRecords(opts.tableId, opts.playerFieldName, opts.playerId, limit);
        fetchOk = true;
      } catch (e) {
        offlineReason = 'Could not load recent entries — check your connection.';
      }
    }

    const list = h('div', { class: 'recent-list' });
    pendingItems.forEach((item) => {
      list.appendChild(recentRow(`${opts.formatPending(item)} (syncing…)`, () => {
        if (opts.onDeletePending) {
          opts.onDeletePending(item);
        } else {
          Queue.remove(item.localId);
        }
        refresh();
      }, true));
    });
    synced.forEach((record) => {
      list.appendChild(recentRow(opts.formatSynced(record), async () => {
        const ok = opts.onDeleteRecord
          ? await opts.onDeleteRecord(record.id)
          : await airtableDeleteOne(opts.tableId, record.id);
        if (ok) {
          toast('Entry deleted');
          refresh();
        } else {
          toast('Delete failed — check connection', 'warn');
        }
      }, false));
    });
    if (offlineReason) {
      list.appendChild(h('div', { class: 'recent-offline', text: offlineReason }));
    } else if (pendingItems.length === 0 && synced.length === 0) {
      list.appendChild(h('div', { class: 'queue-empty', text: 'No entries yet.' }));
    }
    host.appendChild(list);
  }

  refresh();
}
