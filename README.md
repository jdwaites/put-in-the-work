# Putting in the Work

A mobile-first basketball & weightlifting training tracker built as a static Progressive Web App, backed by Airtable. No backend server, no build step — just HTML, CSS, and vanilla JavaScript that syncs directly to Airtable's REST API from the browser.

**Live app:** https://jdwaites.github.io/put-in-the-work/

## What this is

A family training log for logging workouts, strength sets, shooting practice, athletic benchmarks, and game performance — designed to be added to a phone's home screen and used mid-workout with sweaty hands, spotty gym wifi, and (sometimes) a 9-year-old holding the phone.

It supports four player profiles, each with their own age-appropriate defaults (e.g. bodyweight/high-rep strength defaults for the youngest profile vs. loaded weight×reps×sets for an older one), and one profile focused on walks instead of basketball entirely — that profile only sees the screens relevant to it.

Analysis happens outside this repo entirely: the Airtable base is connected directly to Claude for natural-language queries, and Airtable's own native charts/interfaces handle dashboards. This app's only job is fast, reliable data capture.

## Features

- **Workout Log** — basketball or weightlifting sessions, with an inline "add a new workout type" flow (growable template picklist) and an optional YouTube link per entry.
- **Strength Log** — weight × reps × sets, with defaults that change based on the player's age group, and an optional link back to a workout logged the same day.
- **Shooting** — the most involved screen:
  - **Co-practice mode**: multiple players can shoot in the same session, each with their own independent in-progress draft (switching between players never loses the other's rows), submitted together in one action.
  - **Routine picker**: predefined shooting routines (e.g. "Jump Shot Workout") are pulled live from Airtable — never hardcoded — and prefill every spot, move, and target make count for the routine, while staying fully editable.
  - **Growable move picklist**: shot moves (catch-and-shoot, step-back jumper, etc.) are tagged by complexity, and a brand-new move can be added inline mid-session.
  - Every field is optional to override; nothing is ever locked to the routine's defaults.
- **Benchmark** — logs against a fixed athletic testing battery (vertical jump, sprint times, agility, etc.).
- **Game Log** — points/rebounds/assists/minutes plus freeform "what went well" / "what to work on" notes, to check whether practice is actually showing up in games.
- **Recent entries + delete** on every screen — the last 5 entries for the current player, with a two-tap confirm to delete a mistaken entry (one-tap if it hasn't synced yet).
- **Player avatars** — three of the four profiles use a photo instead of a text label in the player switcher.

## Offline-first, always

Every save writes to a local queue first and is considered "done" the moment it's queued — sync to Airtable happens in the background, retrying automatically as connectivity allows. A dead spot at the gym never loses a logged entry. A service worker caches the entire app shell so the installed home-screen icon opens instantly even with zero signal, once it's been opened at least once with a connection.

## Architecture

```
index.html          Single-page shell; hash-based routing (#workout, #shooting, ...)
style.css            All styling — dark theme, large tap targets, responsive
service-worker.js    App-shell cache (stale-while-revalidate)
manifest.json        PWA metadata for "Add to Home Screen"

js/
  data.js            Airtable base/table/field IDs, seeded reference data, choice lists
  storage.js         localStorage access: settings, queue, drafts, caches
  sync.js            Background sync engine with multi-dependency resolution
  ui.js              Shared components: player switcher, tap-select, stepper, toast
  recent.js          "Last 5 entries + delete" component, shared across screens
  screens/
    home.js          Tile grid, filtered per player
    workout.js       Workout Log entry + inline template creation
    strength.js      Strength Log entry, age-gated defaults
    shooting.js       Co-practice shooting entry, routines, growable moves
    benchmark.js      Benchmark Result entry
    game.js           Game Log entry
    settings.js       Airtable token, sync queue inspector
  app.js             Router
```

No dependencies, no package manager, no bundler. Open `index.html` directly or serve the folder with any static file server (`python3 -m http.server`, `npx serve`, GitHub Pages, Netlify — anything that serves static files over HTTP/HTTPS works).

## Getting started

1. **Get an Airtable Personal Access Token** at [airtable.com/create/tokens](https://airtable.com/create/tokens) with `data.records:read` and `data.records:write` scope, granted access to the whole base (not just specific tables — see [Extending the data model](#extending-the-data-model) for why that matters).
2. **Serve the app.** Any static host works. For local development:
   ```
   python3 -m http.server 8000
   ```
   then open `http://localhost:8000`.
3. **Paste the token into the app's Settings screen.** It's stored only in that browser's `localStorage` — never sent anywhere except directly to Airtable's API.
4. **Add it to your home screen** (Share → Add to Home Screen on iOS, ⋮ menu → Add to Home Screen/Install app on Android) for a full-screen, app-like experience.

Each device/browser needs the token entered once. Multiple devices can use the app simultaneously with no conflicts — every submission just creates new records, so two people logging entries on two different phones at the same time never collide.

## Data model

The Airtable base has two kinds of tables, and each one's description in Airtable is tagged accordingly so it's clear at a glance which is which:

**📊 RESULTS — logged data meant for analysis:**
Workout Logs, Strength Logs, Benchmark Results, Shooting Sessions, Shot Spot Results, Game Log.

**⚙️ STRUCTURAL — reference data that powers the app itself:**
Players, Workout Templates, Test Definitions, Spot Definitions, Move Definitions, Shot Routine Steps.

### Extending the data model

Not every structural table works the same way:

| Table | Behavior |
|---|---|
| Move Definitions | Fetched live from Airtable every time the Shooting screen loads. **Add a new move directly in Airtable and it appears in the app with no code change.** |
| Shot Routine Steps | Same — routines are queried live and grouped by "Routine Name." Add a new routine's steps in Airtable and it shows up in the Routine picker automatically. |
| Workout Templates | Same — fetched live (and can also be created from inside the app itself). |
| Players | Hardcoded in `js/data.js` (id, display name, age group, which screens they see, avatar). Adding a Player row in Airtable does **not** add a button to the switcher — that needs a code change. |
| Spot Definitions | Hardcoded in `js/data.js`. A new court spot added in Airtable won't appear in the Spot dropdown without a code update. |
| Test Definitions | Hardcoded in `js/data.js`. Same as Spot Definitions — a new test needs a code update to show up on the Benchmark screen. |

The growable tables were designed to change often (new drills, new routines); Players/Spots/Tests were treated as a fixed foundation and baked into the code so the app works instantly offline before any network request resolves, rather than showing a blank picker on first load.

## Privacy note

This repository and the deployed app are **public**. Player display names shown in the app are pseudonyms, not real names — deliberately chosen so a public GitHub repo never pairs a real first name with an age. The Airtable base itself (private) can use real names freely; only what ships in this public repo is de-identified. See `CLAUDE.md` for the full reasoning and history if you're extending this project.

## Out of scope

No native mobile app, no custom backend/cloud infrastructure, no meal or nutrition tracking, no situational shot context (game-speed vs. standstill) — kept intentionally simple to stay reliable and easy to maintain as a personal project.
