function emptyStrengthRow(seed, isYoungest) {
  return {
    date: todayISO(),
    exercise: (seed && seed.exercise) || COMMON_EXERCISES[0],
    customExercise: (seed && seed.customExercise) || '',
    weight: seed ? seed.weight : (isYoungest ? 0 : 20),
    reps: seed ? seed.reps : (isYoungest ? 12 : 8),
    sets: seed ? seed.sets : 3,
    linkedWorkoutId: (seed && seed.linkedWorkoutId) || '',
    notes: '',
  };
}

const StrengthScreen = {
  render(container) {
    container.innerHTML = '';
    container.appendChild(backHeader('Log Strength'));
    container.appendChild(playerSwitcher(() => StrengthScreen.render(container)));

    const playerId = CurrentPlayer.get();
    const player = PLAYERS.find((p) => p.id === playerId);
    const isYoungest = player.ageGroup === '9-11'; // bodyweight/high-rep defaults, no max-weight prompts
    const last = LastEntry.get('strength', playerId);
    let lastSaved = LastSaved.get('strength', playerId);
    let editingLocalId = null;
    const editState = { date: todayISO(), exercise: COMMON_EXERCISES[0], customExercise: '', weight: 0, reps: 1, sets: 1, notes: '' };

    // A batch of rows for one sitting — Strength Logs have no parent
    // "session" record (unlike Shooting), so each row is just an
    // independent record; batching here is purely a workflow convenience
    // so several exercises can be queued and submitted together instead of
    // one Save tap per exercise.
    let draftRows = StrengthDrafts.get(playerId);
    if (draftRows.length === 0) draftRows = [emptyStrengthRow(last, isYoungest)];
    function persistDraft() {
      StrengthDrafts.save(playerId, draftRows);
    }

    const body = h('div', { class: 'screen-body' });
    if (last) {
      body.appendChild(secondaryButton('↺ Repeat last entry', () => {
        draftRows = [emptyStrengthRow(last, isYoungest)];
        Object.assign(draftRows[0], last, { notes: last.notes || '' });
        persistDraft();
        renderRows();
      }));
    }
    if (lastSaved) {
      body.appendChild(secondaryButton('✎ Edit last entry', () => {
        const f = lastSaved.fields;
        editState.date = f[FIELDS.strengthLogs.date] || editState.date;
        editState.exercise = f[FIELDS.strengthLogs.exercise] || editState.exercise;
        editState.customExercise = COMMON_EXERCISES.includes(editState.exercise) ? '' : editState.exercise;
        if (editState.customExercise) editState.exercise = 'Other';
        editState.weight = f[FIELDS.strengthLogs.weight] ?? editState.weight;
        editState.reps = f[FIELDS.strengthLogs.reps] ?? editState.reps;
        editState.sets = f[FIELDS.strengthLogs.sets] ?? editState.sets;
        editState.notes = f[FIELDS.strengthLogs.notes] || '';
        editingLocalId = lastSaved.localId;
        renderEdit();
      }));
    }
    if (isYoungest) {
      body.appendChild(h('div', { class: 'age-hint', text: `${player.name} mode: defaults to bodyweight, high reps. No max-weight testing here.` }));
    } else if (player.ageGroup === '12-14') {
      body.appendChild(h('div', { class: 'age-hint', text: `${player.name} mode: track weight × reps × sets. Occasional 5-rep max is fine — skip true 1RM attempts.` }));
    }

    const editHost = h('div');
    const rowsHost = h('div');
    const recentHost = h('div');
    body.appendChild(editHost);
    body.appendChild(rowsHost);
    body.appendChild(recentHost);
    container.appendChild(body);

    // Standalone "fix my last entry" panel — deliberately separate from the
    // batch-entry rows below (editing an existing record vs. queuing new
    // ones are different actions; mixing them into one row list risked a
    // stray edit accidentally re-submitting as a duplicate create).
    function renderEdit() {
      editHost.innerHTML = '';
      if (!editingLocalId) return;

      const customExerciseInput = h('input', {
        class: 'text-input', placeholder: 'Type exercise name…', value: editState.customExercise,
        style: editState.exercise === 'Other' ? '' : 'display:none',
        oninput: (e) => (editState.customExercise = e.target.value),
      });
      const exerciseSelect = selectEl(COMMON_EXERCISES.map((ex) => ({ value: ex, label: ex })), editState.exercise, (v) => {
        editState.exercise = v;
        customExerciseInput.style.display = v === 'Other' ? '' : 'none';
      });
      const weightStep = stepper(editState.weight, { min: 0, max: 500, step: isYoungest ? 5 : 2.5, label: 'weight' }, (v) => (editState.weight = v));
      const repsStep = stepper(editState.reps, { min: 1, max: 50, step: 1, label: 'reps' }, (v) => (editState.reps = v));
      const setsStep = stepper(editState.sets, { min: 1, max: 10, step: 1, label: 'sets' }, (v) => (editState.sets = v));
      const notesArea = textArea('Optional notes…', editState.notes, (v) => (editState.notes = v));
      const dateInput = h('input', { class: 'text-input', type: 'date', value: editState.date, onchange: (e) => (editState.date = e.target.value) });

      const wrap = h('div', { class: 'inline-add-form' });
      wrap.appendChild(h('h3', { class: 'section-heading', text: 'Edit last entry' }));
      wrap.appendChild(fieldRow('Date', dateInput));
      wrap.appendChild(fieldRow('Exercise', exerciseSelect));
      wrap.appendChild(fieldRow('', customExerciseInput));
      wrap.appendChild(fieldRow(isYoungest ? 'Weight (0 = bodyweight)' : 'Weight (lb)', weightStep));
      wrap.appendChild(fieldRow('Reps', repsStep));
      wrap.appendChild(fieldRow('Sets', setsStep));
      wrap.appendChild(fieldRow('Notes', notesArea));
      wrap.appendChild(primaryButton('Update Entry', async () => {
        const exerciseName = editState.exercise === 'Other' ? (editState.customExercise || 'Other') : editState.exercise;
        const label = `${player.name} – ${exerciseName} – ${editState.date}`;
        const fields = {
          [FIELDS.strengthLogs.logEntry]: label,
          [FIELDS.strengthLogs.player]: [playerId],
          [FIELDS.strengthLogs.date]: editState.date,
          [FIELDS.strengthLogs.exercise]: exerciseName,
          [FIELDS.strengthLogs.weight]: editState.weight,
          [FIELDS.strengthLogs.reps]: editState.reps,
          [FIELDS.strengthLogs.sets]: editState.sets,
          [FIELDS.strengthLogs.notes]: editState.notes,
        };
        const ok = await updateExistingRecord({ localId: editingLocalId, tableId: TABLES.strengthLogs.id }, fields);
        if (!ok) {
          toast("Couldn't find that entry to update — try refreshing", 'warn');
          return;
        }
        LastSaved.set('strength', playerId, { localId: editingLocalId, tableId: TABLES.strengthLogs.id, fields, screenLabel: label, savedAt: new Date().toISOString() });
        toast('Entry updated');
        editingLocalId = null;
        StrengthScreen.render(container);
      }));
      wrap.appendChild(secondaryButton('Cancel', () => {
        editingLocalId = null;
        renderEdit();
      }));
      editHost.appendChild(wrap);
    }

    function renderRow(row, idx) {
      const wrap = h('div', { class: 'spot-entry-row' + (idx % 2 === 1 ? ' spot-entry-row-alt' : '') });

      const dateInput = h('input', { class: 'text-input', type: 'date', value: row.date, onchange: (e) => { row.date = e.target.value; persistDraft(); } });
      const customExerciseInput = h('input', {
        class: 'text-input', placeholder: 'Type exercise name…', value: row.customExercise,
        style: row.exercise === 'Other' ? '' : 'display:none',
        oninput: (e) => { row.customExercise = e.target.value; persistDraft(); },
      });
      const exerciseSelect = selectEl(COMMON_EXERCISES.map((ex) => ({ value: ex, label: ex })), row.exercise, (v) => {
        row.exercise = v;
        customExerciseInput.style.display = v === 'Other' ? '' : 'none';
        persistDraft();
      });
      const weightStep = stepper(row.weight, { min: 0, max: 500, step: isYoungest ? 5 : 2.5, label: 'weight' }, (v) => { row.weight = v; persistDraft(); });
      const repsStep = stepper(row.reps, { min: 1, max: 50, step: 1, label: 'reps' }, (v) => { row.reps = v; persistDraft(); });
      const setsStep = stepper(row.sets, { min: 1, max: 10, step: 1, label: 'sets' }, (v) => { row.sets = v; persistDraft(); });
      const recentWorkouts = RecentWorkouts.forPlayer(playerId);
      const workoutOptions = [{ value: '', label: 'None' }, ...recentWorkouts.map((w) => ({ value: w.id, label: w.label }))];
      const workoutSelect = selectEl(workoutOptions, row.linkedWorkoutId, (v) => { row.linkedWorkoutId = v; persistDraft(); });
      const notesArea = textArea('Optional notes…', row.notes, (v) => { row.notes = v; persistDraft(); });

      wrap.appendChild(h('div', { class: 'spot-entry-header' }, [
        h('div', { class: 'spot-entry-title', text: `Exercise ${idx + 1}` }),
        draftRows.length > 1
          ? h('button', { class: 'btn-remove', type: 'button', 'aria-label': 'Remove this exercise', onclick: () => {
              draftRows.splice(idx, 1);
              persistDraft();
              renderRows();
            } }, '✕')
          : null,
      ]));
      wrap.appendChild(fieldRow('Date', dateInput));
      wrap.appendChild(fieldRow('Exercise', exerciseSelect));
      wrap.appendChild(fieldRow('', customExerciseInput));
      wrap.appendChild(fieldRow(isYoungest ? 'Weight (0 = bodyweight)' : 'Weight (lb)', weightStep));
      wrap.appendChild(fieldRow('Reps', repsStep));
      wrap.appendChild(fieldRow('Sets', setsStep));
      wrap.appendChild(fieldRow('Link to a recent workout', workoutSelect));
      wrap.appendChild(fieldRow('Notes', notesArea));
      return wrap;
    }

    function renderRows() {
      rowsHost.innerHTML = '';
      draftRows.forEach((row, idx) => rowsHost.appendChild(renderRow(row, idx)));

      rowsHost.appendChild(secondaryButton('+ Add another exercise', () => {
        // Clones the row just entered (minus notes) as a starting point for
        // the next one — usually the same workout, easy to tweak from there.
        const template = draftRows[draftRows.length - 1];
        draftRows.push({ ...template, notes: '' });
        persistDraft();
        renderRows();
      }));

      const count = draftRows.length;
      rowsHost.appendChild(primaryButton(`Submit ${count} Exercise${count === 1 ? '' : 's'}`, () => {
        draftRows.forEach((row) => {
          const exerciseName = row.exercise === 'Other' ? (row.customExercise || 'Other') : row.exercise;
          const label = `${player.name} – ${exerciseName} – ${row.date}`;
          const fields = {
            [FIELDS.strengthLogs.logEntry]: label,
            [FIELDS.strengthLogs.player]: [playerId],
            [FIELDS.strengthLogs.date]: row.date,
            [FIELDS.strengthLogs.exercise]: exerciseName,
            [FIELDS.strengthLogs.weight]: row.weight,
            [FIELDS.strengthLogs.reps]: row.reps,
            [FIELDS.strengthLogs.sets]: row.sets,
            [FIELDS.strengthLogs.notes]: row.notes,
          };
          if (row.linkedWorkoutId) fields[FIELDS.strengthLogs.linkedWorkout] = [row.linkedWorkoutId];

          const localId = uuid();
          Queue.add({
            localId,
            tableId: TABLES.strengthLogs.id,
            fields,
            status: 'pending',
            createdAt: new Date().toISOString(),
            screenLabel: label,
          });
          LastSaved.set('strength', playerId, { localId, tableId: TABLES.strengthLogs.id, fields, screenLabel: label, savedAt: new Date().toISOString() });
          LastEntry.set('strength', playerId, {
            exercise: row.exercise, customExercise: row.customExercise,
            weight: row.weight, reps: row.reps, sets: row.sets, notes: row.notes, linkedWorkoutId: row.linkedWorkoutId,
          });
        });

        StrengthDrafts.clear(playerId);
        Sync.flush();
        toast(`${count} strength entr${count === 1 ? 'y' : 'ies'} saved — syncing`);
        StrengthScreen.render(container);
      }));

      stripeFieldRows(rowsHost);
    }

    renderEdit();
    renderRows();

    renderRecentEntries(recentHost, {
      tableId: TABLES.strengthLogs.id,
      playerId,
      playerFieldName: FIELDS.strengthLogs.player,
      limit: 5,
      formatSynced: (r) => `${r.fields[FIELDS.strengthLogs.exercise] || 'Exercise'} – ${r.fields[FIELDS.strengthLogs.weight] ?? 0}×${r.fields[FIELDS.strengthLogs.reps] ?? 0}×${r.fields[FIELDS.strengthLogs.sets] ?? 0} – ${r.fields[FIELDS.strengthLogs.date] || ''}`,
      formatPending: (item) => item.screenLabel,
    });
  },
};
