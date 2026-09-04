const ROUTES = {
  '#home': HomeScreen,
  '#workout': WorkoutScreen,
  '#strength': StrengthScreen,
  '#shooting': ShootingScreen,
  '#benchmark': BenchmarkScreen,
  '#game': GameScreen,
  '#reports': ReportsScreen,
  '#edit-last': EditLastScreen,
  '#settings': SettingsScreen,
};

function render() {
  const hash = window.location.hash || '#home';
  const container = document.getElementById('screen');
  // #settings must stay reachable pre-onboarding so a user can paste their
  // Airtable token before anything else in the app can work.
  if (!Onboarding.isComplete() && hash !== '#settings') {
    OnboardingScreen.render(container);
    window.scrollTo(0, 0);
    return;
  }
  // Reset the app shell's width before every screen renders — only Game
  // Log (with 2+ players active) asks to widen it back via #app.wide, and
  // resetting here (rather than in every screen) means a screen that never
  // touches this can't accidentally inherit a stale wide layout left over
  // from a previous visit to Game Log.
  document.getElementById('app').classList.remove('wide');
  const screen = ROUTES[hash] || HomeScreen;
  screen.render(container);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => {
  render();
  Sync.flush();
});
