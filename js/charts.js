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
