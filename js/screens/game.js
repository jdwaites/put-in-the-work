// Game Log v2: co-practice mode + shared shot chart (2026-09-03 rebuild).
//
// The old single-player Game Log kept its in-progress entry in a plain JS
// `state` object scoped to whichever player was selected, with nothing
// persisted to localStorage — tapping the player switcher mid-entry just
// re-ran render() for the new player and threw the old player's unsaved
// stats away. That's the bug report that triggered this rebuild (real data
// lost logging two kids' games back to back), and the fix is the same
// pattern already proven on the Shooting screen: GameDrafts (js/storage.js)
// keeps one independent, localStorage-persisted draft per active player, so
// switching tabs never touches the other player's in-progress entry.
//
// Every active player's card renders at once, side by side (a CSS grid,
// wraps to one column on a narrow phone), color-coded per player, so
// logging two kids' games never means flipping back and forth between tabs.
// Tabs only add/remove who's in today's practice — they no longer hide or
// switch between entries.
//
// The shot chart itself is ONE shared court diagram (courtDiagram in
// js/ui.js), not one per player — a spot with shots from more than one
// active player splits into a colored pie wedge per player, so it's legible
// at a glance whose shot is whose. Tapping a spot opens one shared editor
// with a side-by-side Attempts/Makes/Misses column per active player for
// that same spot. Points is computed from each player's own makes times
// that Spot's Point Value (added to Spot Definitions alongside this table)
// — never typed in manually. Each logged spot becomes a Game Shot Results
// record linked to that player's Game Log entry, mirroring Shot Spot
// Results/Shooting Sessions.

// Court positions (viewBox 0 0 300 300) for the shot-chart diagram — a
// schematic mnemonic for the 14 named Spot Definitions, not real court
// geometry. Keyed by Spot id (not name) so it survives a spot rename in
// Airtable — see the id-stability note on SPOTS in js/data.js.
const GAME_SPOT_COORDS = {
  recvt7IoNGUs25crN: { x: 22, y: 275 },   // Left Corner
  recPcsCe8Vfft397Y: { x: 85, y: 280 },   // Left Baseline
  recPZg3xkZZMTeups: { x: 150, y: 55 },   // Top of Key
  recxpTUiUwDhkuwhd: { x: 215, y: 280 },  // Right Baseline
  recAgwKaHLH3DWyRn: { x: 278, y: 275 },  // Right Corner
  recgRM7M8YjlOjrpz: { x: 55, y: 110 },   // Left Wing
  recVQvwPZp6nxzhhg: { x: 108, y: 165 },  // Left Elbow
  recWuDrGt3jQs5KOR: { x: 150, y: 165 },  // Free Throw
  rec0fYXQfKksH5z7Q: { x: 192, y: 165 },  // Right Elbow
  recCaPGjortnBvHBr: { x: 245, y: 110 },  // Right Wing
  recH94U836VFT3zdQ: { x: 122, y: 225 },  // Left Mid-Paint
  recgsSiMW9lzPpuwE: { x: 178, y: 225 },  // Right Mid-Paint
  recOKWcUxOwZfEkt8: { x: 124, y: 195 },  // Left High Post
  recNE7eo8TTYx1IXj: { x: 176, y: 195 },  // Right High Post
};

// One fixed color per player, keyed by their position in PLAYERS (not by
// activePlayers order), so a given player's card/wedge is always the same
// color across visits, regardless of who else is in today's practice or
// what order they were added. Picked to stay distinct from --accent
// (orange, used elsewhere for "active" UI) so a colored card border never
// reads as an active/selected state.
const GAME_PLAYER_COLORS = ['#4f8ef7', '#22c55e', '#a855f7', '#ec4899', '#14b8a6', '#f5a524'];
function playerAccentColor(playerId) {
  const idx = PLAYERS.findIndex((p) => p.id === playerId);
  return GAME_PLAYER_COLORS[(idx < 0 ? 0 : idx) % GAME_PLAYER_COLORS.length];
}

function eligibleGamePlayers() {
  return PLAYERS.filter((p) => effectiveScreens(p).includes('game'));
}

function computeGamePoints(draft) {
  return draft.rows.reduce((sum, row) => {
    const spot = SPOTS.find((s) => s.id === row.spotId);
    return sum + row.makes * (spot ? spot.pointValue : 0);
  }, 0);
}

// Deletes a Game Log entry and every Game Shot Result linked to it, since
// those rows are meaningless once the parent game is gone — same shape as
// deleteShootingSessionCascade in js/recent.js.
async function deleteGameLogCascade(gameId) {
  const data = await airtableGet(TABLES.gameShotResults.id, { 'fields[]': FIELDS.gameShotResults.game, pageSize: '100' });
  const childIds = data.records
    .filter((r) => (r.fields[FIELDS.gameShotResults.game] || []).includes(gameId))
    .map((r) => r.id);
  if (childIds.length > 0) {
    const ok = await airtableDeleteMany(TABLES.gameShotResults.id, childIds);
    if (!ok) return false;
  }
  return airtableDeleteOne(TABLES.gameLog.id, gameId);
}

const GameScreen = {
  render(container) {
    let confirmRemovePlayerId = null;
    let activeSpotId = null; // which court-diagram zone's shared editor is open

    const coState = GameDrafts.get();
    const eligible = eligibleGamePlayers();

    if (coState.activePlayers.length === 0) {
      const seedId = eligible.some((p) => p.id === CurrentPlayer.get()) ? CurrentPlayer.get() : eligible[0].id;
      coState.activePlayers = [seedId];
      coState.drafts[seedId] = emptyGameDraft(todayISO());
    }
    // Guard against stale state (e.g. a player's screens changed).
    coState.activePlayers = coState.activePlayers.filter((id) => eligible.some((p) => p.id === id));
    if (coState.activePlayers.length === 0) {
      coState.activePlayers = [eligible[0].id];
      coState.drafts[eligible[0].id] = coState.drafts[eligible[0].id] || emptyGameDraft(todayISO());
    }
    GameDrafts.save(coState);

    // Widen the app shell so side-by-side cards actually get room on a
    // tablet/desktop browser — reset for every other screen in js/app.js.
    document.getElementById('app').classList.toggle('wide', coState.activePlayers.length > 1);

    container.innerHTML = '';
    container.appendChild(backHeader('Log Game'));

    const tabsHost = h('div');
    const chartHost = h('div', { class: 'screen-body' });
    const cardsGrid = h('div', { class: 'game-cards-grid' });
    const submitHost = h('div');
    container.appendChild(tabsHost);
    container.appendChild(chartHost);
    container.appendChild(cardsGrid);
    container.appendChild(submitHost);

    let cardHosts = {}; // playerId -> { formHost, recentHost }

    function persist() {
      GameDrafts.save(coState);
    }

    // Every active player already has a full, identifiable card below (own
    // color, name, avatar) — a duplicate row of big photo tabs for players
    // already on screen was pure redundancy (tapping one did nothing, since
    // there's no "switch to" left to do). This row now only ever shows
    // players who AREN'T active yet, as a plain "+ Add" action; removing a
    // player lives on their own card instead (see renderPlayerForm) — the
    // safer place for a destructive action to live is next to the data
    // it's about to delete, not in a separate control that's easy to
    // misread as a toggle.
    function renderAddPlayerRow() {
      tabsHost.innerHTML = '';
      const inactive = eligible.filter((p) => !coState.activePlayers.includes(p.id));
      if (inactive.length === 0) {
        tabsHost.appendChild(h('div', { class: 'shooting-tabs-hint', text: 'Everyone tracked for games is already logged below.' }));
        return;
      }
      tabsHost.appendChild(h('div', { class: 'shooting-tabs-hint', text: 'Add another player to this game log:' }));
      const wrap = h('div', { class: 'game-add-player-row' });
      inactive.forEach((p) => {
        wrap.appendChild(secondaryButton(`+ ${p.name}`, () => {
          coState.activePlayers.push(p.id);
          if (!coState.drafts[p.id]) coState.drafts[p.id] = emptyGameDraft(todayISO());
          persist();
          document.getElementById('app').classList.toggle('wide', coState.activePlayers.length > 1);
          renderAll();
        }));
      });
      tabsHost.appendChild(wrap);
    }

    // One shared editor for the currently-open spot, with one Attempts/
    // Makes/Misses column per active player. A player's row for this spot
    // is only written into their draft the moment they actually change
    // Attempts or Makes — merely opening the spot to look at it (or another
    // player's column within it) must not leave a phantom 0/0 row that
    // would still submit as a real zero-attempt Game Shot Result.
    function renderSharedSpotEditor() {
      const spot = SPOTS.find((s) => s.id === activeSpotId);
      if (!spot) return null;
      const wrap = h('div', { class: 'spot-entry-row' });
      wrap.appendChild(h('div', { class: 'spot-entry-header' }, [
        h('div', { class: 'spot-entry-title', text: `Spot ${spot.number} – ${spot.name} (${spot.pointValue}pt)` }),
        h('button', { class: 'btn-remove', type: 'button', 'aria-label': 'Close this spot', onclick: () => {
          activeSpotId = null;
          renderChart();
        } }, '✕'),
      ]));

      const grid = h('div', { class: 'game-shot-editor-grid' });
      coState.activePlayers.forEach((playerId) => {
        const player = PLAYERS.find((p) => p.id === playerId);
        const draft = coState.drafts[playerId];
        const color = playerAccentColor(playerId);
        let row = draft.rows.find((r) => r.spotId === activeSpotId);
        if (!row) row = { spotId: activeSpotId, attempts: 0, makes: 0, misses: 0 };
        const ensureInDraft = () => {
          if (!draft.rows.includes(row)) draft.rows.push(row);
        };

        const col = h('div', { class: 'game-shot-editor-col', style: `--player-color: ${color};` });
        col.appendChild(h('div', { class: 'game-shot-editor-name', style: `color: ${color};`, text: player.name }));

        const attemptsDisplay = h('div', { class: 'stepper-value', text: String(row.attempts) });
        const attemptsWrap = h('div', { class: 'stepper stepper-readonly' }, [attemptsDisplay]);

        // Makes and Misses are the only things you actually tap as shots
        // happen — Attempts is never a direct input, just their sum,
        // displayed read-only. Attempts always goes up as a game
        // progresses, exactly like it does on a real court: every logged
        // shot is a make or a miss, and either one raises Attempts. There's
        // no clamping to get right here since an invalid state (Makes
        // exceeding Attempts) simply can't occur when Attempts is derived
        // instead of independently editable.
        const makesStep = stepper(row.makes, { min: 0, max: 99, label: `${player.name} makes` }, (v) => {
          ensureInDraft();
          row.makes = v;
          row.attempts = row.makes + row.misses;
          attemptsDisplay.textContent = String(row.attempts);
          persist();
          renderChart();
          renderSubmitBar();
        });
        const missesStep = stepper(row.misses, { min: 0, max: 99, label: `${player.name} misses` }, (v) => {
          ensureInDraft();
          row.misses = v;
          row.attempts = row.makes + row.misses;
          attemptsDisplay.textContent = String(row.attempts);
          persist();
          renderChart();
          renderSubmitBar();
        });

        col.appendChild(fieldRow('Makes', makesStep));
        col.appendChild(fieldRow('Misses', missesStep));
        col.appendChild(fieldRow('Attempts', attemptsWrap));
        col.appendChild(secondaryButton('Remove', () => {
          draft.rows = draft.rows.filter((r) => r.spotId !== activeSpotId);
          persist();
          renderChart();
          renderSubmitBar();
        }));
        grid.appendChild(col);
      });
      wrap.appendChild(grid);
      return wrap;
    }

    // The one shared court diagram, rebuilt whenever any active player's
    // shot data changes — cheap since it's just SVG, and it's the only
    // thing that needs every player's rows at once.
    function renderChart() {
      chartHost.innerHTML = '';
      chartHost.appendChild(h('h3', { class: 'section-heading', text: 'Shot Chart' }));
      chartHost.appendChild(h('div', { class: 'shooting-tabs-hint', text: 'Tap a spot to log makes/misses there — everyone active gets their own column, color-coded.' }));

      const courtSpots = SPOTS.map((s) => {
        const coords = GAME_SPOT_COORDS[s.id] || { x: 0, y: 0 };
        const series = coState.activePlayers.map((playerId) => {
          const draft = coState.drafts[playerId];
          const row = draft.rows.find((r) => r.spotId === s.id);
          return {
            playerId,
            color: playerAccentColor(playerId),
            hasRow: !!row,
            makes: row ? row.makes : 0,
            attempts: row ? row.attempts : 0,
          };
        });
        return {
          id: s.id, number: s.number, name: s.name,
          x: coords.x, y: coords.y,
          isActive: activeSpotId === s.id,
          series,
        };
      });
      chartHost.appendChild(courtDiagram(courtSpots, (spotId) => {
        activeSpotId = activeSpotId === spotId ? null : spotId;
        renderChart();
      }));

      const editor = renderSharedSpotEditor();
      if (editor) chartHost.appendChild(editor);

      const totals = coState.activePlayers.map((playerId) => {
        const player = PLAYERS.find((p) => p.id === playerId);
        const draft = coState.drafts[playerId];
        const points = computeGamePoints(draft);
        const makes = draft.rows.reduce((s, r) => s + r.makes, 0);
        const attempts = draft.rows.reduce((s, r) => s + r.attempts, 0);
        return `${player.name}: ${points}pt (${makes}/${attempts})`;
      }).join('  ·  ');
      chartHost.appendChild(h('div', { class: 'last-time-hint', text: `Points (auto-calculated) — ${totals}` }));
    }

    // Rebuilds ONE player's card content — called on every field change for
    // that player. Deliberately does not touch other players' cards, the
    // shared chart, or this player's own recent-entries list
    // (renderPlayerRecent), which only needs to (re-)fetch on structural
    // changes (add/remove/submit), not on every keystroke.
    function renderPlayerForm(playerId) {
      const { formHost } = cardHosts[playerId];
      formHost.innerHTML = '';
      const player = PLAYERS.find((p) => p.id === playerId);
      const draft = coState.drafts[playerId];
      const color = playerAccentColor(playerId);

      const header = h('div', { class: 'game-player-card-header' }, [
        h('span', { class: 'game-player-dot', style: `background:${color};` }),
        player.avatar ? h('img', { class: 'player-avatar', src: player.avatar, alt: '' }) : null,
        h('div', { class: 'game-player-card-name', style: `color:${color};`, text: player.name }),
      ]);
      if (coState.activePlayers.length > 1) {
        const confirming = confirmRemovePlayerId === playerId;
        header.appendChild(h('button', {
          class: 'btn-remove' + (confirming ? ' confirming' : ''),
          type: 'button',
          'aria-label': `Remove ${player.name} from this game log`,
          onclick: () => {
            if (confirming) {
              coState.activePlayers = coState.activePlayers.filter((id) => id !== playerId);
              delete coState.drafts[playerId];
              confirmRemovePlayerId = null;
              persist();
              document.getElementById('app').classList.toggle('wide', coState.activePlayers.length > 1);
              renderAll();
            } else {
              confirmRemovePlayerId = playerId;
              renderPlayerForm(playerId);
            }
          },
        }, confirming ? 'Confirm remove?' : '✕'));
      }
      formHost.appendChild(header);

      const lastEntry = LastEntry.get('game', playerId);
      if (lastEntry) {
        formHost.appendChild(secondaryButton('↺ Repeat last entry (stats only, not shots)', () => {
          Object.assign(draft, lastEntry);
          persist();
          renderPlayerForm(playerId);
          renderSubmitBar();
        }));
      }

      const dateInput = h('input', { class: 'text-input', type: 'date', value: draft.date, onchange: (e) => { draft.date = e.target.value; persist(); } });
      const opponentInput = h('input', { class: 'text-input', placeholder: 'Opponent name', value: draft.opponent, oninput: (e) => { draft.opponent = e.target.value; persist(); renderSubmitBar(); } });
      const minutesStep = stepper(draft.minutes, { min: 0, max: 120, label: 'minutes' }, (v) => { draft.minutes = v; persist(); renderSubmitBar(); });
      const reboundsStep = stepper(draft.rebounds, { min: 0, max: 50, label: 'rebounds' }, (v) => { draft.rebounds = v; persist(); renderSubmitBar(); });
      const assistsStep = stepper(draft.assists, { min: 0, max: 50, label: 'assists' }, (v) => { draft.assists = v; persist(); renderSubmitBar(); });
      // Steals/Turnovers are singleLineText on the live base (not number),
      // so free-entry inputs here rather than steppers — see FIELDS.gameLog
      // in js/data.js.
      const stealsInput = h('input', { class: 'text-input', inputmode: 'numeric', placeholder: 'e.g. 2', value: draft.steals, oninput: (e) => { draft.steals = e.target.value; persist(); renderSubmitBar(); } });
      const turnoversInput = h('input', { class: 'text-input', inputmode: 'numeric', placeholder: 'e.g. 3', value: draft.turnovers, oninput: (e) => { draft.turnovers = e.target.value; persist(); renderSubmitBar(); } });
      const wentWellArea = textArea('What went well?', draft.whatWentWell, (v) => { draft.whatWentWell = v; persist(); renderSubmitBar(); });
      const workOnArea = textArea('What to work on?', draft.whatToWorkOn, (v) => { draft.whatToWorkOn = v; persist(); renderSubmitBar(); });

      formHost.appendChild(fieldRow('Date', dateInput));
      formHost.appendChild(fieldRow('Opponent', opponentInput));
      formHost.appendChild(fieldRow('Minutes Played', minutesStep));
      formHost.appendChild(fieldRow('Rebounds', reboundsStep));
      formHost.appendChild(fieldRow('Assists', assistsStep));
      formHost.appendChild(fieldRow('Steals', stealsInput));
      formHost.appendChild(fieldRow('Turnovers', turnoversInput));
      formHost.appendChild(fieldRow('What Went Well', wentWellArea));
      formHost.appendChild(fieldRow('What To Work On', workOnArea));

      stripeFieldRows(formHost);
    }

    function renderPlayerRecent(playerId) {
      const { recentHost } = cardHosts[playerId];
      recentHost.innerHTML = '';
      renderRecentEntries(recentHost, {
        tableId: TABLES.gameLog.id,
        playerId,
        playerFieldName: FIELDS.gameLog.player,
        limit: 5,
        formatSynced: (r) => `vs ${r.fields[FIELDS.gameLog.opponent] || 'Unknown'} – ${r.fields[FIELDS.gameLog.points] ?? 0}p – ${r.fields[FIELDS.gameLog.date] || ''}`,
        formatPending: (item) => item.screenLabel,
        onDeleteRecord: (recordId) => deleteGameLogCascade(recordId),
        onDeletePending: (item) => {
          Queue.all().filter((i) => (i.dependsOn || []).some((d) => d.localId === item.localId)).forEach((i) => Queue.remove(i.localId));
          Queue.remove(item.localId);
        },
      });
    }

    // A player only counts toward submission once their card actually has
    // something in it — every active player now has a full, always-visible
    // card (there's no more "just glancing via a tab" state to special-case
    // the way the old tab-switching UI needed to).
    function playersReadyToSubmit() {
      return coState.activePlayers.filter((id) => hasAnyData(coState.drafts[id]));
    }

    function hasAnyData(draft) {
      return draft.rows.length > 0 || !!draft.opponent || draft.minutes > 0 || draft.rebounds > 0
        || draft.assists > 0 || !!draft.steals || !!draft.turnovers || !!draft.whatWentWell || !!draft.whatToWorkOn;
    }

    function renderSubmitBar() {
      submitHost.innerHTML = '';
      const readyPlayers = playersReadyToSubmit();
      if (readyPlayers.length === 0) {
        submitHost.appendChild(h('div', { class: 'queue-empty', text: 'Add some stats or shots above to a player’s card to enable Submit.' }));
        return;
      }
      const activeNames = readyPlayers.map((id) => PLAYERS.find((p) => p.id === id).name).join(' + ');
      submitHost.appendChild(primaryButton(`Submit Game Log${readyPlayers.length > 1 ? 's' : ''} (${activeNames})`, doSubmit));
    }

    function doSubmit() {
      const playerIds = playersReadyToSubmit();
      if (playerIds.length === 0) return;
      let totalShotRows = 0;
      playerIds.forEach((playerId) => {
        const player = PLAYERS.find((p) => p.id === playerId);
        const draft = coState.drafts[playerId];
        const points = computeGamePoints(draft);
        const gameLocalId = uuid();
        const label = `${player.name} vs ${draft.opponent || 'Unknown'} – ${draft.date}`;
        const fields = {
          [FIELDS.gameLog.opponent]: draft.opponent,
          [FIELDS.gameLog.player]: [playerId],
          [FIELDS.gameLog.date]: draft.date,
          [FIELDS.gameLog.minutesPlayed]: draft.minutes,
          [FIELDS.gameLog.points]: points,
          [FIELDS.gameLog.rebounds]: draft.rebounds,
          [FIELDS.gameLog.assists]: draft.assists,
          [FIELDS.gameLog.whatWentWell]: draft.whatWentWell,
          [FIELDS.gameLog.whatToWorkOn]: draft.whatToWorkOn,
        };
        if (draft.steals) fields[FIELDS.gameLog.steals] = draft.steals;
        if (draft.turnovers) fields[FIELDS.gameLog.turnovers] = draft.turnovers;

        Queue.add({
          localId: gameLocalId,
          tableId: TABLES.gameLog.id,
          fields,
          status: 'pending',
          createdAt: new Date().toISOString(),
          screenLabel: label,
        });

        const trackedRows = [];
        draft.rows.forEach((row) => {
          const spot = SPOTS.find((s) => s.id === row.spotId);
          const shotLocalId = uuid();
          const shotFields = {
            [FIELDS.gameShotResults.logEntry]: `${spot ? spot.name : 'Spot'} – ${row.makes}/${row.attempts}`,
            [FIELDS.gameShotResults.spot]: [row.spotId],
            [FIELDS.gameShotResults.makes]: row.makes,
            [FIELDS.gameShotResults.misses]: row.misses,
          };
          Queue.add({
            localId: shotLocalId,
            tableId: TABLES.gameShotResults.id,
            fields: shotFields,
            dependsOn: [{ localId: gameLocalId, linkField: FIELDS.gameShotResults.game }],
            status: 'pending',
            createdAt: new Date().toISOString(),
            screenLabel: `${spot ? spot.name : 'Spot'} (${player.name} game)`,
          });
          totalShotRows += 1;
          trackedRows.push({ localId: shotLocalId, tableId: TABLES.gameShotResults.id, fields: shotFields });
        });

        // Session-shaped, like 'shootingSession' — Edit Last Entry's game
        // tab reconciles the full game plus its shot rows, not just the
        // flat game fields (see renderGameSessionEditForm in edit-last.js).
        LastSaved.set('gameSession', playerId, {
          session: { localId: gameLocalId, tableId: TABLES.gameLog.id, fields },
          rows: trackedRows,
          savedAt: new Date().toISOString(),
        });
        LastEntry.set('game', playerId, {
          opponent: draft.opponent,
          minutes: draft.minutes,
          rebounds: draft.rebounds,
          assists: draft.assists,
          steals: draft.steals,
          turnovers: draft.turnovers,
        });
      });

      GameDrafts.clear();
      Sync.flush();
      toast(`${playerIds.length} game log${playerIds.length > 1 ? 's' : ''} saved — ${totalShotRows} shot${totalShotRows === 1 ? '' : 's'} syncing`);
      GameScreen.render(container);
    }

    // Structural rebuild — one card per active player, side by side, each
    // with its own form + recent-entries list, plus the shared chart above
    // them. Only called on add/remove/initial load/post-submit, never on a
    // single keystroke (see renderPlayerForm/renderChart).
    function renderCards() {
      cardsGrid.innerHTML = '';
      cardHosts = {};
      coState.activePlayers.forEach((playerId) => {
        const color = playerAccentColor(playerId);
        const card = h('div', { class: 'game-player-card', style: `--player-color: ${color};` });
        const formHost = h('div');
        const recentHost = h('div');
        card.appendChild(formHost);
        card.appendChild(recentHost);
        cardsGrid.appendChild(card);
        cardHosts[playerId] = { formHost, recentHost };
        renderPlayerForm(playerId);
        renderPlayerRecent(playerId);
      });
    }

    function renderAll() {
      renderAddPlayerRow();
      renderChart();
      renderCards();
      renderSubmitBar();
    }

    renderAll();
  },
};
