const ROUTES = {
  '#home': HomeScreen,
  '#workout': WorkoutScreen,
  '#strength': StrengthScreen,
  '#shooting': ShootingScreen,
  '#benchmark': BenchmarkScreen,
  '#game': GameScreen,
  '#settings': SettingsScreen,
};

function render() {
  const hash = window.location.hash || '#home';
  const screen = ROUTES[hash] || HomeScreen;
  const container = document.getElementById('screen');
  screen.render(container);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => {
  render();
  Sync.flush();
});
