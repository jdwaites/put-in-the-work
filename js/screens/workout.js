const WorkoutScreen = {
  render(container) {
    container.innerHTML = '';
    container.appendChild(backHeader('Log Workout'));
    container.appendChild(playerSwitcher(() => WorkoutScreen.render(container)));

    const playerId = CurrentPlayer.get();
    const player = PLAYERS.find((p) => p.id === playerId);
    const last = LastEntry.get('workout', playerId);

    const state = {
      date: todayISO(),
      category: (last && last.category) || 'Basketball',
      duration: (last && last.duration) || 30,
      intensity: (last && last.intensity) || '2',
      grade: (last && last.grade) || '2',
      comments: '',
    };

    const body = h('div', { class: 'screen-body' });

    if (last) {
      body.appendChild(secondaryButton('↺ Repeat last entry', () => {
        Object.assign(state, last, { comments: last.comments || '' });
        renderForm();
      }));
    }

    const formHost = h('div');
    body.appendChild(formHost);
    container.appendChild(body);

    function renderForm() {
      formHost.innerHTML = '';

      const dateInput = h('input', { class: 'text-input', type: 'date', value: state.date, onchange: (e) => (state.date = e.target.value) });

      const categoryTap = tapSelect(
        CHOICES.category3.map((c) => ({ value: c, label: c })),
        state.category,
        (v) => (state.category = v)
      );

      const durationStep = stepper(state.duration, { min: 5, max: 240, step: 5, label: 'duration' }, (v) => (state.duration = v));

      const intensityTap = tapSelect(
        CHOICES.rating4.map((n) => ({ value: n, label: n })),
        state.intensity,
        (v) => (state.intensity = v)
      );

      const gradeTap = tapSelect(
        CHOICES.rating4.map((n) => ({ value: n, label: n })),
        state.grade,
        (v) => (state.grade = v)
      );

      const commentsArea = textArea('Optional notes…', state.comments, (v) => (state.comments = v));

      formHost.appendChild(fieldRow('Date', dateInput));
      formHost.appendChild(fieldRow('Category', categoryTap));
      formHost.appendChild(fieldRow('Duration (min)', durationStep));
      formHost.appendChild(fieldRow('Intensity (1–4)', intensityTap));
      formHost.appendChild(fieldRow('Performance Grade (1–4)', gradeTap));
      formHost.appendChild(fieldRow('Comments', commentsArea));

      formHost.appendChild(primaryButton('Save Workout', () => {
        const localId = uuid();
        const label = `${player.name} – ${state.category} – ${state.date}`;
        Queue.add({
          localId,
          tableId: TABLES.workoutLogs.id,
          fields: {
            [FIELDS.workoutLogs.logEntry]: label,
            [FIELDS.workoutLogs.player]: [playerId],
            [FIELDS.workoutLogs.date]: state.date,
            [FIELDS.workoutLogs.category]: state.category,
            [FIELDS.workoutLogs.duration]: state.duration,
            [FIELDS.workoutLogs.intensity]: state.intensity,
            [FIELDS.workoutLogs.grade]: state.grade,
            [FIELDS.workoutLogs.comments]: state.comments,
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
          screenLabel: label,
          onSyncedTag: 'workoutLog',
          playerIdForCache: playerId,
        });
        LastEntry.set('workout', playerId, { category: state.category, duration: state.duration, intensity: state.intensity, grade: state.grade, comments: state.comments });
        Sync.flush();
        toast('Workout saved — syncing');
        WorkoutScreen.render(container);
      }));
    }

    renderForm();
  },
};
