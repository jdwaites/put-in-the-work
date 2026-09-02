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

    const state = {
      date: todayISO(),
      exercise: (last && last.exercise) || COMMON_EXERCISES[0],
      customExercise: (last && last.customExercise) || '',
      weight: last ? last.weight : (isYoungest ? 0 : 20),
      reps: last ? last.reps : (isYoungest ? 12 : 8),
      sets: last ? last.sets : 3,
      linkedWorkoutId: '',
      notes: '',
    };

    const body = h('div', { class: 'screen-body' });
    if (last) {
      body.appendChild(secondaryButton('↺ Repeat last entry', () => {
        Object.assign(state, last, { notes: last.notes || '' });
        renderForm();
      }));
    }
    if (lastSaved) {
      body.appendChild(secondaryButton('✎ Edit last entry', () => {
        const f = lastSaved.fields;
        state.date = f[FIELDS.strengthLogs.date] || state.date;
        state.exercise = f[FIELDS.strengthLogs.exercise] || state.exercise;
        state.customExercise = COMMON_EXERCISES.includes(state.exercise) ? '' : state.exercise;
        if (state.customExercise) state.exercise = 'Other';
        state.weight = f[FIELDS.strengthLogs.weight] ?? state.weight;
        state.reps = f[FIELDS.strengthLogs.reps] ?? state.reps;
        state.sets = f[FIELDS.strengthLogs.sets] ?? state.sets;
        state.notes = f[FIELDS.strengthLogs.notes] || '';
        editingLocalId = lastSaved.localId;
        renderForm();
      }));
    }
    if (isYoungest) {
      body.appendChild(h('div', { class: 'age-hint', text: `${player.name} mode: defaults to bodyweight, high reps. No max-weight testing here.` }));
    } else if (player.ageGroup === '12-14') {
      body.appendChild(h('div', { class: 'age-hint', text: `${player.name} mode: track weight × reps × sets. Occasional 5-rep max is fine — skip true 1RM attempts.` }));
    }

    const formHost = h('div');
    const recentHost = h('div');
    body.appendChild(formHost);
    body.appendChild(recentHost);
    container.appendChild(body);

    function renderForm() {
      formHost.innerHTML = '';

      const dateInput = h('input', { class: 'text-input', type: 'date', value: state.date, onchange: (e) => (state.date = e.target.value) });

      const customExerciseInput = h('input', {
        class: 'text-input',
        placeholder: 'Type exercise name…',
        value: state.customExercise,
        style: state.exercise === 'Other' ? '' : 'display:none',
        oninput: (e) => (state.customExercise = e.target.value),
      });

      const exerciseSelect = selectEl(
        COMMON_EXERCISES.map((ex) => ({ value: ex, label: ex })),
        state.exercise,
        (v) => {
          state.exercise = v;
          customExerciseInput.style.display = v === 'Other' ? '' : 'none';
        }
      );

      const weightStep = stepper(state.weight, { min: 0, max: 500, step: isYoungest ? 5 : 2.5, label: 'weight' }, (v) => (state.weight = v));
      const repsStep = stepper(state.reps, { min: 1, max: 50, step: 1, label: 'reps' }, (v) => (state.reps = v));
      const setsStep = stepper(state.sets, { min: 1, max: 10, step: 1, label: 'sets' }, (v) => (state.sets = v));

      const recentWorkouts = RecentWorkouts.forPlayer(playerId);
      const workoutOptions = [{ value: '', label: 'None' }, ...recentWorkouts.map((w) => ({ value: w.id, label: w.label }))];
      const workoutSelect = selectEl(workoutOptions, state.linkedWorkoutId, (v) => (state.linkedWorkoutId = v));

      const notesArea = textArea('Optional notes…', state.notes, (v) => (state.notes = v));

      formHost.appendChild(fieldRow('Date', dateInput));
      formHost.appendChild(fieldRow('Exercise', exerciseSelect));
      formHost.appendChild(fieldRow('', customExerciseInput));
      formHost.appendChild(fieldRow(isYoungest ? 'Weight (0 = bodyweight)' : 'Weight (lb)', weightStep));
      formHost.appendChild(fieldRow('Reps', repsStep));
      formHost.appendChild(fieldRow('Sets', setsStep));
      formHost.appendChild(fieldRow('Link to a recent workout', workoutSelect));
      formHost.appendChild(fieldRow('Notes', notesArea));

      formHost.appendChild(primaryButton(editingLocalId ? 'Update Entry' : 'Save Strength Entry', async () => {
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
        if (state.linkedWorkoutId) {
          fields[FIELDS.strengthLogs.linkedWorkout] = [state.linkedWorkoutId];
        }

        if (editingLocalId) {
          const ok = await updateExistingRecord({ localId: editingLocalId, tableId: TABLES.strengthLogs.id }, fields);
          if (!ok) {
            toast("Couldn't find that entry to update — try refreshing", 'warn');
            return;
          }
          LastSaved.set('strength', playerId, { localId: editingLocalId, tableId: TABLES.strengthLogs.id, fields, screenLabel: label, savedAt: new Date().toISOString() });
          toast('Entry updated');
        } else {
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
          Sync.flush();
          toast('Strength entry saved — syncing');
        }
        LastEntry.set('strength', playerId, {
          exercise: state.exercise, customExercise: state.customExercise,
          weight: state.weight, reps: state.reps, sets: state.sets, notes: state.notes,
        });
        StrengthScreen.render(container);
      }));

      stripeFieldRows(formHost);
    }

    renderForm();

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
