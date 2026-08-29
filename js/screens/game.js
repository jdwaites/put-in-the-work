const GameScreen = {
  render(container) {
    container.innerHTML = '';
    container.appendChild(backHeader('Log Game'));
    container.appendChild(playerSwitcher(() => GameScreen.render(container)));

    const playerId = CurrentPlayer.get();
    const player = PLAYERS.find((p) => p.id === playerId);
    const last = LastEntry.get('game', playerId);

    const state = {
      date: todayISO(),
      opponent: '',
      minutes: (last && last.minutes) || 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      whatWentWell: '',
      whatToWorkOn: '',
    };

    const body = h('div', { class: 'screen-body' });
    const formHost = h('div');
    const recentHost = h('div');
    body.appendChild(formHost);
    body.appendChild(recentHost);
    container.appendChild(body);

    function renderForm() {
      formHost.innerHTML = '';

      const dateInput = h('input', { class: 'text-input', type: 'date', value: state.date, onchange: (e) => (state.date = e.target.value) });
      const opponentInput = h('input', { class: 'text-input', placeholder: 'Opponent name', value: state.opponent, oninput: (e) => (state.opponent = e.target.value) });
      const minutesStep = stepper(state.minutes, { min: 0, max: 120, label: 'minutes' }, (v) => (state.minutes = v));
      const pointsStep = stepper(state.points, { min: 0, max: 100, label: 'points' }, (v) => (state.points = v));
      const reboundsStep = stepper(state.rebounds, { min: 0, max: 50, label: 'rebounds' }, (v) => (state.rebounds = v));
      const assistsStep = stepper(state.assists, { min: 0, max: 50, label: 'assists' }, (v) => (state.assists = v));
      const wentWellArea = textArea('What went well?', state.whatWentWell, (v) => (state.whatWentWell = v));
      const workOnArea = textArea('What to work on?', state.whatToWorkOn, (v) => (state.whatToWorkOn = v));

      formHost.appendChild(fieldRow('Date', dateInput));
      formHost.appendChild(fieldRow('Opponent', opponentInput));
      formHost.appendChild(fieldRow('Minutes Played', minutesStep));
      formHost.appendChild(fieldRow('Points', pointsStep));
      formHost.appendChild(fieldRow('Rebounds', reboundsStep));
      formHost.appendChild(fieldRow('Assists', assistsStep));
      formHost.appendChild(fieldRow('What Went Well', wentWellArea));
      formHost.appendChild(fieldRow('What To Work On', workOnArea));

      formHost.appendChild(primaryButton('Save Game Log', () => {
        const localId = uuid();
        const label = `${player.name} vs ${state.opponent || 'Unknown'} – ${state.date}`;
        Queue.add({
          localId,
          tableId: TABLES.gameLog.id,
          fields: {
            [FIELDS.gameLog.opponent]: state.opponent,
            [FIELDS.gameLog.player]: [playerId],
            [FIELDS.gameLog.date]: state.date,
            [FIELDS.gameLog.minutesPlayed]: state.minutes,
            [FIELDS.gameLog.points]: state.points,
            [FIELDS.gameLog.rebounds]: state.rebounds,
            [FIELDS.gameLog.assists]: state.assists,
            [FIELDS.gameLog.whatWentWell]: state.whatWentWell,
            [FIELDS.gameLog.whatToWorkOn]: state.whatToWorkOn,
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
          screenLabel: label,
        });
        LastEntry.set('game', playerId, { minutes: state.minutes });
        Sync.flush();
        toast('Game logged — syncing');
        GameScreen.render(container);
      }));
    }

    renderForm();

    renderRecentEntries(recentHost, {
      tableId: TABLES.gameLog.id,
      playerId,
      playerFieldName: FIELDS.gameLog.player,
      limit: 5,
      formatSynced: (r) => `vs ${r.fields[FIELDS.gameLog.opponent] || 'Unknown'} – ${r.fields[FIELDS.gameLog.points] ?? 0}p – ${r.fields[FIELDS.gameLog.date] || ''}`,
      formatPending: (item) => item.screenLabel,
    });
  },
};
