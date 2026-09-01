// Shooting screen v2: co-practice mode. A parent often shoots with two kids
// at once and wants to log both without losing progress switching between
// them, so this screen keeps one independent draft per "active" player
// (persisted to localStorage on every change, not just in JS memory, since
// backgrounding the browser between shots must not lose a row) and submits
// all of them in one action — one Shooting Session + its Shot Spot Results
// per active player.

// Returns { ok, error, moves } rather than just an array — a fetch that
// fails (e.g. the Airtable token doesn't have access to this particular
// table) must be visibly distinguishable from "fetched fine, zero moves
// defined," or the picker just looks silently broken with no way to
// diagnose why.
async function fetchMoves() {
  if (!Settings.hasToken()) return { ok: false, error: 'No Airtable token set — add one in Settings.', moves: [] };
  if (!navigator.onLine) return { ok: false, error: 'Offline.', moves: [] };
  try {
    const data = await airtableGet(TABLES.moveDefinitions.id, {
      'sort[0][field]': FIELDS.moveDefinitions.name,
      'sort[0][direction]': 'asc',
      pageSize: '100',
    });
    return {
      ok: true,
      error: null,
      moves: data.records.map((r) => ({
        id: r.id,
        name: r.fields[FIELDS.moveDefinitions.name] || '(untitled)',
        complexity: r.fields[FIELDS.moveDefinitions.complexity] || '',
        isLocal: false,
      })),
    };
  } catch (e) {
    return { ok: false, error: e.message, moves: [] };
  }
}

function pendingMoves() {
  return Queue.all()
    .filter((i) => i.tableId === TABLES.moveDefinitions.id)
    .map((i) => ({
      id: i.localId,
      name: `${i.fields[FIELDS.moveDefinitions.name]} (syncing…)`,
      complexity: i.fields[FIELDS.moveDefinitions.complexity] || '',
      isLocal: true,
    }));
}

function mergeMoves(fetched) {
  const byId = new Map();
  MOVES.forEach((m) => byId.set(m.id, { ...m, isLocal: false }));
  fetched.forEach((m) => byId.set(m.id, m));
  pendingMoves().forEach((m) => byId.set(m.id, m));
  return Array.from(byId.values());
}

// Routines are queried live, never hardcoded — new ones can be added in
// Airtable at any time without an app change. Same { ok, error, routines }
// shape as fetchMoves(), for the same reason: a permissions error on this
// table must be visible, not indistinguishable from "no routines exist."
async function fetchRoutines() {
  if (!Settings.hasToken()) return { ok: false, error: 'No Airtable token set — add one in Settings.', routines: {} };
  if (!navigator.onLine) return { ok: false, error: 'Offline.', routines: {} };
  try {
    const data = await airtableGet(TABLES.shotRoutineSteps.id, {
      'sort[0][field]': FIELDS.shotRoutineSteps.routineName,
      'sort[0][direction]': 'asc',
      'sort[1][field]': FIELDS.shotRoutineSteps.order,
      'sort[1][direction]': 'asc',
      pageSize: '100', // Airtable's hard max per request; well above the ~22 rows this table actually has today
    });
    const grouped = {};
    data.records.forEach((r) => {
      const f = r.fields;
      const routineName = f[FIELDS.shotRoutineSteps.routineName];
      if (!routineName) return; // skip blank leftover rows
      const spotArr = f[FIELDS.shotRoutineSteps.spot] || [];
      const moveArr = f[FIELDS.shotRoutineSteps.move] || [];
      (grouped[routineName] = grouped[routineName] || []).push({
        order: f[FIELDS.shotRoutineSteps.order] || 0,
        spotId: spotArr[0],
        moveId: moveArr[0],
        targetMakes: f[FIELDS.shotRoutineSteps.targetMakes],
        detail: f[FIELDS.shotRoutineSteps.stepDetail] || '',
      });
    });
    Object.values(grouped).forEach((steps) => steps.sort((a, b) => a.order - b.order));
    return { ok: true, error: null, routines: grouped };
  } catch (e) {
    return { ok: false, error: e.message, routines: {} };
  }
}

function eligiblePlayers() {
  return PLAYERS.filter((p) => p.screens.includes('shooting'));
}

const ShootingScreen = {
  render(container) {
    let moves = mergeMoves([]);
    let routinesByName = {};
    let movesFetchError = null;
    let routinesFetchError = null;
    let addingMoveForRowIndex = null; // index into current draft's rows, or null
    let confirmRemovePlayerId = null; // player id mid "Confirm?" tap for tab removal
    let showAllMakesConfirm = false; // interrupt-once panel before submitting an all-makes session

    const coState = ShootingDrafts.get();
    // Drafts saved before the Attempts stepper existed have no `.attempts` —
    // backfill it once so old in-progress drafts don't silently allow
    // makes > attempts the first time they're reopened.
    Object.values(coState.drafts).forEach((draft) => {
      (draft.rows || []).forEach((row) => {
        if (row.attempts === undefined) row.attempts = (row.makes || 0) + (row.misses || 0);
      });
    });
    const eligible = eligiblePlayers();

    if (coState.activePlayers.length === 0) {
      const seedId = eligible.some((p) => p.id === CurrentPlayer.get()) ? CurrentPlayer.get() : eligible[0].id;
      coState.activePlayers = [seedId];
      coState.currentActivePlayerId = seedId;
      coState.drafts[seedId] = emptyShootingDraft(todayISO());
    }
    // Guard against stale state (e.g. a player's screens changed).
    coState.activePlayers = coState.activePlayers.filter((id) => eligible.some((p) => p.id === id));
    if (coState.activePlayers.length === 0) {
      coState.activePlayers = [eligible[0].id];
      coState.drafts[eligible[0].id] = coState.drafts[eligible[0].id] || emptyShootingDraft(todayISO());
    }
    if (!coState.activePlayers.includes(coState.currentActivePlayerId)) {
      coState.currentActivePlayerId = coState.activePlayers[0];
    }
    ShootingDrafts.save(coState);

    container.innerHTML = '';
    container.appendChild(backHeader('Log Shooting'));

    const tabsHost = h('div');
    const body = h('div', { class: 'screen-body' });
    const recentHost = h('div');
    container.appendChild(tabsHost);
    container.appendChild(body);
    container.appendChild(recentHost);

    function persist() {
      ShootingDrafts.save(coState);
    }

    function currentDraft() {
      return coState.drafts[coState.currentActivePlayerId];
    }

    function renderTabs() {
      tabsHost.innerHTML = '';
      const wrap = h('div', { class: 'player-switcher shooting-tabs' });
      eligible.forEach((p) => {
        const isActive = coState.activePlayers.includes(p.id);
        const isCurrent = p.id === coState.currentActivePlayerId;
        const btn = h('button', {
          class: 'player-btn' + (p.avatar ? ' player-btn-photo' : '') + (isCurrent ? ' active' : isActive ? ' in-practice' : ''),
          type: 'button',
          'aria-label': p.name,
          onclick: () => {
            if (!isActive) {
              coState.activePlayers.push(p.id);
              if (!coState.drafts[p.id]) {
                const sharedDate = currentDraft() ? currentDraft().date : todayISO();
                coState.drafts[p.id] = emptyShootingDraft(sharedDate);
                applyDefaultRoutineIfPristine(p.id);
              }
            }
            coState.currentActivePlayerId = p.id;
            confirmRemovePlayerId = null;
            persist();
            renderAll();
          },
        }, p.avatar ? h('img', { class: 'player-avatar', src: p.avatar, alt: '' }) : p.name);
        wrap.appendChild(btn);
        if (isActive && coState.activePlayers.length > 1) {
          const removeBtn = h('button', {
            class: 'btn-remove tab-remove' + (confirmRemovePlayerId === p.id ? ' confirming' : ''),
            type: 'button',
            'aria-label': `Remove ${p.name} from this practice`,
            onclick: (e) => {
              e.stopPropagation();
              if (confirmRemovePlayerId === p.id) {
                coState.activePlayers = coState.activePlayers.filter((id) => id !== p.id);
                delete coState.drafts[p.id];
                if (coState.currentActivePlayerId === p.id) {
                  coState.currentActivePlayerId = coState.activePlayers[0];
                }
                confirmRemovePlayerId = null;
                persist();
                renderAll();
              } else {
                confirmRemovePlayerId = p.id;
                renderTabs();
              }
            },
          }, confirmRemovePlayerId === p.id ? 'Confirm?' : '✕');
          wrap.appendChild(removeBtn);
        }
      });
      tabsHost.appendChild(h('div', { class: 'shooting-tabs-hint', text: 'Tap a name to add them to this practice or switch to their entry.' }));
      tabsHost.appendChild(wrap);
    }

    function renderRow(row, idx) {
      const draft = currentDraft();
      const rowWrap = h('div', { class: 'spot-entry-row' });

      if (addingMoveForRowIndex === idx) {
        rowWrap.appendChild(renderAddMoveForm(idx));
        return rowWrap;
      }

      const spotSelect = selectEl(
        SPOTS.map((s) => ({ value: s.id, label: s.name })),
        row.spotId,
        (v) => { row.spotId = v; persist(); }
      );

      const moveOptions = [
        { value: '', label: 'Select a move…' },
        ...moves.map((m) => ({ value: m.id, label: m.name })),
        { value: '__new__', label: '+ Add new move…' },
      ];
      const moveSelect = selectEl(moveOptions, row.moveId || '', (v) => {
        if (v === '__new__') {
          addingMoveForRowIndex = idx;
          renderBody();
          return;
        }
        row.moveId = v;
        persist();
      });

      const detailInput = h('input', {
        class: 'text-input',
        placeholder: 'Move detail (optional) — e.g. "hesitation before the crossover"',
        value: row.moveDetail || '',
        oninput: (e) => { row.moveDetail = e.target.value; persist(); },
      });

      const missesDisplay = h('div', { class: 'stepper-value', text: String(row.misses) });
      const missesWrap = h('div', { class: 'stepper stepper-readonly' }, [missesDisplay]);

      // Makes can never exceed Attempts — clamp instead of independently
      // capping at an arbitrary ceiling, since an attempt that isn't a make
      // must show up as a miss (the real bug this fixes: misses silently
      // left at 0 made a session look like 100% makes).
      const makesStep = stepper(row.makes, { min: 0, max: 99, label: 'makes' }, (v) => {
        const clamped = Math.min(v, row.attempts);
        if (clamped !== v) { makesStep.setValue(clamped); return; }
        row.makes = clamped;
        row.misses = Math.max(0, row.attempts - row.makes);
        missesDisplay.textContent = String(row.misses);
        persist();
      });
      const attemptsStep = stepper(row.attempts, { min: 0, max: 99, label: 'attempts' }, (v) => {
        row.attempts = v;
        if (row.makes > v) {
          makesStep.setValue(v); // clamps makes down and recomputes misses
        } else {
          row.misses = Math.max(0, row.attempts - row.makes);
          missesDisplay.textContent = String(row.misses);
        }
        persist();
      });

      rowWrap.appendChild(h('div', { class: 'spot-entry-header' }, [
        h('div', { class: 'spot-entry-title', text: `Spot ${idx + 1}` }),
        h('button', { class: 'btn-remove', type: 'button', 'aria-label': 'Remove this spot', onclick: () => {
          draft.rows.splice(idx, 1);
          persist();
          renderBody();
        } }, '✕'),
      ]));
      rowWrap.appendChild(fieldRow('Spot', spotSelect));
      rowWrap.appendChild(fieldRow('Move', moveSelect));
      rowWrap.appendChild(fieldRow('Move Detail', detailInput));
      rowWrap.appendChild(fieldRow('Attempts' + (row.targetMakes ? ` (target: ${row.targetMakes})` : ''), attemptsStep));
      rowWrap.appendChild(fieldRow('Makes', makesStep));
      rowWrap.appendChild(fieldRow('Misses', missesWrap));
      return rowWrap;
    }

    function renderAddMoveForm(idx) {
      const draft = currentDraft();
      const wrap = h('div', { class: 'inline-add-form' });
      const state = { name: '', complexity: 'Moderate' };
      const nameInput = h('input', { class: 'text-input', placeholder: 'Move name', oninput: (e) => (state.name = e.target.value) });
      const complexityTap = tapSelect(CHOICES.complexity3.map((c) => ({ value: c, label: c })), state.complexity, (v) => (state.complexity = v));
      wrap.appendChild(fieldRow('New move name', nameInput));
      wrap.appendChild(fieldRow('Complexity', complexityTap));
      wrap.appendChild(secondaryButton('Save move', () => {
        if (!state.name.trim()) {
          toast('Give the move a name', 'warn');
          return;
        }
        const localId = uuid();
        Queue.add({
          localId,
          tableId: TABLES.moveDefinitions.id,
          fields: {
            [FIELDS.moveDefinitions.name]: state.name.trim(),
            [FIELDS.moveDefinitions.complexity]: state.complexity,
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
          screenLabel: `Move: ${state.name.trim()}`,
        });
        moves = mergeMoves(moves.filter((m) => !m.isLocal));
        draft.rows[idx].moveId = localId;
        addingMoveForRowIndex = null;
        persist();
        Sync.flush();
        toast('Move saved — syncing');
        renderBody();
      }));
      wrap.appendChild(secondaryButton('Cancel', () => {
        addingMoveForRowIndex = null;
        renderBody();
      }));
      return wrap;
    }

    function populateDraftFromRoutine(draft, routineName) {
      draft.routineName = routineName;
      if (routineName && routinesByName[routineName]) {
        draft.rows = routinesByName[routineName].map((step) => ({
          spotId: step.spotId || SPOTS[0].id,
          moveId: step.moveId || '',
          moveDetail: step.detail || '',
          // Prefill Makes to the step's own target (10 for a "10 makes"
          // routine, 20 for "20 makes", whatever a future routine sets) —
          // assumes the target was hit by default so a player only has to
          // adjust Makes down / Misses up for the spots that didn't go
          // perfectly, rather than tapping "+" up from zero every time.
          // Driven entirely by each step's own Target Makes, so this works
          // the same way for any routine, not just the two seeded today.
          // Attempts defaults to the same target — a perfect run is assumed,
          // same as Makes always has been.
          attempts: step.targetMakes || 0,
          makes: step.targetMakes || 0,
          misses: 0,
          targetMakes: step.targetMakes || null,
        }));
      } else {
        draft.rows = []; // "Custom (start blank)" — actually start blank
      }
    }

    function applyRoutine(routineName) {
      const draft = currentDraft();
      populateDraftFromRoutine(draft, routineName);
      draft.routineTouched = true; // a deliberate user pick, including "Custom" — never auto-override this again
      persist();
      renderBody();
    }

    // The screen should open already prefilled, not blank-until-you-notice-
    // the-dropdown — so any draft the user has never actually interacted
    // with yet gets the default routine applied the moment routine data is
    // available. `routineTouched` (not just "rows is empty") is what makes
    // this safe: a deliberate "Custom (start blank)" pick also has zero
    // rows, but must never be silently replaced on the next visit.
    function applyDefaultRoutineIfPristine(playerId) {
      const draft = coState.drafts[playerId];
      if (draft && !draft.routineTouched && draft.rows.length === 0 && routinesByName[DEFAULT_ROUTINE_NAME]) {
        populateDraftFromRoutine(draft, DEFAULT_ROUTINE_NAME);
      }
    }

    function renderBody() {
      body.innerHTML = '';
      const player = PLAYERS.find((p) => p.id === coState.currentActivePlayerId);
      const draft = currentDraft();

      body.appendChild(h('h3', { class: 'section-heading', text: `${player.name}'s entry` }));

      const dateInput = h('input', { class: 'text-input', type: 'date', value: draft.date, onchange: (e) => { draft.date = e.target.value; persist(); } });

      const routineOptions = [
        { value: '', label: 'Custom (start blank)' },
        ...Object.keys(routinesByName).map((name) => ({ value: name, label: name })),
      ];
      const routineSelect = selectEl(routineOptions, draft.routineName, (v) => applyRoutine(v));

      const intensityTap = tapSelect(CHOICES.rating4.map((n) => ({ value: n, label: n })), draft.intensity, (v) => { draft.intensity = v; persist(); });
      const gradeTap = tapSelect(CHOICES.rating4.map((n) => ({ value: n, label: n })), draft.grade, (v) => { draft.grade = v; persist(); });
      const commentsArea = textArea('Session notes (optional)…', draft.comments, (v) => { draft.comments = v; persist(); });

      body.appendChild(fieldRow('Date', dateInput));
      body.appendChild(fieldRow('Routine', routineSelect));
      if (routinesFetchError) {
        body.appendChild(h('div', { class: 'fetch-error', text: `Couldn't load routines from Airtable: ${routinesFetchError} — check your token's table access in Settings.` }));
      }
      body.appendChild(fieldRow('Intensity (1–4)', intensityTap));
      body.appendChild(fieldRow('Performance Grade (1–4)', gradeTap));
      body.appendChild(fieldRow('Comments', commentsArea));

      body.appendChild(h('h3', { class: 'section-heading', text: 'Spots' }));
      if (movesFetchError) {
        body.appendChild(h('div', { class: 'fetch-error', text: `Couldn't load moves from Airtable: ${movesFetchError} — check your token's table access in Settings.` }));
      }
      if (draft.rows.length === 0) {
        body.appendChild(h('div', { class: 'queue-empty', text: 'No spots yet — add one below or pick a routine above.' }));
      }
      draft.rows.forEach((row, idx) => body.appendChild(renderRow(row, idx)));

      body.appendChild(secondaryButton('+ Add spot', () => {
        draft.rows.push({ spotId: SPOTS[0].id, moveId: '', moveDetail: '', attempts: 0, makes: 0, misses: 0, targetMakes: null });
        persist();
        renderBody();
      }));

      body.appendChild(h('div', { class: 'divider' }));

      if (showAllMakesConfirm) {
        body.appendChild(renderAllMakesConfirmPanel());
      } else {
        const activeNames = coState.activePlayers.map((id) => PLAYERS.find((p) => p.id === id).name).join(' + ');
        body.appendChild(primaryButton(`Submit Session${coState.activePlayers.length > 1 ? 's' : ''} (${activeNames})`, checkAndSubmit));
      }
    }

    // A session where every spot came back 100% makes is more often a sign
    // Misses never got touched than a genuinely perfect practice — interrupt
    // once (not a hard block) so a parent can double-check before it saves.
    function renderAllMakesConfirmPanel() {
      const wrap = h('div', { class: 'inline-add-form' });
      wrap.appendChild(h('div', { class: 'field-label', text: 'This whole session was makes — double-check before saving?' }));
      wrap.appendChild(secondaryButton('Review entries', () => {
        showAllMakesConfirm = false;
        renderBody();
      }));
      wrap.appendChild(primaryButton('Save anyway', () => {
        showAllMakesConfirm = false;
        doSubmit();
      }));
      return wrap;
    }

    function checkAndSubmit() {
      const missingRows = coState.activePlayers.filter((id) => (coState.drafts[id].rows || []).length === 0);
      if (missingRows.length > 0) {
        const names = missingRows.map((id) => PLAYERS.find((p) => p.id === id).name).join(', ');
        toast(`Add at least one spot for ${names}`, 'warn');
        return;
      }

      const anyAllMakes = coState.activePlayers.some((id) => {
        const rows = coState.drafts[id].rows;
        const totalMakes = rows.reduce((sum, r) => sum + r.makes, 0);
        const totalMisses = rows.reduce((sum, r) => sum + r.misses, 0);
        return totalMakes > 0 && totalMisses === 0;
      });
      if (anyAllMakes) {
        showAllMakesConfirm = true;
        renderBody();
        return;
      }

      doSubmit();
    }

    function doSubmit() {
      let totalSpots = 0;
      coState.activePlayers.forEach((playerId) => {
        const player = PLAYERS.find((p) => p.id === playerId);
        const draft = coState.drafts[playerId];
        const sessionLocalId = uuid();
        const sessionLabel = `${player.name} – Shooting – ${draft.date}`;
        const sessionFields = {
          [FIELDS.shootingSessions.logEntry]: sessionLabel,
          [FIELDS.shootingSessions.player]: [playerId],
          [FIELDS.shootingSessions.date]: draft.date,
          [FIELDS.shootingSessions.intensity]: draft.intensity,
          [FIELDS.shootingSessions.grade]: draft.grade,
          [FIELDS.shootingSessions.comments]: draft.comments,
        };
        if (draft.routineName) sessionFields[FIELDS.shootingSessions.routineUsed] = draft.routineName;

        Queue.add({
          localId: sessionLocalId,
          tableId: TABLES.shootingSessions.id,
          fields: sessionFields,
          status: 'pending',
          createdAt: new Date().toISOString(),
          screenLabel: sessionLabel,
        });

        draft.rows.forEach((row) => {
          const spot = SPOTS.find((s) => s.id === row.spotId);
          const move = moves.find((m) => m.id === row.moveId);
          const dependsOn = [{ localId: sessionLocalId, linkField: FIELDS.shotSpotResults.session }];
          const fields = {
            [FIELDS.shotSpotResults.logEntry]: `${spot ? spot.name : 'Spot'} – ${move ? move.name.replace(' (syncing…)', '') : 'Move'} – ${row.makes}/${row.makes + row.misses}`,
            [FIELDS.shotSpotResults.spot]: [row.spotId],
            [FIELDS.shotSpotResults.makes]: row.makes,
            [FIELDS.shotSpotResults.misses]: row.misses,
          };
          if (row.moveDetail) fields[FIELDS.shotSpotResults.moveDetail] = row.moveDetail;
          if (row.moveId) {
            if (move && move.isLocal) {
              dependsOn.push({ localId: row.moveId, linkField: FIELDS.shotSpotResults.move });
            } else {
              fields[FIELDS.shotSpotResults.move] = [row.moveId];
            }
          }
          Queue.add({
            localId: uuid(),
            tableId: TABLES.shotSpotResults.id,
            fields,
            dependsOn,
            status: 'pending',
            createdAt: new Date().toISOString(),
            screenLabel: `${spot ? spot.name : 'Spot'} (${player.name} session)`,
          });
          totalSpots += 1;
        });
      });

      ShootingDrafts.clear();
      Sync.flush();
      toast(`${coState.activePlayers.length} session${coState.activePlayers.length > 1 ? 's' : ''} saved — ${totalSpots} spot${totalSpots === 1 ? '' : 's'} syncing`);
      ShootingScreen.render(container);
    }

    function renderRecent() {
      recentHost.innerHTML = '';
      renderRecentEntries(recentHost, {
        tableId: TABLES.shootingSessions.id,
        playerId: coState.currentActivePlayerId,
        playerFieldName: FIELDS.shootingSessions.player,
        limit: 5,
        formatSynced: (r) => {
          const routine = r.fields[FIELDS.shootingSessions.routineUsed];
          return `Session${routine ? ' – ' + routine : ''} – ${r.fields[FIELDS.shootingSessions.date] || ''}`;
        },
        formatPending: (item) => item.screenLabel,
        onDeleteRecord: (recordId) => deleteShootingSessionCascade(recordId),
        onDeletePending: (item) => {
          Queue.all().filter((i) => (i.dependsOn || []).some((d) => d.localId === item.localId)).forEach((i) => Queue.remove(i.localId));
          Queue.remove(item.localId);
        },
      });
    }

    function renderAll() {
      renderTabs();
      renderBody();
      renderRecent();
    }

    renderAll();

    fetchMoves().then((result) => {
      moves = mergeMoves(result.moves);
      movesFetchError = result.ok ? null : result.error;
      renderBody();
    });
    fetchRoutines().then((result) => {
      routinesByName = result.routines;
      routinesFetchError = result.ok ? null : result.error;
      coState.activePlayers.forEach((pid) => applyDefaultRoutineIfPristine(pid));
      persist();
      renderAll();
    });
  },
};
