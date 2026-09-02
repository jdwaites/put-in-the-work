// Minimal, dependency-free inline-SVG line chart for the Reports page's
// trend graphs — no build step in this app, so no charting library. x-axis
// is chronological entry index (not date-scaled — avoids date-math edge
// cases when gaps between sessions are irregular).

function lineChartSVG(values, opts) {
  const { width = 280, height = 72, color = 'var(--accent)' } = opts || {};
  const padding = 6;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(height));
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('class', 'trend-chart');
  if (!values || values.length === 0) return svg;

  const min = opts && opts.min !== undefined ? opts.min : Math.min(...values);
  const max = opts && opts.max !== undefined ? opts.max : Math.max(...values);
  const range = (max - min) || 1;
  const n = values.length;
  const xStep = n > 1 ? (width - padding * 2) / (n - 1) : 0;

  const toXY = (v, i) => {
    const x = padding + i * xStep;
    const clamped = Math.min(max, Math.max(min, v));
    const y = height - padding - ((clamped - min) / range) * (height - padding * 2);
    return [x, y];
  };

  const points = values.map((v, i) => toXY(v, i).map((n2) => n2.toFixed(1)).join(',')).join(' ');
  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('points', points);
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', color);
  polyline.setAttribute('stroke-width', '2');
  polyline.setAttribute('stroke-linejoin', 'round');
  polyline.setAttribute('stroke-linecap', 'round');
  svg.appendChild(polyline);

  // Dot on the most recent point so the current value is easy to spot.
  const [lastX, lastY] = toXY(values[n - 1], n - 1);
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('cx', lastX.toFixed(1));
  dot.setAttribute('cy', lastY.toFixed(1));
  dot.setAttribute('r', '3');
  dot.setAttribute('fill', color);
  svg.appendChild(dot);

  return svg;
}

// Approximate half-court spot positions in a 0-190 x / 0-190 y box, hoop
// near the bottom — hand-placed to roughly match where each named spot
// (Corner, Wing, Elbow, Top of Key, etc.) sits on a real half-court. This
// app has no actual court-geometry data (Spot Definitions only has a name
// and a display number), so these are illustrative, not survey-accurate.
// Keyed by Spot id from js/data.js.
const SHOT_CHART_POSITIONS = {
  recvt7IoNGUs25crN: { x: 22, y: 165 },  // Left Corner
  recPcsCe8Vfft397Y: { x: 52, y: 172 },  // Left Baseline
  recPZg3xkZZMTeups: { x: 95, y: 65 },   // Top of Key
  recxpTUiUwDhkuwhd: { x: 143, y: 172 }, // Right Baseline
  recAgwKaHLH3DWyRn: { x: 173, y: 165 }, // Right Corner
  recgRM7M8YjlOjrpz: { x: 32, y: 110 },  // Left Wing
  recVQvwPZp6nxzhhg: { x: 70, y: 100 },  // Left Elbow
  recWuDrGt3jQs5KOR: { x: 95, y: 100 },  // Free Throw
  rec0fYXQfKksH5z7Q: { x: 120, y: 100 }, // Right Elbow
  recCaPGjortnBvHBr: { x: 158, y: 110 }, // Right Wing
  recH94U836VFT3zdQ: { x: 80, y: 140 },  // Left Mid-Paint
  recgsSiMW9lzPpuwE: { x: 110, y: 140 }, // Right Mid-Paint
  recOKWcUxOwZfEkt8: { x: 76, y: 115 },  // Left High Post
  recNE7eo8TTYx1IXj: { x: 114, y: 115 }, // Right High Post
};

function shotChartColor(pct) {
  if (pct === null || pct === undefined) return 'var(--border)';
  if (pct < 40) return 'var(--bad)';
  if (pct < 60) return 'var(--warn)';
  return 'var(--good)';
}

// stats: [{ spot, attempts, pct }] — pct null means the spot wasn't shot in
// whatever scope the caller computed (currently: the last session),
// rendered as a neutral gray dot rather than omitted, so every spot always
// shows up on the chart even before it has real data.
function shotChartSVG(stats) {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs) => {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  };

  const svg = el('svg', { viewBox: '0 0 190 190', width: '100%', class: 'shot-chart' });
  const courtLine = { fill: 'none', stroke: 'var(--border)', 'stroke-width': '1.5' };

  svg.appendChild(el('rect', { x: 5, y: 5, width: 180, height: 175, ...courtLine }));
  svg.appendChild(el('line', { x1: 65, y1: 180, x2: 65, y2: 100, ...courtLine })); // paint, left
  svg.appendChild(el('line', { x1: 125, y1: 180, x2: 125, y2: 100, ...courtLine })); // paint, right
  svg.appendChild(el('line', { x1: 65, y1: 100, x2: 125, y2: 100, ...courtLine })); // free-throw line
  svg.appendChild(el('circle', { cx: 95, cy: 100, r: 28, ...courtLine })); // free-throw circle
  svg.appendChild(el('line', { x1: 80, y1: 163, x2: 110, y2: 163, ...courtLine })); // backboard
  svg.appendChild(el('circle', { cx: 95, cy: 170, r: 6, ...courtLine })); // rim
  svg.appendChild(el('path', { d: 'M15,180 L15,138 A125,125 0 0 1 175,138 L175,180', ...courtLine })); // 3pt line

  stats.forEach(({ spot, attempts, pct }) => {
    const pos = SHOT_CHART_POSITIONS[spot.id];
    if (!pos) return;
    const g = el('g', {});
    const dot = el('circle', { cx: pos.x, cy: pos.y, r: 13, fill: shotChartColor(pct), opacity: pct === null ? '0.4' : '0.92' });
    g.appendChild(dot);

    const label = el('text', {
      x: pos.x, y: pos.y + 4, 'text-anchor': 'middle', 'font-size': '11', 'font-weight': '700',
      fill: pct === null ? 'var(--text-dim)' : 'var(--accent-text)',
    });
    label.textContent = pct === null ? '–' : String(Math.round(pct));
    g.appendChild(label);

    const title = document.createElementNS(NS, 'title');
    title.textContent = pct === null
      ? `${spot.name}: not shot`
      : `${spot.name}: ${Math.round(pct)}% (${attempts} attempts)`;
    g.appendChild(title);

    svg.appendChild(g);
  });

  return svg;
}
