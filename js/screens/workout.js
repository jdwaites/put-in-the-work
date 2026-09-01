const WorkoutScreen = {
  render(container) {
    container.innerHTML = '';
    container.appendChild(backHeader('Log Workout'));
    container.appendChild(playerSwitcher(() => WorkoutScreen.render(container)));

    const playerId = CurrentPlayer.get();
    const player = PLAYERS.find((p) => p.id === playerId);
    const last = LastEntry.get('workout', playerId);
    let lastSaved = LastSaved.get('workout', playerId);
    let editingLocalId = null;

    const state = {
      date: todayISO(),
      category: (last && last.category) || 'Basketball',
      duration: (last && last.duration) || 30,
      intensity: (last && last.intensity) || '2',
      grade: (last && last.grade) || '2',
      comments: '',
      templateId: '',
      videoUrl: '',
      showAddTemplate: false,
      newTemplateName: '',
      newTemplateDescription: '',
      newTemplateVideoUrl: '',
    };

    let templates = pendingTemplates(); // instant, from local queue

    const body = h('div', { class: 'screen-body' });

    if (last) {
      body.appendChild(secondaryButton('↺ Repeat last entry', () => {
        Object.assign(state, last, { comments: last.comments || '' });
        renderForm();
      }));
    }
    if (lastSaved) {
      body.appendChild(secondaryButton('✎ Edit last entry', () => {
        const f = lastSaved.fields;
        state.date = f[FIELDS.workoutLogs.date] || state.date;
        state.category = f[FIELDS.workoutLogs.category] || state.category;
        state.duration = f[FIELDS.workoutLogs.duration] ?? state.duration;
        state.intensity = f[FIELDS.workoutLogs.intensity] || state.intensity;
        state.grade = f[FIELDS.workoutLogs.grade] || state.grade;
        state.comments = f[FIELDS.workoutLogs.comments] || '';
        state.videoUrl = f[FIELDS.workoutLogs.videoUrl] || '';
        editingLocalId = lastSaved.localId;
        renderForm();
      }));
    }

    const formHost = h('div');
    const recentHost = h('div');
    body.appendChild(formHost);
    body.appendChild(recentHost);
    container.appendChild(body);

    fetchTemplates().then((synced) => {
      templates = [...pendingTemplates(), ...synced];
      renderForm();
    });

    function templateOptions() {
      return [{ value: '', label: 'None' }, ...templates.map((t) => ({ value: t.id, label: t.label }))];
    }

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

      const templateSelect = selectEl(templateOptions(), state.templateId, (v) => {
        state.templateId = v;
        const chosen = templates.find((t) => t.id === v);
        if (chosen && chosen.videoUrl && !state.videoUrl) {
          state.videoUrl = chosen.videoUrl;
          renderForm();
        }
      });

      const videoUrlInput = h('input', {
        class: 'text-input',
        type: 'url',
        inputmode: 'url',
        placeholder: 'https://youtube.com/...',
        value: state.videoUrl,
        oninput: (e) => (state.videoUrl = e.target.value),
      });

      const commentsArea = textArea('Optional notes…', state.comments, (v) => (state.comments = v));

      formHost.appendChild(fieldRow('Date', dateInput));
      formHost.appendChild(fieldRow('Category', categoryTap));
      formHost.appendChild(fieldRow('Duration (min)', durationStep));
      formHost.appendChild(fieldRow('Intensity (1–4)', intensityTap));
      formHost.appendChild(fieldRow('Performance Grade (1–4)', gradeTap));
      formHost.appendChild(fieldRow('Workout Type (optional)', templateSelect));

      if (!state.showAddTemplate) {
        formHost.appendChild(secondaryButton('+ Add a new workout type', () => {
          state.showAddTemplate = true;
          renderForm();
        }));
      } else {
        formHost.appendChild(renderAddTemplateForm());
      }

      formHost.appendChild(fieldRow('YouTube / video link (optional)', videoUrlInput));
      formHost.appendChild(fieldRow('Comments', commentsArea));

      formHost.appendChild(primaryButton(editingLocalId ? 'Update Entry' : 'Save Workout', async () => {
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

        const chosenTemplate = templates.find((t) => t.id === state.templateId);
        // A brand-new, still-unsynced template can't be linked via a PATCH
        // (no dependsOn support on edit) — only relink on create, or on
        // edit when the template has already synced to a real record id.
        const dependsOn = [];
        if (chosenTemplate) {
          if (chosenTemplate.isLocal) {
            if (!editingLocalId) dependsOn.push({ localId: chosenTemplate.id, linkField: FIELDS.workoutLogs.template });
          } else {
            fields[FIELDS.workoutLogs.template] = [chosenTemplate.id];
          }
        }

        if (editingLocalId) {
          const ok = await updateExistingRecord({ localId: editingLocalId, tableId: TABLES.workoutLogs.id }, fields);
          if (!ok) {
            toast("Couldn't find that entry to update — try refreshing", 'warn');
            return;
          }
          lastSaved = { localId: editingLocalId, tableId: TABLES.workoutLogs.id, fields, screenLabel: label, savedAt: new Date().toISOString() };
          LastSaved.set('workout', playerId, lastSaved);
          toast('Entry updated');
        } else {
          const localId = uuid();
          const queueItem = {
            localId,
            tableId: TABLES.workoutLogs.id,
            fields,
            dependsOn,
            status: 'pending',
            createdAt: new Date().toISOString(),
            screenLabel: label,
            onSyncedTag: 'workoutLog',
            playerIdForCache: playerId,
          };
          Queue.add(queueItem);
          LastSaved.set('workout', playerId, { localId, tableId: TABLES.workoutLogs.id, fields, screenLabel: label, savedAt: new Date().toISOString() });
          Sync.flush();
          toast('Workout saved — syncing');
        }
        LastEntry.set('workout', playerId, { category: state.category, duration: state.duration, intensity: state.intensity, grade: state.grade, comments: state.comments });
        WorkoutScreen.render(container);
      }));
    }

    function renderAddTemplateForm() {
      const wrap = h('div', { class: 'inline-add-form' });
      const nameInput = h('input', { class: 'text-input', placeholder: 'Workout name (e.g. "Leg Day")', value: state.newTemplateName, oninput: (e) => (state.newTemplateName = e.target.value) });
      const descArea = textArea('Description (optional)', state.newTemplateDescription, (v) => (state.newTemplateDescription = v));
      const videoInput = h('input', { class: 'text-input', type: 'url', placeholder: 'Video link (optional)', value: state.newTemplateVideoUrl, oninput: (e) => (state.newTemplateVideoUrl = e.target.value) });

      wrap.appendChild(fieldRow('Name', nameInput));
      wrap.appendChild(fieldRow('Description', descArea));
      wrap.appendChild(fieldRow('Video link', videoInput));
      wrap.appendChild(secondaryButton('Save workout type', () => {
        if (!state.newTemplateName.trim()) {
          toast('Give the workout type a name', 'warn');
          return;
        }
        const localId = uuid();
        const fields = { [FIELDS.workoutTemplates.name]: state.newTemplateName.trim() };
        if (state.newTemplateDescription) fields[FIELDS.workoutTemplates.description] = state.newTemplateDescription;
        if (state.newTemplateVideoUrl) fields[FIELDS.workoutTemplates.videoUrl] = state.newTemplateVideoUrl;
        Queue.add({
          localId,
          tableId: TABLES.workoutTemplates.id,
          fields,
          status: 'pending',
          createdAt: new Date().toISOString(),
          screenLabel: `Workout type: ${state.newTemplateName.trim()}`,
        });
        templates = [...pendingTemplates(), ...templates.filter((t) => !t.isLocal)];
        state.templateId = localId;
        state.videoUrl = state.videoUrl || state.newTemplateVideoUrl;
        state.showAddTemplate = false;
        state.newTemplateName = '';
        state.newTemplateDescription = '';
        state.newTemplateVideoUrl = '';
        Sync.flush();
        toast('Workout type saved — syncing');
        renderForm();
      }));
      wrap.appendChild(secondaryButton('Cancel', () => {
        state.showAddTemplate = false;
        renderForm();
      }));
      return wrap;
    }

    renderForm();

    renderRecentEntries(recentHost, {
      tableId: TABLES.workoutLogs.id,
      playerId,
      playerFieldName: FIELDS.workoutLogs.player,
      limit: 5,
      formatSynced: (r) => `${r.fields[FIELDS.workoutLogs.category] || 'Workout'} – ${r.fields[FIELDS.workoutLogs.date] || ''}`,
      formatPending: (item) => item.screenLabel,
    });
  },
};

async function fetchTemplates() {
  if (!Settings.hasToken() || !navigator.onLine) return [];
  try {
    const data = await airtableGet(TABLES.workoutTemplates.id, {
      'sort[0][field]': FIELDS.workoutTemplates.name,
      'sort[0][direction]': 'asc',
      pageSize: '100',
    });
    return data.records.map((r) => ({
      id: r.id,
      label: r.fields[FIELDS.workoutTemplates.name] || '(untitled)',
      videoUrl: r.fields[FIELDS.workoutTemplates.videoUrl] || '',
      isLocal: false,
    }));
  } catch (e) {
    return [];
  }
}

function pendingTemplates() {
  return Queue.all()
    .filter((i) => i.tableId === TABLES.workoutTemplates.id)
    .map((i) => ({
      id: i.localId,
      label: `${i.fields[FIELDS.workoutTemplates.name]} (syncing…)`,
      videoUrl: i.fields[FIELDS.workoutTemplates.videoUrl] || '',
      isLocal: true,
    }));
}
