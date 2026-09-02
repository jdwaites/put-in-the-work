// A fixed set of starter Workout Templates from a specific workout plan the
// user provided — deliberately not labeled by day (push/pull/upper/lower
// splits at two rep ranges, each row of the original plan combined into
// one template), named by rep range and role instead. Returns the number
// actually added (skips any name that's already a live Workout Template,
// so re-running this is safe).
const STARTER_WORKOUT_TEMPLATES = [
  {
    name: 'Heavy Push/Pull A (4-6 reps)',
    description: 'Barbell Bench Press — 4-6 reps x 3 hard sets\nDeadlift — 4-6 reps x 3 hard sets\nMilitary Press — 4-6 reps x 3 hard sets\nBarbell Squat — 4-6 reps x 3 hard sets',
  },
  {
    name: 'Heavy Push/Pull B (4-6 reps)',
    description: 'Incline Barbell Bench — 4-6 reps x 3 hard sets\nOne Arm Dumbbell Row — 4-6 reps x 3 hard sets\nSeated Cable Row — 4-6 reps x 3 hard sets\nLeg Curl — 4-6 reps x 3 hard sets',
  },
  {
    name: 'Moderate Push/Pull A (6-8 reps)',
    description: 'Dumbbell Bench — 6-8 reps x 3 hard sets\nLat Pulldown — 6-8 reps x 3 hard sets\nClose Grip Bench Press — 6-8 reps x 3 hard sets\nLeg Press — 6-8 reps x 3 hard sets',
  },
  {
    name: 'Moderate Push/Pull B (6-8 reps)',
    description: 'Triceps Pushdown — 6-8 reps x 3 hard sets\nAlternating Dumbbell Curl — 6-8 reps x 3 hard sets\nDumbbell Rear Lateral Raise — 6-8 reps x 3 hard sets\nDumbbell Lunge Walking in Place — 6-8 reps x 3 hard sets',
  },
  {
    name: 'Bodyweight & Carries Finisher',
    description: 'Bar Dip\nPull-Up/Chin Up\nTurkish Get Up\nFarmers Walk\nWeighted Stepup',
  },
];

async function importStarterWorkoutTemplates() {
  if (!Settings.hasToken()) throw new Error('add your Airtable token first');
  if (!navigator.onLine) throw new Error('offline — connect and try again');

  let existingNames = new Set();
  try {
    const data = await airtableGet(TABLES.workoutTemplates.id, { pageSize: '100' });
    existingNames = new Set(data.records.map((r) => r.fields[FIELDS.workoutTemplates.name]).filter(Boolean));
  } catch (e) {
    // If the existence check itself fails, fall through and create
    // everything — worst case a rare duplicate, not worth blocking on.
  }

  let added = 0;
  STARTER_WORKOUT_TEMPLATES.forEach((t) => {
    if (existingNames.has(t.name)) return;
    Queue.add({
      localId: uuid(),
      tableId: TABLES.workoutTemplates.id,
      fields: { [FIELDS.workoutTemplates.name]: t.name, [FIELDS.workoutTemplates.description]: t.description },
      status: 'pending',
      createdAt: new Date().toISOString(),
      screenLabel: `Workout type: ${t.name}`,
    });
    added += 1;
  });
  if (added > 0) Sync.flush();
  return added;
}

const SettingsScreen = {
  render(container) {
    container.innerHTML = '';
    container.appendChild(backHeader('Settings'));

    const settings = Settings.get();
    const patInput = h('input', {
      class: 'text-input',
      type: 'password',
      placeholder: 'pat_xxxxxxxxxxxxxxxx',
      value: settings.pat || '',
    });

    const statusMsg = h('div', { class: 'settings-status' });

    container.appendChild(
      h('div', { class: 'screen-body' }, [
        h('p', { class: 'settings-hint', text:
          'Create a Personal Access Token at airtable.com/create/tokens with '
          + 'data.records:read and data.records:write scope on the "Putting in the Work" base, then paste it here. '
          + 'It is stored only on this device, never sent anywhere except directly to Airtable.' }),
        fieldRow('Airtable Token', patInput),
        primaryButton('Save Token', () => {
          Settings.set({ ...settings, pat: patInput.value.trim() });
          toast('Token saved');
          Sync.flush();
          SettingsScreen.render(container);
        }),
        h('div', { class: 'divider' }),
        statusMsg,
        secondaryButton('Sync now', async () => {
          statusMsg.textContent = 'Syncing…';
          await Sync.flush();
          statusMsg.textContent = '';
          SettingsScreen.render(container);
        }),
        SettingsScreen.queueDetail(),
        h('div', { class: 'divider' }),
        SettingsScreen.backupSection(),
        h('div', { class: 'divider' }),
        SettingsScreen.starterContentSection(),
      ])
    );
  },

  // One-tap import for a fixed set of starter Workout Templates — added on
  // request from a specific workout plan, not a general "template library"
  // feature. Skips any name that already exists in Workout Templates so
  // tapping it twice doesn't create duplicates.
  starterContentSection() {
    const status = h('div', { class: 'settings-status' });
    return h('div', {}, [
      h('h3', { text: 'Starter Content' }),
      h('p', { class: 'settings-hint', text: 'Adds 5 preset Workout Templates (push/pull/upper/lower splits at two rep ranges, plus a bodyweight & carries finisher) as reusable Workout Types — none are tied to a specific day.' }),
      secondaryButton('Import starter workout templates', async () => {
        status.textContent = 'Checking existing templates…';
        try {
          const added = await importStarterWorkoutTemplates();
          status.textContent = added > 0
            ? `${added} template${added === 1 ? '' : 's'} added — syncing`
            : 'All 5 starter templates already exist';
        } catch (e) {
          status.textContent = `Import failed: ${e.message}`;
        }
      }),
      status,
    ]);
  },

  backupSection() {
    const playerId = CurrentPlayer.get();
    const player = PLAYERS.find((p) => p.id === playerId);
    const backupStatus = h('div', { class: 'settings-status' });

    const importInput = h('input', { type: 'file', accept: 'application/json', style: 'display:none' });
    importInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        const count = countJSONRecords(parsed);
        if (count === 0) {
          toast('Nothing to import in that file', 'warn');
          return;
        }
        if (!confirm(`This will add ${count} record${count === 1 ? '' : 's'} to Airtable — continue?`)) return;
        const added = importResultsJSON(parsed);
        Sync.flush();
        toast(`Imported ${added} record${added === 1 ? '' : 's'} — syncing`);
      } catch (err) {
        toast('Import failed — make sure the file is a JSON export from this app', 'warn');
      } finally {
        importInput.value = '';
      }
    });

    return h('div', {}, [
      h('h3', { text: 'Backup & Portability' }),
      h('p', { class: 'settings-hint', text:
        'A manual backup/transfer tool, not a replacement for Airtable as the source of truth. '
        + 'Import adds records — it does not de-duplicate, and any linked Session/Move/Template must already exist.' }),
      secondaryButton(`Export JSON — ${player.name}`, async () => {
        backupStatus.textContent = 'Exporting…';
        try {
          const data = await exportResultsJSON(playerId);
          downloadTextFile(`putting-in-the-work-${player.name}-${todayISO()}.json`, JSON.stringify(data, null, 2), 'application/json');
          backupStatus.textContent = '';
        } catch (e) {
          backupStatus.textContent = `Export failed: ${e.message}`;
        }
      }),
      secondaryButton('Export JSON — all players', async () => {
        backupStatus.textContent = 'Exporting…';
        try {
          const data = await exportResultsJSON(null);
          downloadTextFile(`putting-in-the-work-all-players-${todayISO()}.json`, JSON.stringify(data, null, 2), 'application/json');
          backupStatus.textContent = '';
        } catch (e) {
          backupStatus.textContent = `Export failed: ${e.message}`;
        }
      }),
      secondaryButton('Import JSON backup…', () => importInput.click()),
      importInput,
      h('div', { class: 'divider' }),
      secondaryButton(`Export CSV — ${player.name}`, async () => {
        backupStatus.textContent = 'Exporting…';
        try {
          await exportResultsCSV(playerId);
          backupStatus.textContent = '';
        } catch (e) {
          backupStatus.textContent = `Export failed: ${e.message}`;
        }
      }),
      secondaryButton('Export CSV — all players', async () => {
        backupStatus.textContent = 'Exporting…';
        try {
          await exportResultsCSV(null);
          backupStatus.textContent = '';
        } catch (e) {
          backupStatus.textContent = `Export failed: ${e.message}`;
        }
      }),
      backupStatus,
    ]);
  },

  queueDetail() {
    const items = Queue.all();
    if (items.length === 0) {
      return h('div', { class: 'queue-empty', text: 'Nothing queued — everything is synced.' });
    }
    const list = h('div', { class: 'queue-list' });
    items.forEach((item) => {
      const row = h('div', { class: 'queue-item' + (item.status === 'error' ? ' queue-item-error' : '') }, [
        h('div', { class: 'queue-item-label', text: item.screenLabel || item.tableId }),
        h('div', { class: 'queue-item-status', text: item.status === 'error' ? (item.error || 'Failed') : 'Pending sync' }),
      ]);
      if (item.status === 'error') {
        row.appendChild(secondaryButton('Retry', () => {
          Queue.update(item.localId, { status: 'pending', error: null });
          Sync.flush();
          SettingsScreen.render(document.getElementById('screen'));
        }));
        row.appendChild(secondaryButton('Discard', () => {
          Queue.remove(item.localId);
          SettingsScreen.render(document.getElementById('screen'));
        }));
      }
      list.appendChild(row);
    });
    return h('div', {}, [h('h3', { text: `Queue (${items.length})` }), list]);
  },
};
