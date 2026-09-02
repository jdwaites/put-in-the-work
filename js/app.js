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
  const screen = ROUTES[hash] || HomeScreen;
  screen.render(container);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => {
  render();
  Sync.flush();
});
