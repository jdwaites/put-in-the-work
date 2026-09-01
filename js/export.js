// Shared download/share primitives — no backend, so everything routes
// through the browser's own download/clipboard/share mechanisms. Used by
// the Reports session-summary card and by JSON/CSV export in Settings.

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
