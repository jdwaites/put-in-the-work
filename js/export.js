// Shared download/share primitives — no backend, so everything routes
// through the browser's own download/clipboard/share mechanisms. Used by
// the Reports session-summary card and by JSON/CSV export in Settings.

// The 6 "RESULTS" tables — logged data to analyze, not reference/structural
// data (Players, Spot/Test/Move Definitions, Shot Routine Steps, Workout
// Templates are deliberately excluded from export/import).
const RESULTS_TABLE_KEYS = ['workoutLogs', 'strengthLogs', 'benchmarkResults', 'shootingSessions', 'shotSpotResults', 'gameLog'];

const RESULTS_TABLE_PLAYER_FIELD = {
  workoutLogs: FIELDS.workoutLogs.player,
  strengthLogs: FIELDS.strengthLogs.player,
  benchmarkResults: FIELDS.benchmarkResults.player,
  shootingSessions: FIELDS.shootingSessions.player,
  gameLog: FIELDS.gameLog.player,
  // shotSpotResults has no player field of its own — filtered by session
  // membership instead, below.
};

// playerId === null exports every player. Keeps each record's raw Airtable
// {id, fields} shape (least lossy — cross-table links like
// shotSpotResults.Session stay intact as real record ids).
async function exportResultsJSON(playerId) {
  const out = {};
  let sessionIdsForPlayer = null;

  for (const key of RESULTS_TABLE_KEYS) {
    const table = TABLES[key];
    const all = await fetchAllRecords(table.id, {});
    let filtered = all;
    if (playerId) {
      if (key === 'shotSpotResults') {
        if (!sessionIdsForPlayer) sessionIdsForPlayer = new Set((out.shootingSessions || []).map((r) => r.id));
        filtered = all.filter((r) => (r.fields[FIELDS.shotSpotResults.session] || []).some((sid) => sessionIdsForPlayer.has(sid)));
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
