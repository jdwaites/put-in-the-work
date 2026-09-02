const BenchmarkScreen = {
  render(container) {
    container.innerHTML = '';
    container.appendChild(backHeader('Log Benchmark'));
    container.appendChild(playerSwitcher(() => BenchmarkScreen.render(container)));

    const playerId = CurrentPlayer.get();
    const player = PLAYERS.find((p) => p.id === playerId);
    const last = LastEntry.get('benchmark', playerId);
    let lastSaved = LastSaved.get('benchmark', playerId);
    let editingLocalId = null;

    const state = {
      date: todayISO(),
      testId: (last && last.testId) || TESTS[0].id,
      resultValue: (last && last.resultValue) || '',
      notes: '',
    };

    const body = h('div', { class: 'screen-body' });
    if (last) {
      body.appendChild(secondaryButton('↺ Repeat last entry', () => {
        state.testId = last.testId;
        renderForm();
      }));
    }
    if (lastSaved) {
      body.appendChild(secondaryButton('✎ Edit last entry', () => {
        const f = lastSaved.fields;
        state.date = f[FIELDS.benchmarkResults.date] || state.date;
        state.testId = (f[FIELDS.benchmarkResults.test] || [])[0] || state.testId;
        state.resultValue = f[FIELDS.benchmarkResults.resultValue] ?? state.resultValue;
        state.notes = f[FIELDS.benchmarkResults.notes] || '';
        editingLocalId = lastSaved.localId;
        renderForm();
      }));
    }
    const formHost = h('div');
    const recentHost = h('div');
    body.appendChild(formHost);
    body.appendChild(recentHost);
    container.appendChild(body);

    function renderForm() {
      formHost.innerHTML = '';
      const test = TESTS.find((t) => t.id === state.testId);

      const dateInput = h('input', { class: 'text-input', type: 'date', value: state.date, onchange: (e) => (state.date = e.target.value) });
      const testSelect = selectEl(
        TESTS.map((t) => ({ value: t.id, label: `${t.name} (${t.unit})` })),
        state.testId,
        (v) => { state.testId = v; renderForm(); }
      );
      const resultInput = h('input', {
        class: 'text-input',
        type: 'number',
        step: 'any',
        inputmode: 'decimal',
        placeholder: `Result in ${test.unit}`,
        value: state.resultValue,
        oninput: (e) => (state.resultValue = e.target.value),
      });
      const notesArea = textArea('Optional notes…', state.notes, (v) => (state.notes = v));

      formHost.appendChild(fieldRow('Date', dateInput));
      formHost.appendChild(fieldRow('Test', testSelect));
      formHost.appendChild(fieldRow(`Result (${test.unit})`, resultInput));
      formHost.appendChild(fieldRow('Notes', notesArea));

      formHost.appendChild(primaryButton(editingLocalId ? 'Update Entry' : 'Save Benchmark', async () => {
        const value = parseFloat(state.resultValue);
        if (isNaN(value)) {
          toast('Enter a result value', 'warn');
          return;
        }
        const label = `${player.name} – ${test.name} – ${state.date}`;
        const fields = {
          [FIELDS.benchmarkResults.logEntry]: label,
          [FIELDS.benchmarkResults.player]: [playerId],
          [FIELDS.benchmarkResults.test]: [state.testId],
          [FIELDS.benchmarkResults.date]: state.date,
          [FIELDS.benchmarkResults.resultValue]: value,
          [FIELDS.benchmarkResults.notes]: state.notes,
        };

        if (editingLocalId) {
          const ok = await updateExistingRecord({ localId: editingLocalId, tableId: TABLES.benchmarkResults.id }, fields);
          if (!ok) {
            toast("Couldn't find that entry to update — try refreshing", 'warn');
            return;
          }
          LastSaved.set('benchmark', playerId, { localId: editingLocalId, tableId: TABLES.benchmarkResults.id, fields, screenLabel: label, savedAt: new Date().toISOString() });
          toast('Entry updated');
        } else {
          const localId = uuid();
          Queue.add({
            localId,
            tableId: TABLES.benchmarkResults.id,
            fields,
            status: 'pending',
            createdAt: new Date().toISOString(),
            screenLabel: label,
          });
          LastSaved.set('benchmark', playerId, { localId, tableId: TABLES.benchmarkResults.id, fields, screenLabel: label, savedAt: new Date().toISOString() });
          Sync.flush();
          toast('Benchmark saved — syncing');
        }
        LastEntry.set('benchmark', playerId, { testId: state.testId, resultValue: state.resultValue });
        BenchmarkScreen.render(container);
      }));

      stripeFieldRows(formHost);
    }

    renderForm();

    renderRecentEntries(recentHost, {
      tableId: TABLES.benchmarkResults.id,
      playerId,
      playerFieldName: FIELDS.benchmarkResults.player,
      limit: 5,
      formatSynced: (r) => {
        const testId = (r.fields[FIELDS.benchmarkResults.test] || [])[0];
        const testName = (TESTS.find((t) => t.id === testId) || {}).name || 'Test';
        return `${testName} – ${r.fields[FIELDS.benchmarkResults.resultValue] ?? ''} – ${r.fields[FIELDS.benchmarkResults.date] || ''}`;
      },
      formatPending: (item) => item.screenLabel,
    });
  },
};
