# Putting in the Work

A basketball/weightlifting training tracker for three users — Mal, Ike
(12–14), and Khi (9–11) — used to log workouts, strength sets, shooting
practice, athletic benchmarks, and game performance. Analysis happens outside
this repo (Claude + Airtable's native charts); this repo is only the data
capture layer.

## What this is

A static, no-build vanilla HTML/CSS/JS app meant to be opened on a phone and
added to the home screen. There is no backend, no bundler, no framework —
just `index.html` + `style.css` + plain `<script>` tags in `js/`. It writes
directly to Airtable's REST API from the browser using a Personal Access
Token the user pastes into the Settings screen (stored in `localStorage`
only, never sent anywhere but Airtable).

Serve it with any static file server, e.g. `python3 -m http.server` from the
repo root, then open `http://localhost:8000`.

## Airtable base (source of truth for schema)

- Base: **Putting in the Work**, ID `appYZdp23DOulnJwm`
- Table IDs, field names, seeded record IDs (players, spots, tests), and
  single-select choice strings are hardcoded in [js/data.js](js/data.js).
  This file is a **snapshot fetched from the live Airtable API** — if the
  base schema changes (renamed field, new choice option, new seeded row),
  re-fetch via the Airtable API/MCP tools and update this file rather than
  guessing. Field names are case-sensitive and used directly as REST API
  keys.
- Every table also carries unused leftover columns from Airtable's default
  template (Assignee, Status, Attachments, Attachment Summary) and a few
  blank leftover rows in Players/Test Definitions/Spot Definitions/Workout
  Templates — these are pre-existing base clutter, not a bug in this app.
  `data.js` already filters them out of the reference lists.

## Architecture

- `js/data.js` — static reference data: base/table/field IDs, seeded
  Players/Spots/Tests, single-select choice strings.
- `js/storage.js` — all `localStorage` access: settings (PAT), current
  player, the pending sync queue, resolved local→real record ID map,
  per-screen "repeat last entry" cache, recent-workout cache.
- `js/sync.js` — background sync engine. Every save goes into a local queue
  first (local-first, so bad gym wifi never loses an entry) and a
  `setInterval` + `online` listener flush it to Airtable. Handles the one
  real dependency in the schema: a Shooting Session must sync before its
  Shot Spot Results can carry the real session record ID, so child items
  carry `dependsOnLocalId` and are held back until the parent resolves.
- `js/ui.js` — shared tap-friendly components: player switcher, tap-select
  segmented control, numeric stepper, toast, sync status badge.
- `js/recent.js` — "last 5 entries + delete" used at the bottom of every
  entry screen. Reads go straight to the Airtable REST API (GET, filtered by
  player via `SEARCH(.... ARRAYJOIN({Player}))`); pending/not-yet-synced
  items are pulled from the local queue so a just-saved entry shows up
  immediately. Delete uses a two-tap "Confirm?" button for already-synced
  rows (DELETE to Airtable) but deletes pending rows on one tap (it's just
  removing a local queue item, nothing destructive yet). Deleting a Shooting
  Session cascades to its Shot Spot Results, both for synced sessions
  (`deleteShootingSessionCascade`) and pending ones (`onDeletePending` in
  `js/screens/shooting.js` also removes queue items whose
  `dependsOnLocalId` points at the session being deleted).
- `js/screens/*.js` — one file per entry screen (home, workout, strength,
  shooting, benchmark, game, settings). Each is a plain object with a
  `render(container)` method; `js/app.js` is a minimal hash-based router.
  Home filters its tiles by the current player's `screens` list in
  `js/data.js` (Age only sees Workout + Strength — no basketball-
  specific screens).

## Known simplifications (not gaps to "fix" without asking)

- Workout Templates are created inline from the Workout Log screen (name +
  description + optional video link only — no separate management screen,
  no edit, no delete). Creating one while offline queues it the same way as
  any other record and the pending Workout Log correctly depends on it via
  `dependsOnLocalId`/`linkFieldForParent` until it syncs.
- Strength Log's "link to a recent workout" only offers workouts that have
  *already synced* (from `RecentWorkouts` cache), not ones still sitting in
  the local queue — avoids a second dependency chain for a field the schema
  marks optional.
- "Recent entries" fetches live from Airtable (needs a token + connection);
  offline it shows pending queue items only, not older synced history.
- No native mobile app, no AWS/GCP infra, no meal/nutrition tracking, no
  game-speed-vs-standstill shot context — all explicitly out of scope per
  the original project brief.

## Players table / schema additions since initial build (2026-08-29)

- Added a 4th player, **Age** (`recgP5EtYuvNd96io`, Age Group "adult"),
  who does walks rather than basketball — her `screens` list in
  `js/data.js` only includes `workout` and `strength`.
- Added a **Video URL** field (Airtable type `url`) to both **Workout Logs**
  and **Workout Templates**, for linking a YouTube video the workout
  follows. Purely additive — no existing fields were touched.

## Testing

No JS runtime is guaranteed to be present in a fresh dev container (no
`node`/`npm`/`chromium-cli` by default here). If you need to verify a
change, download a portable Node build and use `jsdom` to load the app and
simulate clicks/inputs rather than assuming a browser is available — see
git history for the pattern used the first time this was built.
