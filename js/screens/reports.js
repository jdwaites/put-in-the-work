// Reports: a separate, per-player page (not mixed into entry flows) showing
// always-current personal records, trend graphs, a suggested practice
// focus, and a shareable session-summary card — all computed client-side
// from data already in Airtable, no external charting service.

const MIN_ATTEMPTS_FOR_PR = 5; // avoid small-sample noise on a single spot

const ReportsScreen = {
  render(container) {
    container.innerHTML = '';
    container.appendChild(backHeader('Reports'));
    container.appendChild(playerSwitcher(() => ReportsScreen.render(container)));

    const playerId = CurrentPlayer.get();
    const player = PLAYERS.find((p) => p.id === playerId);
    const screens = effectiveScreens(player);
    const body = h('div', { class: 'screen-body' });
    container.appendChild(body);

    if (!Settings.hasToken()) {
      body.appendChild(h('div', { class: 'fetch-error', text: 'Add your Airtable token in Settings to see reports.' }));
      return;
    }
    if (!navigator.onLine) {
      body.appendChild(h('div', { class: 'recent-offline', text: 'Offline — reports need a connection to load.' }));
      return;
    }

    body.appendChild(h('div', { class: 'queue-empty', text: 'Loading…' }));

    loadReportData(player, screens)
      .then((data) => {
        body.innerHTML = '';
        renderPersonalRecords(body, player, screens, data);
      })
      .catch((e) => {
        body.innerHTML = '';
        body.appendChild(h('div', { class: 'fetch-error', text: `Couldn't load report data: ${e.message}` }));
      });
  },
};

async function loadReportData(player, screens) {
  const data = { shotResults: [], benchmarkRecords: [] };
  if (screens.includes('shooting')) {
    data.shotResults = await fetchPlayerShotSpotResults(player.id);
  }
  if (screens.includes('benchmark')) {
    const all = await fetchAllRecords(TABLES.benchmarkResults.id, {});
    data.benchmarkRecords = all.filter((r) => (r.fields[FIELDS.benchmarkResults.player] || []).includes(player.id));
  }
  return data;
}

// A session's worth of attempts at a spot is the natural PR unit — nothing
// stops multiple rows for the same spot in one session, so group by
// (spot, session) first, sum makes/misses within the group, then take the
// best session-% per spot among groups meeting the attempts threshold.
function computeShotPRs(shotResults) {
  const bySpotSession = new Map();
  shotResults.forEach((r) => {
    if (!r.spotId || !r.sessionId) return;
    const key = `${r.spotId}::${r.sessionId}`;
    const g = bySpotSession.get(key) || { spotId: r.spotId, date: r.date, makes: 0, misses: 0 };
    g.makes += r.makes;
    g.misses += r.misses;
    if (r.date && r.date > g.date) g.date = r.date;
    bySpotSession.set(key, g);
  });

  const bestBySpot = new Map();
  bySpotSession.forEach((g) => {
    const attempts = g.makes + g.misses;
    if (attempts < MIN_ATTEMPTS_FOR_PR) return;
    const pct = (g.makes / attempts) * 100;
    const existing = bestBySpot.get(g.spotId);
    if (!existing || pct > existing.pct) {
      bestBySpot.set(g.spotId, { pct, makes: g.makes, attempts, date: g.date });
    }
  });

  return SPOTS.map((spot) => ({ spot, pr: bestBySpot.get(spot.id) })).filter((x) => x.pr);
}

// Direction inferred from each test's unit (no explicit direction field on
// Test Definitions) — seconds is lower-is-better, everything else here
// (inches, reps) is higher-is-better. Correct for all 8 seeded tests today.
function computeBenchmarkPRs(benchmarkRecords) {
  const byTest = new Map();
  benchmarkRecords.forEach((r) => {
    const testId = (r.fields[FIELDS.benchmarkResults.test] || [])[0];
    const value = r.fields[FIELDS.benchmarkResults.resultValue];
    if (!testId || typeof value !== 'number') return;
    const test = TESTS.find((t) => t.id === testId);
    if (!test) return;
    const date = r.fields[FIELDS.benchmarkResults.date] || '';
    const lowerIsBetter = test.unit === 'seconds';
    const existing = byTest.get(testId);
    const better = !existing || (lowerIsBetter ? value < existing.value : value > existing.value);
    if (better) byTest.set(testId, { value, date });
  });
  return TESTS.map((test) => ({ test, pr: byTest.get(test.id) })).filter((x) => x.pr);
}

function renderPersonalRecords(body, player, screens, data) {
  body.appendChild(h('h3', { class: 'section-heading', text: 'Personal Records' }));
  let renderedAnySection = false;

  if (screens.includes('shooting')) {
    renderedAnySection = true;
    const shotPRs = computeShotPRs(data.shotResults);
    body.appendChild(h('div', { class: 'field-label', text: `Best FG% by spot (${MIN_ATTEMPTS_FOR_PR}+ attempts in a session)` }));
    if (shotPRs.length === 0) {
      body.appendChild(h('div', { class: 'queue-empty', text: 'No spot has enough attempts in a single session yet.' }));
    } else {
      const list = h('div', { class: 'recent-list' });
      shotPRs.forEach(({ spot, pr }) => {
        list.appendChild(h('div', { class: 'spot-row' }, [
          h('div', { class: 'spot-row-name', text: spot.name }),
          h('div', { class: 'spot-row-stats', text: `${Math.round(pr.pct)}% (${pr.makes}/${pr.attempts}) – ${pr.date}` }),
        ]));
      });
      body.appendChild(list);
    }
  }

  if (screens.includes('benchmark')) {
    renderedAnySection = true;
    const benchmarkPRs = computeBenchmarkPRs(data.benchmarkRecords);
    body.appendChild(h('div', { class: 'field-label', text: 'Best benchmark results' }));
    if (benchmarkPRs.length === 0) {
      body.appendChild(h('div', { class: 'queue-empty', text: 'No benchmark results yet.' }));
    } else {
      const list = h('div', { class: 'recent-list' });
      benchmarkPRs.forEach(({ test, pr }) => {
        list.appendChild(h('div', { class: 'spot-row' }, [
          h('div', { class: 'spot-row-name', text: test.name }),
          h('div', { class: 'spot-row-stats', text: `${pr.value} ${test.unit} – ${pr.date}` }),
        ]));
      });
      body.appendChild(list);
    }
  }

  if (!renderedAnySection) {
    body.appendChild(h('div', { class: 'queue-empty', text: `${player.name} isn't tracking Shooting or Benchmark yet.` }));
  }
}
