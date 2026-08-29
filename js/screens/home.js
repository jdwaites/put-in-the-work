const HomeScreen = {
  render(container) {
    container.innerHTML = '';
    container.appendChild(playerSwitcher(() => HomeScreen.render(container)));

    const player = PLAYERS.find((p) => p.id === CurrentPlayer.get());
    container.appendChild(h('div', { class: 'home-greeting', text: `Hey ${player.name} — what are we logging?` }));

    const tiles = [
      { key: 'workout', label: 'Log Workout', hash: '#workout', icon: '🏀' },
      { key: 'strength', label: 'Log Strength', hash: '#strength', icon: '💪' },
      { key: 'shooting', label: 'Log Shooting', hash: '#shooting', icon: '🎯' },
      { key: 'benchmark', label: 'Log Benchmark', hash: '#benchmark', icon: '📏' },
      { key: 'game', label: 'Log Game', hash: '#game', icon: '🏆' },
    ].filter((t) => player.screens.includes(t.key));
    const grid = h('div', { class: 'tile-grid' });
    tiles.forEach((t) => {
      grid.appendChild(
        h('a', { class: 'tile', href: t.hash }, [
          h('div', { class: 'tile-icon', text: t.icon }),
          h('div', { class: 'tile-label', text: t.label }),
        ])
      );
    });
    container.appendChild(grid);

    container.appendChild(
      h('div', { class: 'home-footer' }, [
        h('a', { class: 'settings-link', href: '#settings', text: '⚙ Settings & sync' }),
      ])
    );
  },
};
