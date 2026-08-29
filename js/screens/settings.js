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
      ])
    );
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
