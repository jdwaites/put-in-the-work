// Test Definitions are growable the same way Move Definitions and Workout
// Templates already are — queried live so a new test added in Airtable
// shows up with no app change, plus an inline "+ Add new test" create flow
// right here for adding one from the phone.

async function fetchTestDefinitions() {
  if (!Settings.hasToken()) return { ok: false, error: 'No Airtable token set — add one in Settings.', tests: [] };
  if (!navigator.onLine) return { ok: false, error: 'Offline.', tests: [] };
  try {
    const data = await airtableGet(TABLES.testDefinitions.id, {
      'sort[0][field]': FIELDS.testDefinitions.name,
      'sort[0][direction]': 'asc',
      pageSize: '100',
    });
    return {
      ok: true,
      error: null,
      tests: data.records
        .filter((r) => r.fields[FIELDS.testDefinitions.name]) // skip blank leftover rows
        .map((r) => ({
          id: r.id,
          name: r.fields[FIELDS.testDefinitions.name],
          unit: r.fields[FIELDS.testDefinitions.unit] || '',
          category: r.fields[FIELDS.testDefinitions.category] || '',
          isLocal: false,
        })),
    };
  } catch (e) {
    return { ok: false, error: e.message, tests: [] };
  }
}

function pendingTests() {
  return Queue.all()
    .filter((i) => i.tableId === TABLES.testDefinitions.id)
    .map((i) => ({
      id: i.localId,
      name: `${i.fields[FIELDS.testDefinitions.name]} (syncing…)`,
      unit: i.fields[FIELDS.testDefinitions.unit] || '',
      category: i.fields[FIELDS.testDefinitions.category] || '',
      isLocal: true,
    }));
}

function mergeTests(fetched) {
  const byId = new Map();
  TESTS.forEach((t) => byId.set(t.id, { ...t, isLocal: false }));
  fetched.forEach((t) => byId.set(t.id, t));
  pendingTests().forEach((t) => byId.set(t.id, t));
  return Array.from(byId.values());
}

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

    let tests = mergeTests([]); // instant, seeded + pending
    let testsFetchError = null;
    let showAddTest = false;

    const state = {
      date: todayISO(),
      testId: (last && last.testId) || tests[0].id,
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

    fetchTestDefinitions().then((result) => {
      tests = mergeTests(result.tests);
      testsFetchError = result.ok ? null : result.error;
      if (!tests.some((t) => t.id === state.testId)) state.testId = tests[0].id;
      renderForm();
    });

    function renderAddTestForm() {
      const wrap = h('div', { class: 'inline-add-form' });
      const local = { name: '', unit: '', category: '' };
      const nameInput = h('input', { class: 'text-input', placeholder: 'Test name (e.g. "3-Point Shooting %")', oninput: (e) => (local.name = e.target.value) });
      const unitInput = h('input', { class: 'text-input', placeholder: 'Unit (e.g. "seconds", "makes", "inches")', oninput: (e) => (local.unit = e.target.value) });
      const categoryInput = h('input', { class: 'text-input', placeholder: 'Category (optional)', oninput: (e) => (local.category = e.target.value) });
      wrap.appendChild(fieldRow('New test name', nameInput));
      wrap.appendChild(fieldRow('Unit', unitInput));
      wrap.appendChild(fieldRow('Category (optional)', categoryInput));
      wrap.appendChild(secondaryButton('Save test', () => {
        if (!local.name.trim() || !local.unit.trim()) {
          toast('Give the test a name and a unit', 'warn');
          return;
        }
        const localId = uuid();
        const fields = { [FIELDS.testDefinitions.name]: local.name.trim(), [FIELDS.testDefinitions.unit]: local.unit.trim() };
        if (local.category.trim()) fields[FIELDS.testDefinitions.category] = local.category.trim();
        Queue.add({
          localId,
          tableId: TABLES.testDefinitions.id,
          fields,
          status: 'pending',
          createdAt: new Date().toISOString(),
          screenLabel: `Test: ${local.name.trim()}`,
        });
        tests = mergeTests(tests.filter((t) => !t.isLocal));
        state.testId = localId;
        showAddTest = false;
        Sync.flush();
        toast('Test saved — syncing');
        renderForm();
      }));
      wrap.appendChild(secondaryButton('Cancel', () => {
        showAddTest = false;
        renderForm();
      }));
      return wrap;
    }

    function renderForm() {
      formHost.innerHTML = '';
      const test = tests.find((t) => t.id === state.testId) || tests[0];

      const dateInput = h('input', { class: 'text-input', type: 'date', value: state.date, onchange: (e) => (state.date = e.target.value) });
      const testOptions = [
        ...tests.map((t) => ({ value: t.id, label: `${t.name}${t.unit ? ` (${t.unit})` : ''}` })),
        { value: '__new__', label: '+ Add new test…' },
      ];
      const testSelect = selectEl(testOptions, state.testId, (v) => {
        if (v === '__new__') {
          showAddTest = true;
          renderForm();
          return;
        }
        state.testId = v;
        renderForm();
      });
      const resultInput = h('input', {
        class: 'text-input',
        type: 'number',
        step: 'any',
        inputmode: 'decimal',
        placeholder: `Result in ${test.unit || 'units'}`,
        value: state.resultValue,
        oninput: (e) => (state.resultValue = e.target.value),
      });
      const notesArea = textArea('Optional notes…', state.notes, (v) => (state.notes = v));

      formHost.appendChild(fieldRow('Date', dateInput));
      formHost.appendChild(fieldRow('Test', testSelect));
      if (testsFetchError) {
        formHost.appendChild(h('div', { class: 'fetch-error', text: `Couldn't load tests from Airtable: ${testsFetchError} — check your token's table access in Settings.` }));
      }
      if (showAddTest) formHost.appendChild(renderAddTestForm());
      formHost.appendChild(fieldRow(`Result (${test.unit || 'units'})`, resultInput));
      formHost.appendChild(fieldRow('Notes', notesArea));

      formHost.appendChild(primaryButton(editingLocalId ? 'Update Entry' : 'Save Benchmark', async () => {
        const value = parseFloat(state.resultValue);
        if (isNaN(value)) {
          toast('Enter a result value', 'warn');
          return;
        }
        const label = `${player.name} – ${test.name} – ${state.date}`;
        const dependsOn = [];
        const fields = {
          [FIELDS.benchmarkResults.logEntry]: label,
          [FIELDS.benchmarkResults.player]: [playerId],
          [FIELDS.benchmarkResults.date]: state.date,
          [FIELDS.benchmarkResults.resultValue]: value,
          [FIELDS.benchmarkResults.notes]: state.notes,
        };
        if (test.isLocal) {
          dependsOn.push({ localId: test.id, linkField: FIELDS.benchmarkResults.test });
        } else {
          fields[FIELDS.benchmarkResults.test] = [state.testId];
        }

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
            dependsOn,
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
        const testName = (tests.find((t) => t.id === testId) || TESTS.find((t) => t.id === testId) || {}).name || 'Test';
        return `${testName} – ${r.fields[FIELDS.benchmarkResults.resultValue] ?? ''} – ${r.fields[FIELDS.benchmarkResults.date] || ''}`;
      },
      formatPending: (item) => item.screenLabel,
    });
  },
};
