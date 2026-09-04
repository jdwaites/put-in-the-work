// Shared download/share primitives — no backend, so everything routes
// through the browser's own download/clipboard/share mechanisms. Used by
// the Reports session-summary card and by JSON/CSV export in Settings.

// The 7 "RESULTS" tables — logged data to analyze, not reference/structural
// data (Players, Spot/Test/Move Definitions, Shot Routine Steps, Workout
// Templates are deliberately excluded from export/import).
const RESULTS_TABLE_KEYS = ['workoutLogs', 'strengthLogs', 'benchmarkResults', 'shootingSessions', 'shotSpotResults', 'gameLog', 'gameShotResults'];

const RESULTS_TABLE_PLAYER_FIELD = {
  workoutLogs: FIELDS.workoutLogs.player,
  strengthLogs: FIELDS.strengthLogs.player,
  benchmarkResults: FIELDS.benchmarkResults.player,
  shootingSessions: FIELDS.shootingSessions.player,
  gameLog: FIELDS.gameLog.player,
  // shotSpotResults/gameShotResults have no player field of their own —
  // filtered by session/game membership instead, below.
};

// playerId === null exports every player. Keeps each record's raw Airtable
// {id, fields} shape (least lossy — cross-table links like
// shotSpotResults.Session stay intact as real record ids).
async function exportResultsJSON(playerId) {
  const out = {};
  let sessionIdsForPlayer = null;
  let gameIdsForPlayer = null;

  for (const key of RESULTS_TABLE_KEYS) {
    const table = TABLES[key];
    const all = await fetchAllRecords(table.id, {});
    let filtered = all;
    if (playerId) {
      if (key === 'shotSpotResults') {
        if (!sessionIdsForPlayer) sessionIdsForPlayer = new Set((out.shootingSessions || []).map((r) => r.id));
        filtered = all.filter((r) => (r.fields[FIELDS.shotSpotResults.session] || []).some((sid) => sessionIdsForPlayer.has(sid)));
      } else if (key === 'gameShotResults') {
        if (!gameIdsForPlayer) gameIdsForPlayer = new Set((out.gameLog || []).map((r) => r.id));
        filtered = all.filter((r) => (r.fields[FIELDS.gameShotResults.game] || []).some((gid) => gameIdsForPlayer.has(gid)));
      } else {
        const playerField = RESULTS_TABLE_PLAYER_FIELD[key];
        filtered = all.filter((r) => (r.fields[playerField] || []).includes(playerId));
      }
    }
    out[key] = filtered.map((r) => ({ id: r.id, fields: r.fields }));
  }
  return out;
}

function countJSONRecords(parsed) {
  return RESULTS_TABLE_KEYS.reduce((sum, key) => sum + (Array.isArray(parsed[key]) ? parsed[key].length : 0), 0);
}

// Additive/create-only, no de-dup or upsert-by-id — re-importing data that's
// already live creates duplicates, and any linked record (Session/Move/
// Template) referenced in a record's fields must already exist under that
// same id for the link to resolve. A manual backup/restore mechanism, not a
// merge tool — the caller should confirm with the user before calling this.
function importResultsJSON(parsed) {
  const items = [];
  RESULTS_TABLE_KEYS.forEach((key) => {
    const table = TABLES[key];
    const records = parsed[key];
    if (!Array.isArray(records)) return;
    records.forEach((rec) => {
      if (!rec || !rec.fields) return;
      items.push({
        localId: uuid(),
        tableId: table.id,
        fields: rec.fields,
        status: 'pending',
        createdAt: new Date().toISOString(),
        screenLabel: `Import: ${table.name}`,
      });
    });
  });
  Queue.addMany(items);
  return items.length;
}

function toCSV(rows, columns) {
  const escapeCell = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCell(row[c.key])).join(','));
  return [header, ...lines].join('\r\n');
}

// SPOTS/TESTS are stable seeded reference data (safe to resolve from the
// hardcoded consts), but Move Definitions and Workout Templates are
// growable picklists — fetched live here so a move/template added after
// this file's last data.js snapshot still resolves to a real name in CSV
// rather than falling back to a raw record id.
async function buildNameLookups() {
  const playerNameById = new Map(PLAYERS.map((p) => [p.id, p.name]));
  const spotNameById = new Map(SPOTS.map((s) => [s.id, s.name]));
  const testNameById = new Map(TESTS.map((t) => [t.id, t.name]));

  const moveNameById = new Map(MOVES.map((m) => [m.id, m.name]));
  try {
    (await fetchAllRecords(TABLES.moveDefinitions.id, {})).forEach((r) => {
      moveNameById.set(r.id, r.fields[FIELDS.moveDefinitions.name] || '(untitled move)');
    });
  } catch (e) { /* best-effort — unresolved moves just fall back to blank */ }

  const templateNameById = new Map();
  try {
    (await fetchAllRecords(TABLES.workoutTemplates.id, {})).forEach((r) => {
      templateNameById.set(r.id, r.fields[FIELDS.workoutTemplates.name] || '(untitled template)');
    });
  } catch (e) { /* best-effort */ }

  return { playerNameById, spotNameById, testNameById, moveNameById, templateNameById };
}

// Shot Spot Results have no player/date field — sessionInfoById (built from
// the already-fetched Shooting Sessions) joins one in, same as everywhere
// else in this app that needs player/date on a shot result.
function csvRowsForTable(key, records, lookups, sessionInfoById) {
  const first = (arr) => (arr || [])[0];
  switch (key) {
    case 'workoutLogs':
      return {
        columns: [
          { key: 'date', label: 'Date' }, { key: 'player', label: 'Player' },
          { key: 'category', label: 'Category' }, { key: 'duration', label: 'Duration (min)' },
          { key: 'intensity', label: 'Intensity' }, { key: 'grade', label: 'Performance Grade' },
          { key: 'template', label: 'Template' }, { key: 'comments', label: 'Comments' },
        ],
        rows: records.map((r) => ({
          date: r.fields[FIELDS.workoutLogs.date] || '',
          player: lookups.playerNameById.get(first(r.fields[FIELDS.workoutLogs.player])) || '',
          category: r.fields[FIELDS.workoutLogs.category] || '',
          duration: r.fields[FIELDS.workoutLogs.duration] ?? '',
          intensity: r.fields[FIELDS.workoutLogs.intensity] || '',
          grade: r.fields[FIELDS.workoutLogs.grade] || '',
          template: lookups.templateNameById.get(first(r.fields[FIELDS.workoutLogs.template])) || '',
          comments: r.fields[FIELDS.workoutLogs.comments] || '',
        })),
      };
    case 'strengthLogs':
      return {
        columns: [
          { key: 'date', label: 'Date' }, { key: 'player', label: 'Player' },
          { key: 'exercise', label: 'Exercise' }, { key: 'weight', label: 'Weight' },
          { key: 'reps', label: 'Reps' }, { key: 'sets', label: 'Sets' }, { key: 'notes', label: 'Notes' },
        ],
        rows: records.map((r) => ({
          date: r.fields[FIELDS.strengthLogs.date] || '',
          player: lookups.playerNameById.get(first(r.fields[FIELDS.strengthLogs.player])) || '',
          exercise: r.fields[FIELDS.strengthLogs.exercise] || '',
          weight: r.fields[FIELDS.strengthLogs.weight] ?? '',
          reps: r.fields[FIELDS.strengthLogs.reps] ?? '',
          sets: r.fields[FIELDS.strengthLogs.sets] ?? '',
          notes: r.fields[FIELDS.strengthLogs.notes] || '',
        })),
      };
    case 'benchmarkResults':
      return {
        columns: [
          { key: 'date', label: 'Date' }, { key: 'player', label: 'Player' },
          { key: 'test', label: 'Test' }, { key: 'result', label: 'Result' }, { key: 'notes', label: 'Notes' },
        ],
        rows: records.map((r) => ({
          date: r.fields[FIELDS.benchmarkResults.date] || '',
          player: lookups.playerNameById.get(first(r.fields[FIELDS.benchmarkResults.player])) || '',
          test: lookups.testNameById.get(first(r.fields[FIELDS.benchmarkResults.test])) || '',
          result: r.fields[FIELDS.benchmarkResults.resultValue] ?? '',
          notes: r.fields[FIELDS.benchmarkResults.notes] || '',
        })),
      };
    case 'shootingSessions':
      return {
        columns: [
          { key: 'date', label: 'Date' }, { key: 'player', label: 'Player' },
          { key: 'routine', label: 'Routine Used' }, { key: 'intensity', label: 'Intensity' },
          { key: 'grade', label: 'Performance Grade' }, { key: 'comments', label: 'Comments' },
        ],
        rows: records.map((r) => ({
          date: r.fields[FIELDS.shootingSessions.date] || '',
          player: lookups.playerNameById.get(first(r.fields[FIELDS.shootingSessions.player])) || '',
          routine: r.fields[FIELDS.shootingSessions.routineUsed] || '',
          intensity: r.fields[FIELDS.shootingSessions.intensity] || '',
          grade: r.fields[FIELDS.shootingSessions.grade] || '',
          comments: r.fields[FIELDS.shootingSessions.comments] || '',
        })),
      };
    case 'shotSpotResults':
      return {
        columns: [
          { key: 'date', label: 'Date' }, { key: 'player', label: 'Player' },
          { key: 'spot', label: 'Spot' }, { key: 'move', label: 'Move' },
          { key: 'moveDetail', label: 'Move Detail' }, { key: 'makes', label: 'Makes' }, { key: 'misses', label: 'Misses' },
        ],
        rows: records.map((r) => {
          const info = sessionInfoById.get(first(r.fields[FIELDS.shotSpotResults.session])) || { player: '', date: '' };
          return {
            date: info.date,
            player: info.player,
            spot: lookups.spotNameById.get(first(r.fields[FIELDS.shotSpotResults.spot])) || '',
            move: lookups.moveNameById.get(first(r.fields[FIELDS.shotSpotResults.move])) || '',
            moveDetail: r.fields[FIELDS.shotSpotResults.moveDetail] || '',
            makes: r.fields[FIELDS.shotSpotResults.makes] ?? '',
            misses: r.fields[FIELDS.shotSpotResults.misses] ?? '',
          };
        }),
      };
    case 'gameLog':
      return {
        columns: [
          { key: 'date', label: 'Date' }, { key: 'player', label: 'Player' }, { key: 'opponent', label: 'Opponent' },
          { key: 'minutes', label: 'Minutes' }, { key: 'points', label: 'Points' }, { key: 'rebounds', label: 'Rebounds' },
          { key: 'assists', label: 'Assists' }, { key: 'steals', label: 'Steals' }, { key: 'turnovers', label: 'Turnovers' },
          { key: 'whatWentWell', label: 'What Went Well' }, { key: 'whatToWorkOn', label: 'What To Work On' },
        ],
        rows: records.map((r) => ({
          date: r.fields[FIELDS.gameLog.date] || '',
          player: lookups.playerNameById.get(first(r.fields[FIELDS.gameLog.player])) || '',
          opponent: r.fields[FIELDS.gameLog.opponent] || '',
          minutes: r.fields[FIELDS.gameLog.minutesPlayed] ?? '',
          points: r.fields[FIELDS.gameLog.points] ?? '',
          rebounds: r.fields[FIELDS.gameLog.rebounds] ?? '',
          assists: r.fields[FIELDS.gameLog.assists] ?? '',
          steals: r.fields[FIELDS.gameLog.steals] || '',
          turnovers: r.fields[FIELDS.gameLog.turnovers] || '',
          whatWentWell: r.fields[FIELDS.gameLog.whatWentWell] || '',
          whatToWorkOn: r.fields[FIELDS.gameLog.whatToWorkOn] || '',
        })),
      };
    case 'gameShotResults':
      return {
        columns: [
          { key: 'date', label: 'Date' }, { key: 'player', label: 'Player' }, { key: 'opponent', label: 'Opponent' },
          { key: 'spot', label: 'Spot' }, { key: 'makes', label: 'Makes' }, { key: 'misses', label: 'Misses' },
        ],
        rows: records.map((r) => {
          const info = sessionInfoById.get(first(r.fields[FIELDS.gameShotResults.game])) || { player: '', date: '', opponent: '' };
          return {
            date: info.date,
            player: info.player,
            opponent: info.opponent,
            spot: lookups.spotNameById.get(first(r.fields[FIELDS.gameShotResults.spot])) || '',
            makes: r.fields[FIELDS.gameShotResults.makes] ?? '',
            misses: r.fields[FIELDS.gameShotResults.misses] ?? '',
          };
        }),
      };
    default:
      return { columns: [], rows: [] };
  }
}

// One CSV file per table (no zip library available, no build step to add
// one) — triggered as sequential downloads from a single button. Reuses
// exportResultsJSON for the underlying data pull, just serialized
// differently, per the spec.
async function exportResultsCSV(playerId) {
  const lookups = await buildNameLookups();
  const data = await exportResultsJSON(playerId);

  // Shared by both shotSpotResults (keyed by Shooting Session id) and
  // gameShotResults (keyed by Game Log id) below — record ids from the two
  // source tables can't collide, so one lookup map covers both joins.
  const sessionInfoById = new Map();
  (data.shootingSessions || []).forEach((r) => {
    sessionInfoById.set(r.id, {
      player: lookups.playerNameById.get((r.fields[FIELDS.shootingSessions.player] || [])[0]) || '',
      date: r.fields[FIELDS.shootingSessions.date] || '',
    });
  });
  (data.gameLog || []).forEach((r) => {
    sessionInfoById.set(r.id, {
      player: lookups.playerNameById.get((r.fields[FIELDS.gameLog.player] || [])[0]) || '',
      date: r.fields[FIELDS.gameLog.date] || '',
      opponent: r.fields[FIELDS.gameLog.opponent] || '',
    });
  });

  RESULTS_TABLE_KEYS.forEach((key) => {
    const records = data[key] || [];
    if (records.length === 0) return;
    const table = TABLES[key];
    const { columns, rows } = csvRowsForTable(key, records, lookups, sessionInfoById);
    const filename = `putting-in-the-work-${table.name.replace(/\s+/g, '-')}-${todayISO()}.csv`;
    downloadTextFile(filename, toCSV(rows, columns), 'text/csv');
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadTextFile(filename, content, mime) {
  downloadBlob(new Blob([content], { type: mime || 'text/plain' }), filename);
}

// Renders a simple session-summary card to a PNG blob for the "Share as
// image" best-effort path — plain <canvas> drawing, matching the app's
// dark theme colors directly (a detached canvas can't read CSS variables).
function sessionSummaryImageBlob(player, summary) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1c1916';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ed6c02';
    ctx.fillRect(0, 0, canvas.width, 8);

    ctx.fillStyle = '#f2ede7';
    ctx.font = 'bold 30px -apple-system, sans-serif';
    ctx.fillText(`${player.name} — Shooting`, 32, 60);
    ctx.fillStyle = '#a89f95';
    ctx.font = '18px -apple-system, sans-serif';
    ctx.fillText(summary.date, 32, 90);

    ctx.fillStyle = '#f2ede7';
    ctx.font = 'bold 52px -apple-system, sans-serif';
    ctx.fillText(`${Math.round(summary.overallPct)}%`, 32, 165);
    ctx.fillStyle = '#a89f95';
    ctx.font = '20px -apple-system, sans-serif';
    ctx.fillText(`${summary.totalMakes}/${summary.totalMakes + summary.totalMisses} makes`, 32, 195);

    ctx.font = '19px -apple-system, sans-serif';
    if (summary.best) {
      ctx.fillStyle = '#4caf50';
      ctx.fillText(`Best: ${summary.best.spot.name} (${Math.round(summary.best.pct)}%)`, 32, 250);
    }
    if (summary.worst) {
      ctx.fillStyle = '#e5484d';
      ctx.fillText(`Focus: ${summary.worst.spot.name} (${Math.round(summary.worst.pct)}%)`, 32, 285);
    }

    canvas.toBlob((blob) => {
      if (blob) resolve(blob); else reject(new Error('Could not render image'));
    }, 'image/png');
  });
}
