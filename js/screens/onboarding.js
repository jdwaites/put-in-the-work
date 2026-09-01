// First-run flow. This does NOT create a new Airtable Player — PLAYERS in
// js/data.js is a fixed roster of 4 real, already-seeded family members, so
// "onboarding" here just means: pick which of the 4 you are, confirm/adjust
// that player's tracked sports, then land on Home. Gated in js/app.js's
// render() for every hash except #settings (needs to stay reachable so a
// user can paste their PAT before anything else works).

const SCREEN_LABELS = {
  workout: 'Workout',
  strength: 'Strength',
  shooting: 'Shooting',
  benchmark: 'Benchmark',
  game: 'Game',
};

const OnboardingScreen = {
  render(container) {
    let step = 1;
    let selectedPlayerId = CurrentPlayer.get();
    let selectedScreens = effectiveScreens(PLAYERS.find((p) => p.id === selectedPlayerId) || PLAYERS[0]).slice();

    function renderStep() {
      container.innerHTML = '';
      container.appendChild(h('div', { class: 'screen-header' }, [
        h('div', { class: 'screen-title', text: 'Welcome' }),
      ]));
      const body = h('div', { class: 'screen-body' });

      if (step === 1) {
        body.appendChild(h('div', { class: 'home-greeting', text: 'Who is this?' }));
        body.appendChild(playerSwitcher((playerId) => {
          selectedPlayerId = playerId;
          const player = PLAYERS.find((p) => p.id === playerId);
          selectedScreens = effectiveScreens(player).slice();
          step = 2;
          renderStep();
        }));
      } else {
        const player = PLAYERS.find((p) => p.id === selectedPlayerId);
        body.appendChild(h('div', { class: 'home-greeting', text: `What does ${player.name} track?` }));
        const list = h('div', { class: 'onboarding-checkbox-list' });
        ALL_SCREENS.forEach((screenKey) => {
          const row = h('label', { class: 'onboarding-checkbox-row' }, [
            h('input', {
              type: 'checkbox',
              checked: selectedScreens.includes(screenKey) ? 'checked' : null,
              onchange: (e) => {
                selectedScreens = e.target.checked
                  ? [...selectedScreens, screenKey].filter((s, i, arr) => arr.indexOf(s) === i)
                  : selectedScreens.filter((s) => s !== screenKey);
              },
            }),
            h('span', { text: SCREEN_LABELS[screenKey] }),
          ]);
          list.appendChild(row);
        });
        body.appendChild(list);

        body.appendChild(secondaryButton('← Back', () => {
          step = 1;
          renderStep();
        }));
        body.appendChild(primaryButton('Done', () => {
          CurrentPlayer.set(selectedPlayerId);
          const isDefault = player.screens.length === selectedScreens.length
            && player.screens.every((s) => selectedScreens.includes(s));
          if (!isDefault) PlayerScreenOverrides.set(selectedPlayerId, selectedScreens);
          Onboarding.markComplete();
          window.location.hash = '#home';
          render(); // hash may already be #home, which wouldn't fire hashchange on its own
        }));
      }

      container.appendChild(body);
    }

    renderStep();
  },
};
