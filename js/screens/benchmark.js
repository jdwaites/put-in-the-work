const BenchmarkScreen = {
  render(container) {
    container.innerHTML = '';
    container.appendChild(backHeader('Log Benchmark'));
    container.appendChild(playerSwitcher(() => BenchmarkScreen.render(container)));

    const playerId = CurrentPlayer.get();
    const player = PLAYERS.find((p) => p.id === playerId);
    const last = LastEntry.get('benchmark', playerId);

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
    const formHost = h('div');
    body.appendChild(formHost);
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

      formHost.appendChild(primaryButton('Save Benchmark', () => {
        const value = parseFloat(state.resultValue);
        if (isNaN(value)) {
          toast('Enter a result value', 'warn');
          return;
        }
        const localId = uuid();
        const label = `${player.name} – ${test.name} – ${state.date}`;
        Queue.add({
          localId,
          tableId: TABLES.benchmarkResults.id,
          fields: {
            [FIELDS.benchmarkResults.logEntry]: label,
            [FIELDS.benchmarkResults.player]: [playerId],
            [FIELDS.benchmarkResults.test]: [state.testId],
            [FIELDS.benchmarkResults.date]: state.date,
            [FIELDS.benchmarkResults.resultValue]: value,
            [FIELDS.benchmarkResults.notes]: state.notes,
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
          screenLabel: label,
        });
        LastEntry.set('benchmark', playerId, { testId: state.testId, resultValue: state.resultValue });
        Sync.flush();
        toast('Benchmark saved — syncing');
        BenchmarkScreen.render(container);
      }));
    }

    renderForm();
  },
};
