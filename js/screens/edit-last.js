// A single hub for "fix the last thing I logged" across every category —
// pick a player, pick a category tab, edit that category's most-recent
// saved entry directly, with no need to open the full logging screen
// first. Each render*EditForm() below is a deliberately standalone,
// focused mini-form (not a reuse of that category's full entry screen) —
// it mirrors that screen's field set and update payload exactly, but
// leaves out everything not relevant to editing one existing record
// (repeat-last-entry, template/move creation, the recent-entries list,
// co-practice tabs). This is intentional duplication, not an oversight:
// forcing real reuse of each screen's monolithic render() would require
// splitting those apart just to serve this one new consumer.

const EDIT_LAST_CATEGORIES = [
  { key: 'workout', label: 'Workout' },
  { key: 'strength', label: 'Strength' },
  { key: 'shooting', label: 'Shooting' },
  { key: 'benchmark', label: 'Benchmark' },
  { key: 'game', label: 'Game' },
];

const EditLastScreen = {
  render(container) {
    container.innerHTML = '';
    container.appendChild(backHeader('Edit Last Entry'));
    container.appendChild(playerSwitcher(() => EditLastScreen.render(container)));

    const playerId = CurrentPlayer.get();
    const player = PLAYERS.find((p) => p.id === playerId);
    const categories = EDIT_LAST_CATEGORIES.filter((c) => effectiveScreens(player).includes(c.key));

    const body = h('div', { class: 'screen-body' });
    container.appendChild(body);

    if (categories.length === 0) {
      body.appendChild(h('div', { class: 'queue-empty', text: `${player.name} isn't tracking anything yet.` }));
      return;
    }

    let activeCategory = categories[0].key;
    const tabHost = h('div');
    const formHost = h('div');
    body.appendChild(tabHost);
    body.appendChild(formHost);

    const FORM_RENDERERS = {
      workout: renderWorkoutEditForm,
      strength: renderStrengthEditForm,
      shooting: renderShootingSessionEditForm,
      benchmark: renderBenchmarkEditForm,
      game: renderGameEditForm,
    };

    function renderForm() {
      formHost.innerHTML = '';
      FORM_RENDERERS[activeCategory](formHost, player);
    }

    tabHost.appendChild(tapSelect(
      categories.map((c) => ({ value: c.key, label: c.label })),
      activeCategory,
      (v) => { activeCategory = v; renderForm(); }
    ));

    renderForm();
  },
};

function renderWorkoutEditForm(host, player) {
  host.innerHTML = '';
  const playerId = player.id;
  const lastSaved = LastSaved.get('workout', playerId);
  if (!lastSaved) {
    host.appendChild(h('div', { class: 'queue-empty', text: `No Workout entry to edit yet for ${player.name}.` }));
    return;
  }
  const f = lastSaved.fields;
  const state = {
    date: f[FIELDS.workoutLogs.date] || todayISO(),
    category: f[FIELDS.workoutLogs.category] || 'Basketball',
    duration: f[FIELDS.workoutLogs.duration] ?? 0,
    intensity: f[FIELDS.workoutLogs.intensity] || '2',
    grade: f[FIELDS.workoutLogs.grade] || '2',
    comments: f[FIELDS.workoutLogs.comments] || '',
    videoUrl: f[FIELDS.workoutLogs.videoUrl] || '',
  };

  const dateInput = h('input', { class: 'text-input', type: 'date', value: state.date, onchange: (e) => (state.date = e.target.value) });
  const categoryTap = tapSelect(CHOICES.category3.map((c) => ({ value: c, label: c })), state.category, (v) => (state.category = v));
  const durationStep = stepper(state.duration, { min: 0, max: 240, step: 5, label: 'duration' }, (v) => (state.duration = v));
  const intensityTap = tapSelect(CHOICES.rating4.map((n) => ({ value: n, label: n })), state.intensity, (v) => (state.intensity = v));
  const gradeTap = tapSelect(CHOICES.rating4.map((n) => ({ value: n, label: n })), state.grade, (v) => (state.grade = v));
  const videoUrlInput = h('input', { class: 'text-input', type: 'url', inputmode: 'url', placeholder: 'https://youtube.com/...', value: state.videoUrl, oninput: (e) => (state.videoUrl = e.target.value) });
  const commentsArea = textArea('Optional notes…', state.comments, (v) => (state.comments = v));

  host.appendChild(fieldRow('Date', dateInput));
  host.appendChild(fieldRow('Category', categoryTap));
  host.appendChild(fieldRow('Duration (min)', durationStep));
  host.appendChild(fieldRow('Intensity (1–4)', intensityTap));
  host.appendChild(fieldRow('Performance Grade (1–4)', gradeTap));
  host.appendChild(fieldRow('YouTube / video link (optional)', videoUrlInput));
  host.appendChild(fieldRow('Comments', commentsArea));

  host.appendChild(primaryButton('Update Entry', async () => {
    const label = `${player.name} – ${state.category} – ${state.date}`;
    const fields = {
      [FIELDS.workoutLogs.logEntry]: label,
      [FIELDS.workoutLogs.player]: [playerId],
      [FIELDS.workoutLogs.date]: state.date,
      [FIELDS.workoutLogs.category]: state.category,
      [FIELDS.workoutLogs.duration]: state.duration,
      [FIELDS.workoutLogs.intensity]: state.intensity,
      [FIELDS.workoutLogs.grade]: state.grade,
      [FIELDS.workoutLogs.comments]: state.comments,
    };
    if (state.videoUrl) fields[FIELDS.workoutLogs.videoUrl] = state.videoUrl;
    const ok = await updateExistingRecord({ localId: lastSaved.localId, tableId: TABLES.workoutLogs.id }, fields);
    if (!ok) {
      toast("Couldn't find that entry to update — try refreshing", 'warn');
      return;
    }
    LastSaved.set('workout', playerId, { localId: lastSaved.localId, tableId: TABLES.workoutLogs.id, fields, screenLabel: label, savedAt: new Date().toISOString() });
    toast('Workout entry updated');
    renderWorkoutEditForm(host, player);
  }));

  stripeFieldRows(host);
}

function renderStrengthEditForm(host, player) {
  host.innerHTML = '';
  const playerId = player.id;
  const isYoungest = player.ageGroup === '9-11';
  const lastSaved = LastSaved.get('strength', playerId);
  if (!lastSaved) {
    host.appendChild(h('div', { class: 'queue-empty', text: `No Strength entry to edit yet for ${player.name}.` }));
    return;
  }
  const f = lastSaved.fields;
  const rawExercise = f[FIELDS.strengthLogs.exercise] || COMMON_EXERCISES[0];
  const state = {
    date: f[FIELDS.strengthLogs.date] || todayISO(),
    exercise: COMMON_EXERCISES.includes(rawExercise) ? rawExercise : 'Other',
    customExercise: COMMON_EXERCISES.includes(rawExercise) ? '' : rawExercise,
    weight: f[FIELDS.strengthLogs.weight] ?? 0,
    reps: f[FIELDS.strengthLogs.reps] ?? 1,
    sets: f[FIELDS.strengthLogs.sets] ?? 1,
    notes: f[FIELDS.strengthLogs.notes] || '',
  };

  const dateInput = h('input', { class: 'text-input', type: 'date', value: state.date, onchange: (e) => (state.date = e.target.value) });
  const customExerciseInput = h('input', {
    class: 'text-input',
    placeholder: 'Type exercise name…',
    value: state.customExercise,
    style: state.exercise === 'Other' ? '' : 'display:none',
    oninput: (e) => (state.customExercise = e.target.value),
  });
  const exerciseSelect = selectEl(COMMON_EXERCISES.map((ex) => ({ value: ex, label: ex })), state.exercise, (v) => {
    state.exercise = v;
    customExerciseInput.style.display = v === 'Other' ? '' : 'none';
  });
  const weightStep = stepper(state.weight, { min: 0, max: 500, step: isYoungest ? 5 : 2.5, label: 'weight' }, (v) => (state.weight = v));
  const repsStep = stepper(state.reps, { min: 1, max: 50, step: 1, label: 'reps' }, (v) => (state.reps = v));
  const setsStep = stepper(state.sets, { min: 1, max: 10, step: 1, label: 'sets' }, (v) => (state.sets = v));
  const notesArea = textArea('Optional notes…', state.notes, (v) => (state.notes = v));

  host.appendChild(fieldRow('Date', dateInput));
  host.appendChild(fieldRow('Exercise', exerciseSelect));
  host.appendChild(fieldRow('', customExerciseInput));
  host.appendChild(fieldRow(isYoungest ? 'Weight (0 = bodyweight)' : 'Weight (lb)', weightStep));
  host.appendChild(fieldRow('Reps', repsStep));
  host.appendChild(fieldRow('Sets', setsStep));
  host.appendChild(fieldRow('Notes', notesArea));

  host.appendChild(primaryButton('Update Entry', async () => {
    const exerciseName = state.exercise === 'Other' ? (state.customExercise || 'Other') : state.exercise;
    const label = `${player.name} – ${exerciseName} – ${state.date}`;
    const fields = {
      [FIELDS.strengthLogs.logEntry]: label,
      [FIELDS.strengthLogs.player]: [playerId],
      [FIELDS.strengthLogs.date]: state.date,
      [FIELDS.strengthLogs.exercise]: exerciseName,
      [FIELDS.strengthLogs.weight]: state.weight,
      [FIELDS.strengthLogs.reps]: state.reps,
      [FIELDS.strengthLogs.sets]: state.sets,
      [FIELDS.strengthLogs.notes]: state.notes,
    };
    const ok = await updateExistingRecord({ localId: lastSaved.localId, tableId: TABLES.strengthLogs.id }, fields);
    if (!ok) {
      toast("Couldn't find that entry to update — try refreshing", 'warn');
      return;
    }
    LastSaved.set('strength', playerId, { localId: lastSaved.localId, tableId: TABLES.strengthLogs.id, fields, screenLabel: label, savedAt: new Date().toISOString() });
    toast('Strength entry updated');
    renderStrengthEditForm(host, player);
  }));

  stripeFieldRows(host);
}

function renderBenchmarkEditForm(host, player) {
  host.innerHTML = '';
  const playerId = player.id;
  const lastSaved = LastSaved.get('benchmark', playerId);
  if (!lastSaved) {
    host.appendChild(h('div', { class: 'queue-empty', text: `No Benchmark entry to edit yet for ${player.name}.` }));
    return;
  }
  const f = lastSaved.fields;
  const state = {
    date: f[FIELDS.benchmarkResults.date] || todayISO(),
    testId: (f[FIELDS.benchmarkResults.test] || [])[0] || TESTS[0].id,
    resultValue: f[FIELDS.benchmarkResults.resultValue] ?? '',
    notes: f[FIELDS.benchmarkResults.notes] || '',
  };
  const currentTest = () => TESTS.find((t) => t.id === state.testId) || TESTS[0];

  const dateInput = h('input', { class: 'text-input', type: 'date', value: state.date, onchange: (e) => (state.date = e.target.value) });
  const resultInput = h('input', {
    class: 'text-input', type: 'number', step: 'any', inputmode: 'decimal',
    placeholder: `Result in ${currentTest().unit}`, value: state.resultValue,
    oninput: (e) => (state.resultValue = e.target.value),
  });
  const testSelect = selectEl(TESTS.map((t) => ({ value: t.id, label: `${t.name} (${t.unit})` })), state.testId, (v) => {
    state.testId = v;
    resultInput.placeholder = `Result in ${currentTest().unit}`;
  });
  const notesArea = textArea('Optional notes…', state.notes, (v) => (state.notes = v));

  host.appendChild(fieldRow('Date', dateInput));
  host.appendChild(fieldRow('Test', testSelect));
  host.appendChild(fieldRow('Result', resultInput));
  host.appendChild(fieldRow('Notes', notesArea));

  host.appendChild(primaryButton('Update Entry', async () => {
    const value = parseFloat(state.resultValue);
    if (isNaN(value)) {
      toast('Enter a result value', 'warn');
      return;
    }
    const label = `${player.name} – ${currentTest().name} – ${state.date}`;
    const fields = {
      [FIELDS.benchmarkResults.logEntry]: label,
      [FIELDS.benchmarkResults.player]: [playerId],
      [FIELDS.benchmarkResults.test]: [state.testId],
      [FIELDS.benchmarkResults.date]: state.date,
      [FIELDS.benchmarkResults.resultValue]: value,
      [FIELDS.benchmarkResults.notes]: state.notes,
    };
    const ok = await updateExistingRecord({ localId: lastSaved.localId, tableId: TABLES.benchmarkResults.id }, fields);
    if (!ok) {
      toast("Couldn't find that entry to update — try refreshing", 'warn');
      return;
    }
    LastSaved.set('benchmark', playerId, { localId: lastSaved.localId, tableId: TABLES.benchmarkResults.id, fields, screenLabel: label, savedAt: new Date().toISOString() });
    toast('Benchmark entry updated');
    renderBenchmarkEditForm(host, player);
  }));

  stripeFieldRows(host);
}

function renderGameEditForm(host, player) {
  host.innerHTML = '';
  const playerId = player.id;
  const lastSaved = LastSaved.get('game', playerId);
  if (!lastSaved) {
    host.appendChild(h('div', { class: 'queue-empty', text: `No Game entry to edit yet for ${player.name}.` }));
    return;
  }
  const f = lastSaved.fields;
  const state = {
    date: f[FIELDS.gameLog.date] || todayISO(),
    opponent: f[FIELDS.gameLog.opponent] || '',
    minutes: f[FIELDS.gameLog.minutesPlayed] ?? 0,
    points: f[FIELDS.gameLog.points] ?? 0,
    rebounds: f[FIELDS.gameLog.rebounds] ?? 0,
    assists: f[FIELDS.gameLog.assists] ?? 0,
    whatWentWell: f[FIELDS.gameLog.whatWentWell] || '',
    whatToWorkOn: f[FIELDS.gameLog.whatToWorkOn] || '',
  };

  const dateInput = h('input', { class: 'text-input', type: 'date', value: state.date, onchange: (e) => (state.date = e.target.value) });
  const opponentInput = h('input', { class: 'text-input', placeholder: 'Opponent name', value: state.opponent, oninput: (e) => (state.opponent = e.target.value) });
  const minutesStep = stepper(state.minutes, { min: 0, max: 120, label: 'minutes' }, (v) => (state.minutes = v));
  const pointsStep = stepper(state.points, { min: 0, max: 100, label: 'points' }, (v) => (state.points = v));
  const reboundsStep = stepper(state.rebounds, { min: 0, max: 50, label: 'rebounds' }, (v) => (state.rebounds = v));
  const assistsStep = stepper(state.assists, { min: 0, max: 50, label: 'assists' }, (v) => (state.assists = v));
  const wentWellArea = textArea('What went well?', state.whatWentWell, (v) => (state.whatWentWell = v));
  const workOnArea = textArea('What to work on?', state.whatToWorkOn, (v) => (state.whatToWorkOn = v));

  host.appendChild(fieldRow('Date', dateInput));
  host.appendChild(fieldRow('Opponent', opponentInput));
  host.appendChild(fieldRow('Minutes Played', minutesStep));
  host.appendChild(fieldRow('Points', pointsStep));
  host.appendChild(fieldRow('Rebounds', reboundsStep));
  host.appendChild(fieldRow('Assists', assistsStep));
  host.appendChild(fieldRow('What Went Well', wentWellArea));
  host.appendChild(fieldRow('What To Work On', workOnArea));

  host.appendChild(primaryButton('Update Entry', async () => {
    const label = `${player.name} vs ${state.opponent || 'Unknown'} – ${state.date}`;
    const fields = {
      [FIELDS.gameLog.opponent]: state.opponent,
      [FIELDS.gameLog.player]: [playerId],
      [FIELDS.gameLog.date]: state.date,
      [FIELDS.gameLog.minutesPlayed]: state.minutes,
      [FIELDS.gameLog.points]: state.points,
      [FIELDS.gameLog.rebounds]: state.rebounds,
      [FIELDS.gameLog.assists]: state.assists,
      [FIELDS.gameLog.whatWentWell]: state.whatWentWell,
      [FIELDS.gameLog.whatToWorkOn]: state.whatToWorkOn,
    };
    const ok = await updateExistingRecord({ localId: lastSaved.localId, tableId: TABLES.gameLog.id }, fields);
    if (!ok) {
      toast("Couldn't find that entry to update — try refreshing", 'warn');
      return;
    }
    LastSaved.set('game', playerId, { localId: lastSaved.localId, tableId: TABLES.gameLog.id, fields, screenLabel: label, savedAt: new Date().toISOString() });
    toast('Game entry updated');
    renderGameEditForm(host, player);
  }));

  stripeFieldRows(host);
}

// Edits the player's whole last Shooting session — every Shot Spot Result
// row, not just one — plus the session's own date/intensity/grade/comments.
// Reconciles on save: existing rows still present get PATCHed, rows the
// user removed get deleted, and any newly-added rows get created (POSTed,
// linked to the existing session via dependsOn the same way a fresh
// session's rows are). Needs Move Definitions fetched live (fetchMoves/
// mergeMoves are top-level globals in shooting.js, loaded before this file
// — see index.html order).
function renderShootingSessionEditForm(host, player) {
  host.innerHTML = '';
  const playerId = player.id;
  const lastSession = LastSaved.get('shootingSession', playerId);
  if (!lastSession) {
    host.appendChild(h('div', { class: 'queue-empty', text: `No Shooting session to edit yet for ${player.name}.` }));
    return;
  }

  const sf = lastSession.session.fields;
  const sessionState = {
    date: sf[FIELDS.shootingSessions.date] || todayISO(),
    intensity: sf[FIELDS.shootingSessions.intensity] || '2',
    grade: sf[FIELDS.shootingSessions.grade] || '2',
    comments: sf[FIELDS.shootingSessions.comments] || '',
  };
  // Working row list — existingLocalId/existingTableId are null for a row
  // added during this edit (POST on save); set for a row that was already
  // saved (PATCH on save, or delete if removed from this list before save).
  let rows = lastSession.rows.map((r) => {
    const makes = r.fields[FIELDS.shotSpotResults.makes] || 0;
    const misses = r.fields[FIELDS.shotSpotResults.misses] || 0;
    return {
      existingLocalId: r.localId,
      existingTableId: r.tableId,
      spotId: (r.fields[FIELDS.shotSpotResults.spot] || [])[0] || SPOTS[0].id,
      moveId: (r.fields[FIELDS.shotSpotResults.move] || [])[0] || '',
      moveDetail: r.fields[FIELDS.shotSpotResults.moveDetail] || '',
      attempts: makes + misses,
      makes,
      misses,
    };
  });
  const removedExistingRows = []; // {localId, tableId} pulled out of `rows` on remove, deleted on save
  let moves = mergeMoves([]); // instant, seeded + pending, refined once the live fetch resolves

  function renderRow(row, idx) {
    const rowWrap = h('div', { class: 'spot-entry-row' + (idx % 2 === 1 ? ' spot-entry-row-alt' : '') });

    const spotSelect = selectEl(SPOTS.map((s) => ({ value: s.id, label: s.name })), row.spotId, (v) => (row.spotId = v));
    const moveOptions = [{ value: '', label: 'Select a move…' }, ...moves.map((m) => ({ value: m.id, label: m.name }))];
    const moveSelect = selectEl(moveOptions, row.moveId || '', (v) => (row.moveId = v));
    const detailInput = h('input', {
      class: 'text-input', placeholder: 'Move detail (optional)', value: row.moveDetail,
      oninput: (e) => (row.moveDetail = e.target.value),
    });

    const missesDisplay = h('div', { class: 'stepper-value', text: String(row.misses) });
    const missesWrap = h('div', { class: 'stepper stepper-readonly' }, [missesDisplay]);
    const makesStep = stepper(row.makes, { min: 0, max: 99, label: 'makes' }, (v) => {
      const clamped = Math.min(v, row.attempts);
      if (clamped !== v) { makesStep.setValue(clamped); return; }
      row.makes = clamped;
      row.misses = Math.max(0, row.attempts - row.makes);
      missesDisplay.textContent = String(row.misses);
    });
    const attemptsStep = stepper(row.attempts, { min: 0, max: 99, label: 'attempts' }, (v) => {
      row.attempts = v;
      if (row.makes > v) {
        makesStep.setValue(v);
      } else {
        row.misses = Math.max(0, row.attempts - row.makes);
        missesDisplay.textContent = String(row.misses);
      }
    });

    rowWrap.appendChild(h('div', { class: 'spot-entry-header' }, [
      h('div', { class: 'spot-entry-title', text: `Spot ${idx + 1}` }),
      h('button', { class: 'btn-remove', type: 'button', 'aria-label': 'Remove this spot', onclick: () => {
        if (row.existingLocalId) removedExistingRows.push({ localId: row.existingLocalId, tableId: row.existingTableId });
        rows.splice(idx, 1);
        renderFields(null);
      } }, '✕'),
    ]));
    rowWrap.appendChild(fieldRow('Spot', spotSelect));
    rowWrap.appendChild(fieldRow('Move', moveSelect));
    rowWrap.appendChild(fieldRow('Move Detail', detailInput));
    rowWrap.appendChild(pairedFieldRow('Attempts', attemptsStep, 'Makes', makesStep));
    rowWrap.appendChild(fieldRow('Misses', missesWrap));
    return rowWrap;
  }

  function renderFields(movesError) {
    host.innerHTML = '';
    if (movesError) {
      host.appendChild(h('div', { class: 'fetch-error', text: `Couldn't load moves from Airtable: ${movesError} — check your token's table access in Settings.` }));
    }

    const dateInput = h('input', { class: 'text-input', type: 'date', value: sessionState.date, onchange: (e) => (sessionState.date = e.target.value) });
    const intensityTap = tapSelect(CHOICES.rating4.map((n) => ({ value: n, label: n })), sessionState.intensity, (v) => (sessionState.intensity = v));
    const gradeTap = tapSelect(CHOICES.rating4.map((n) => ({ value: n, label: n })), sessionState.grade, (v) => (sessionState.grade = v));
    const commentsArea = textArea('Session notes (optional)…', sessionState.comments, (v) => (sessionState.comments = v));

    host.appendChild(fieldRow('Date', dateInput));
    host.appendChild(fieldRow('Intensity (1–4)', intensityTap));
    host.appendChild(fieldRow('Performance Grade (1–4)', gradeTap));
    host.appendChild(fieldRow('Comments', commentsArea));

    host.appendChild(h('h3', { class: 'section-heading', text: 'Shots' }));
    if (rows.length === 0) {
      host.appendChild(h('div', { class: 'queue-empty', text: 'No spots left — add one below, or leave empty to remove them all from this session.' }));
    }
    rows.forEach((row, idx) => host.appendChild(renderRow(row, idx)));

    host.appendChild(secondaryButton('+ Add spot', () => {
      rows.push({ existingLocalId: null, existingTableId: null, spotId: SPOTS[0].id, moveId: '', moveDetail: '', attempts: 0, makes: 0, misses: 0 });
      renderFields(movesError);
    }));

    host.appendChild(primaryButton('Update Session', async () => {
      const sessionOk = await updateExistingRecord(
        { localId: lastSession.session.localId, tableId: lastSession.session.tableId },
        {
          [FIELDS.shootingSessions.date]: sessionState.date,
          [FIELDS.shootingSessions.intensity]: sessionState.intensity,
          [FIELDS.shootingSessions.grade]: sessionState.grade,
          [FIELDS.shootingSessions.comments]: sessionState.comments,
        }
      );
      if (!sessionOk) {
        toast("Couldn't find that session to update — try refreshing", 'warn');
        return;
      }

      for (const removed of removedExistingRows) {
        const resolvedId = ResolvedIds.get(removed.localId);
        if (resolvedId) {
          await airtableDeleteOne(removed.tableId, resolvedId);
        } else {
          Queue.remove(removed.localId);
        }
      }

      const newTrackedRows = [];
      for (const row of rows) {
        const spot = SPOTS.find((s) => s.id === row.spotId);
        const move = moves.find((m) => m.id === row.moveId);
        const fields = {
          [FIELDS.shotSpotResults.logEntry]: `${spot ? spot.name : 'Spot'} – ${move ? move.name.replace(' (syncing…)', '') : 'Move'} – ${row.makes}/${row.makes + row.misses}`,
          [FIELDS.shotSpotResults.spot]: [row.spotId],
          [FIELDS.shotSpotResults.makes]: row.makes,
          [FIELDS.shotSpotResults.misses]: row.misses,
        };
        if (row.moveDetail) fields[FIELDS.shotSpotResults.moveDetail] = row.moveDetail;
        // A brand-new, still-unsynced move can't be relinked via PATCH on an
        // existing row — same limitation as the in-flow Shooting editor.
        if (row.moveId && move && !move.isLocal) fields[FIELDS.shotSpotResults.move] = [row.moveId];

        if (row.existingLocalId) {
          await updateExistingRecord({ localId: row.existingLocalId, tableId: row.existingTableId }, fields);
          newTrackedRows.push({ localId: row.existingLocalId, tableId: row.existingTableId, fields });
        } else {
          const newLocalId = uuid();
          const dependsOn = [{ localId: lastSession.session.localId, linkField: FIELDS.shotSpotResults.session }];
          if (row.moveId && move && move.isLocal) dependsOn.push({ localId: row.moveId, linkField: FIELDS.shotSpotResults.move });
          Queue.add({
            localId: newLocalId,
            tableId: TABLES.shotSpotResults.id,
            fields,
            dependsOn,
            status: 'pending',
            createdAt: new Date().toISOString(),
            screenLabel: `${spot ? spot.name : 'Spot'} (${player.name} session edit)`,
          });
          newTrackedRows.push({ localId: newLocalId, tableId: TABLES.shotSpotResults.id, fields });
        }
      }

      LastSaved.set('shootingSession', playerId, {
        session: {
          localId: lastSession.session.localId,
          tableId: lastSession.session.tableId,
          fields: { ...lastSession.session.fields, ...{
            [FIELDS.shootingSessions.date]: sessionState.date,
            [FIELDS.shootingSessions.intensity]: sessionState.intensity,
            [FIELDS.shootingSessions.grade]: sessionState.grade,
            [FIELDS.shootingSessions.comments]: sessionState.comments,
          } },
        },
        rows: newTrackedRows,
        savedAt: new Date().toISOString(),
      });
      Sync.flush();
      toast('Session updated');
      renderShootingSessionEditForm(host, player);
    }));

    stripeFieldRows(host);
  }

  host.appendChild(h('div', { class: 'queue-empty', text: 'Loading moves…' }));
  fetchMoves().then((result) => {
    moves = mergeMoves(result.moves);
    renderFields(result.ok ? null : result.error);
  });
}
