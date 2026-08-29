const ShootingScreen = {
  render(container) {
    container.innerHTML = '';
    container.appendChild(backHeader('Log Shooting'));
    container.appendChild(playerSwitcher(() => ShootingScreen.render(container)));

    const playerId = CurrentPlayer.get();
    const player = PLAYERS.find((p) => p.id === playerId);
    const last = LastEntry.get('shooting', playerId);

    const state = {
      date: todayISO(),
      duration: (last && last.duration) || 20,
      intensity: (last && last.intensity) || '2',
      grade: (last && last.grade) || '2',
      comments: '',
      spotEntries: [], // {spotId, makes, misses}
      pendingSpotId: SPOTS[0].id,
      pendingMakes: 0,
      pendingMisses: 0,
    };

    const body = h('div', { class: 'screen-body' });
    if (last) {
      body.appendChild(secondaryButton('↺ Repeat last entry (spots included)', () => {
        state.duration = last.duration;
        state.intensity = last.intensity;
        state.grade = last.grade;
        state.spotEntries = (last.spotEntries || []).map((s) => ({ ...s }));
        renderAll();
      }));
    }

    const formHost = h('div');
    const spotListHost = h('div', { class: 'spot-list' });
    const recentHost = h('div');
    body.appendChild(formHost);
    body.appendChild(spotListHost);
    body.appendChild(recentHost);
    container.appendChild(body);

    function renderSpotList() {
      spotListHost.innerHTML = '';
      if (state.spotEntries.length === 0) {
        spotListHost.appendChild(h('div', { class: 'queue-empty', text: 'No spots logged yet — add one below.' }));
        return;
      }
      state.spotEntries.forEach((entry, idx) => {
        const spot = SPOTS.find((s) => s.id === entry.spotId);
        const pct = entry.makes + entry.misses > 0 ? Math.round((100 * entry.makes) / (entry.makes + entry.misses)) : 0;
        spotListHost.appendChild(
          h('div', { class: 'spot-row' }, [
            h('div', { class: 'spot-row-name', text: spot.name }),
            h('div', { class: 'spot-row-stats', text: `${entry.makes}/${entry.makes + entry.misses} (${pct}%)` }),
            h('button', { class: 'btn-remove', type: 'button', onclick: () => { state.spotEntries.splice(idx, 1); renderSpotList(); } }, '✕'),
          ])
        );
      });
    }

    function renderForm() {
      formHost.innerHTML = '';

      const dateInput = h('input', { class: 'text-input', type: 'date', value: state.date, onchange: (e) => (state.date = e.target.value) });
      const durationStep = stepper(state.duration, { min: 5, max: 180, step: 5, label: 'duration' }, (v) => (state.duration = v));
      const intensityTap = tapSelect(CHOICES.rating4.map((n) => ({ value: n, label: n })), state.intensity, (v) => (state.intensity = v));
      const gradeTap = tapSelect(CHOICES.rating4.map((n) => ({ value: n, label: n })), state.grade, (v) => (state.grade = v));
      const commentsArea = textArea('Optional notes…', state.comments, (v) => (state.comments = v));

      formHost.appendChild(fieldRow('Date', dateInput));
      formHost.appendChild(fieldRow('Duration (min)', durationStep));
      formHost.appendChild(fieldRow('Intensity (1–4)', intensityTap));
      formHost.appendChild(fieldRow('Performance Grade (1–4)', gradeTap));
      formHost.appendChild(fieldRow('Comments', commentsArea));

      formHost.appendChild(h('h3', { class: 'section-heading', text: 'Add a spot' }));

      const spotSelect = selectEl(
        SPOTS.map((s) => ({ value: s.id, label: s.name })),
        state.pendingSpotId,
        (v) => (state.pendingSpotId = v)
      );
      const makesStep = stepper(0, { min: 0, max: 99, label: 'makes' }, (v) => (state.pendingMakes = v));
      const missesStep = stepper(0, { min: 0, max: 99, label: 'misses' }, (v) => (state.pendingMisses = v));

      formHost.appendChild(fieldRow('Spot', spotSelect));
      formHost.appendChild(fieldRow('Makes', makesStep));
      formHost.appendChild(fieldRow('Misses', missesStep));
      formHost.appendChild(secondaryButton('+ Add spot to session', () => {
        state.spotEntries.push({ spotId: state.pendingSpotId, makes: state.pendingMakes, misses: state.pendingMisses });
        state.pendingMakes = 0;
        state.pendingMisses = 0;
        renderForm();
        renderSpotList();
      }));

      formHost.appendChild(h('div', { class: 'divider' }));

      formHost.appendChild(primaryButton('Save Shooting Session', () => {
        if (state.spotEntries.length === 0) {
          toast('Add at least one spot first', 'warn');
          return;
        }
        const sessionLocalId = uuid();
        const sessionLabel = `${player.name} – Shooting – ${state.date}`;
        Queue.add({
          localId: sessionLocalId,
          tableId: TABLES.shootingSessions.id,
          fields: {
            [FIELDS.shootingSessions.logEntry]: sessionLabel,
            [FIELDS.shootingSessions.player]: [playerId],
            [FIELDS.shootingSessions.date]: state.date,
            [FIELDS.shootingSessions.duration]: state.duration,
            [FIELDS.shootingSessions.intensity]: state.intensity,
            [FIELDS.shootingSessions.grade]: state.grade,
            [FIELDS.shootingSessions.comments]: state.comments,
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
          screenLabel: sessionLabel,
        });

        const spotItems = state.spotEntries.map((entry) => {
          const spot = SPOTS.find((s) => s.id === entry.spotId);
          return {
            localId: uuid(),
            tableId: TABLES.shotSpotResults.id,
            fields: {
              [FIELDS.shotSpotResults.logEntry]: `${spot.name} – ${entry.makes}/${entry.makes + entry.misses}`,
              [FIELDS.shotSpotResults.spot]: [entry.spotId],
              [FIELDS.shotSpotResults.makes]: entry.makes,
              [FIELDS.shotSpotResults.misses]: entry.misses,
            },
            dependsOnLocalId: sessionLocalId,
            linkFieldForParent: FIELDS.shotSpotResults.session,
            status: 'pending',
            createdAt: new Date().toISOString(),
            screenLabel: `${spot.name} (${player.name} session)`,
          };
        });
        Queue.addMany(spotItems);

        LastEntry.set('shooting', playerId, {
          duration: state.duration, intensity: state.intensity, grade: state.grade,
          spotEntries: state.spotEntries.map((s) => ({ ...s })),
        });
        Sync.flush();
        toast(`Session saved — ${spotItems.length} spot${spotItems.length === 1 ? '' : 's'} syncing`);
        ShootingScreen.render(container);
      }));
    }

    function renderAll() {
      renderForm();
      renderSpotList();
    }

    renderAll();

    renderRecentEntries(recentHost, {
      tableId: TABLES.shootingSessions.id,
      playerId,
      playerFieldName: FIELDS.shootingSessions.player,
      limit: 5,
      formatSynced: (r) => `Session – ${r.fields[FIELDS.shootingSessions.date] || ''}`,
      formatPending: (item) => item.screenLabel,
      onDeleteRecord: (recordId) => deleteShootingSessionCascade(recordId),
      onDeletePending: (item) => {
        Queue.all().filter((i) => i.dependsOnLocalId === item.localId).forEach((i) => Queue.remove(i.localId));
        Queue.remove(item.localId);
      },
    });
  },
};
