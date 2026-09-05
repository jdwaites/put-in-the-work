# Putting in the Work

A basketball/weightlifting training tracker for a family of four players —
used to log workouts, strength sets, shooting practice, athletic
benchmarks, and game performance. Analysis happens outside this repo
(Claude + Airtable's native charts); this repo is only the data capture
layer.

Player display names in `js/data.js` are pseudonyms, not real names/emails —
this repo is public on GitHub, the linked Airtable base is not. See the
"Players table" section below before ever "fixing" a name back to something
that looks more real.

## What this is

A static, no-build vanilla HTML/CSS/JS app meant to be opened on a phone and
added to the home screen. There is no backend, no bundler, no framework —
just `index.html` + `style.css` + plain `<script>` tags in `js/`. It writes
directly to Airtable's REST API from the browser using a Personal Access
Token the user pastes into the Settings screen (stored in `localStorage`
only, never sent anywhere but Airtable).

Serve it with any static file server, e.g. `python3 -m http.server` from the
repo root, then open `http://localhost:8000`.

**Deployed at** https://jdwaites.github.io/put-in-the-work/ via GitHub Pages
(builds automatically from `main` on every push). Repo must stay public for
Pages to work — the account is on GitHub Free, which only serves Pages sites
from public repos (Pro/Team/Enterprise support private-repo Pages). If it
ever needs to go private, Netlify's free tier can deploy the same static
files from a private repo instead.

`service-worker.js` caches the whole app shell (stale-while-revalidate) so
the installed home-screen icon opens with zero signal — this is what
actually makes "gym wifi is unreliable" survivable, not the hosting choice.
It only has to fetch fresh once after a deploy; every launch after that
serves from cache instantly regardless of connectivity. It deliberately
ignores anything cross-origin (api.airtable.com) — that traffic still goes
through the local-first queue in `js/sync.js`, unrelated to this cache.

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
  `setInterval` + `online` listener flush it to Airtable. A queue item can
  depend on more than one not-yet-synced parent at once (e.g. a Shot Spot
  Result created against both a brand-new Session *and* a brand-new Move in
  the same submit), so dependencies are a list: `item.dependsOn = [{localId,
  linkField}, ...]`, all of which must resolve before the item can push —
  see `unresolvedDependencies()`.
- `js/ui.js` — shared tap-friendly components: player switcher, tap-select
  segmented control, numeric stepper, toast, sync status badge, and
  `courtDiagram()` (added for Game Log v2) — a schematic inline-SVG
  half-court with tappable zones, built via `svgEl()` (an `h()`-alike that
  creates elements in the SVG namespace, since `document.createElement`
  builds SVG tags in the wrong namespace and they silently fail to render).
- `js/recent.js` — "last 5 entries + delete" used at the bottom of every
  entry screen. Reads go straight to the Airtable REST API (GET a recent
  window, then filter client-side by linked-record ID — deliberately not a
  server-side filter on the Player's Airtable display name, since this
  file's player labels are pseudonyms that don't match the real name typed
  into the base); pending/not-yet-synced items are pulled from the local
  queue so a just-saved entry shows up immediately. Delete uses a two-tap
  "Confirm?" button for already-synced
  rows (DELETE to Airtable) but deletes pending rows on one tap (it's just
  removing a local queue item, nothing destructive yet). Deleting a Shooting
  Session cascades to its Shot Spot Results, both for synced sessions
  (`deleteShootingSessionCascade`) and pending ones (`onDeletePending` in
  `js/screens/shooting.js` also removes queue items whose `dependsOn` list
  includes the session being deleted) — Game Log deletion works the same way
  for Game Shot Results (`deleteGameLogCascade` in `js/screens/game.js`).
- `js/screens/*.js` — one file per entry screen (home, workout, strength,
  shooting, benchmark, game, settings). Each is a plain object with a
  `render(container)` method; `js/app.js` is a minimal hash-based router.
  Home filters its tiles by the current player's `screens` list in
  `js/data.js` (or a stored per-player override — see `effectiveScreens()`
  in `js/storage.js`); as of 2026-09-04 all four players track everything
  (`ALL_SCREENS`), so this filtering exists for a future profile that might
  need a narrower set, not because any current player does.

## Known simplifications (not gaps to "fix" without asking)

- Workout Templates are created inline from the Workout Log screen (name +
  description + optional video link only — no separate management screen,
  no edit, no delete). Creating one while offline queues it the same way as
  any other record and the pending Workout Log correctly depends on it via
  `dependsOn` until it syncs.
- Move Definitions follow the same inline-create, growable-picklist pattern,
  triggered from the "+ Add new move…" option inside a Shot Spot Result
  row's Move dropdown on the Shooting screen.
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

- Added a 4th player (`recgP5EtYuvNd96io`, Age Group "adult", displayed as
  "Age" in `js/data.js`, real name Adrienne). Originally walks-focused with
  `screens` limited to `workout`/`strength`; changed 2026-09-04 to
  `ALL_SCREENS` (same as every other player) at the user's request, so she
  now tracks shooting/benchmark/game too. If a device already completed
  onboarding for her with the old default accepted as-is, no
  `PlayerScreenOverrides` entry would have been written (onboarding only
  stores an override when the selection *differs* from the default — see
  `js/screens/onboarding.js`), so this data.js change takes effect
  immediately there. If onboarding was ever completed with a *deliberately
  narrower* selection for her, that stored override in
  `pw_player_screen_overrides` (localStorage) would still take precedence
  over the new default and needs clearing (or re-running onboarding for
  her) on that specific device.
- All four `PLAYERS` display names in `js/data.js` are pseudonyms chosen to
  keep this public repo from pairing real first names with ages. The
  Airtable base's own Player "Name" field still has the real names — that's
  fine, the base is private. Don't "fix" the mismatch; it's intentional.

### Photo avatars in the player switcher (2026-08-30)

Three players have a real photo (`avatar: 'icons/players/{mal,ike,khi}.jpg'`
in `js/data.js`) shown instead of a text label in `playerSwitcher()`
(`js/ui.js`) — this is a **deliberate, informed exception** to the
pseudonym-everything rule above, made by the user with full awareness that
this repo and its images are fully public. Do not "fix" this back to text
or flag it as a privacy regression; it was a conscious choice, not an
oversight. What *is* still enforced:
- Image files are named after the pseudonym (`mal.jpg`), never a real name.
- No visible name/caption renders next to the photo — the button's
  `aria-label` (from `p.name`, the pseudonym) carries the accessible name
  for screen readers; the `<img>` itself has `alt=""` so it isn't announced
  twice.
- The 4th player (`avatar: null`) still renders as a plain pseudonym-text
  button — no photo was provided for that profile.
- Source photos were resized/center-cropped to 256×256 JPEGs (originals
  were 400KB–1.2MB each, phone photos are usually much larger — a fresh
  photo added later should get the same treatment, e.g. via a portable
  static ffmpeg build if no image tool is installed: `ffmpeg -i in.jpg -vf
  "crop='min(iw,ih)':'min(iw,ih)',scale=256:256" -q:v 4 out.jpg`) and are
  precached in `service-worker.js`'s `APP_SHELL` so they load offline too.
- Two separate player-selector components exist and **both** need this
  treatment: the shared `playerSwitcher()` in `js/ui.js` (used by Home,
  Workout, Strength, Benchmark, Game) and the bespoke multi-select tab
  renderer inside `ShootingScreen.render()` in `js/screens/shooting.js`
  (needed for its own add/switch/remove co-practice semantics, so it never
  called `playerSwitcher()`). Both apply the same pattern independently:
  `p.avatar ? h('img', {class:'player-avatar', src:p.avatar, alt:''}) :
  p.name`, plus `aria-label: p.name` on the button and a `player-btn-photo`
  class. If a 3rd player-selector UI is ever added, it needs this same
  three-part treatment applied explicitly — it does not come for free.
- Added a **Video URL** field (Airtable type `url`) to both **Workout Logs**
  and **Workout Templates**, for linking a YouTube video the workout
  follows. Purely additive — no existing fields were touched.

## Shooting screen v2 — co-practice mode (2026-08-30)

The original single-player Shooting screen was rebuilt after real use
surfaced problems (each shot creating its own Session instead of batching
into one; no way to log the move/combo into a shot; no support for logging
two kids shooting together without losing progress switching between them).
Schema additions to support this: **Move Definitions** (`tblTtW7Cb9ABn57T0`,
growable like Workout Templates, tagged Simple/Moderate/Complex), **Shot
Routine Steps** (`tblLqzth9yqg9YRRV`, ordered steps grouped by "Routine
Name" — queried live, never hardcoded, so a new routine added in Airtable
shows up with no app change), plus **Routine Used** on Shooting Sessions and
**Move** / **Move Detail** on Shot Spot Results (Move Detail reuses the old
"Notes" field's ID — Airtable renamed it, this app didn't repurpose it).

- **Co-practice state** lives in `js/storage.js`'s `ShootingDrafts`
  (`pw_shooting_copractice` in localStorage) — a list of "active" player
  IDs plus one independent draft per active player (date, routine,
  intensity/grade/comments, spot rows). Switching which player's draft is
  shown never touches the other players' drafts; this is deliberately
  *not* the same thing as the app-wide `CurrentPlayer` used by every other
  screen — `CurrentPlayer` only seeds the *first* active player when the
  screen is opened with no practice already in progress.
- **Submit** creates one Shooting Session + its linked Shot Spot Results
  per active player, all in one action, then calls `ShootingDrafts.clear()`
  — interpreted as "clear once successfully queued locally," matching every
  other screen's local-first save, *not* "wait for an Airtable round-trip"
  (that would contradict offline-first: on bad gym wifi the draft would
  never clear and a parent would likely resubmit and double-log).
  Immediately after clearing, the screen re-seeds one fresh empty draft for
  a single player rather than showing a blank "no one selected" state.
- A **row's Move can itself be brand-new** (via "+ Add new move…"), which
  is why `js/sync.js`'s dependency handling had to become a list
  (`dependsOn: [...]`) instead of a single parent — that Shot Spot Result
  now depends on both its Session *and* its Move syncing before it can push.
- Duration is intentionally **never shown or written to** on this screen
  (the field still exists on Shooting Sessions in Airtable, just always
  blank from this app) — Duration matters for Workout/Strength logging, not
  shooting, per the v2 spec.
- The primary "Log Entry" text field on both Shooting Sessions and Shot
  Spot Results is always composed by the app from already-selected
  data (spot/move/makes/etc.) — the user is never shown a text box to type
  a label into. That was the original bug report ("spot was entered
  twice"): composing it in code is fine, prompting for it is not.

### Default routine auto-prefill (2026-08-30)

The screen must open already prefilled, not blank until you notice a
dropdown — `DEFAULT_ROUTINE_NAME` in `js/data.js` (currently "Jump Shot
Workout (10 makes)") is auto-applied to any draft the user has never
actually interacted with, the moment routine data loads. Shot Routine
Steps also carries a **Step Detail** field (e.g. "1 dribble left, crossover
to right hand, shoot from right wing") that prefills straight into each
generated row's Move Detail — without it, a prefilled routine still looked
like bare Spot/Move dropdowns with nothing in the detail field, which read
as "not actually prefilled."

The subtle part: a draft that's genuinely untouched and a draft where the
user deliberately picked "Custom (start blank)" are otherwise
indistinguishable (`routineName: '', rows: []` either way). That's why
`emptyShootingDraft()` carries a `routineTouched` flag, set the moment the
user picks *anything* from the routine dropdown (including Custom) — the
auto-prefill only ever fires when `!routineTouched`, so a deliberate blank
choice sticks across screen visits instead of silently getting the default
routine re-forced back onto it next time.

### Fetch failures must be visible, not silent (2026-08-30)

`fetchMoves()` and `fetchRoutines()` return `{ ok, error, moves/routines }`,
not just the data — a failed fetch (most likely cause in practice: the
user's Airtable Personal Access Token was scoped to specific tables and
never granted access to Move Definitions / Shot Routine Steps, since those
tables were created after the token) used to look *identical* to "fetched
fine, nothing's defined yet": an empty dropdown with zero explanation.
`renderBody()` now shows a `.fetch-error` banner with the actual error
(HTTP status included, from `airtableGet`'s thrown message) pointing at
Settings when either fetch fails. If you add another live-fetched picker
to this screen later, follow the same `{ ok, error, data }` shape rather
than swallowing the failure.

**Two unrelated bugs, both surfacing as a 422 on the same table**: the
missing `sort[N][direction]` above was one; separately, `fetchRoutines()`
also sent `pageSize: '200'` — Airtable's REST API hard-caps `pageSize` at
100 per request and rejects anything higher with a 422, same as a
malformed sort. Fixing the sort bug alone still left it broken, which
briefly looked like the fix hadn't worked at all. If a 422 shows up again
on any Airtable request in this app, check *every* query param against
the actual API docs, not just the first plausible-looking one — `pageSize`
must stay ≤ 100 everywhere (see the other `airtableGet` call sites for the
correct pattern).

### Makes prefilled to the routine's own target (2026-08-30)

`populateDraftFromRoutine()` sets a prefilled row's `makes` to that step's
`targetMakes` (10 for a "10 makes" routine, 20 for "20 makes", 15 for
whatever the next one is) rather than always starting at 0 — the
assumption is the target was hit, and the player adjusts Makes down /
Misses up only for spots that didn't go perfectly, instead of tapping "+"
up from zero at every spot. This is driven entirely by each step's own
Target Makes field, so it applies to any routine added later with no app
change, not just the two seeded today. Manually-added freeform rows (via
"+ Add spot", no routine involved) still default `makes: 0` — there's no
target to assume there.

## Game Log v2 — co-practice mode + shot chart (2026-09-03)

The original Game Log screen kept its in-progress entry in a plain JS
`state` object scoped to whichever player was selected, with nothing
persisted to `localStorage` — tapping the player switcher mid-entry just
re-ran `render()` for the new player and silently threw the other player's
unsaved stats away. That was a real bug report (logged one kid's game,
switched to log the other's, lost the first one's data) and is fixed the
same way Shooting v2 fixed the equivalent problem: `GameDrafts`
(`js/storage.js`) keeps one independent, `localStorage`-persisted draft per
active player, so switching tabs — or leaving the screen entirely and
coming back — never touches another player's in-progress entry.

New this rebuild: a visual court **shot chart** replaces manual Points
entry. `courtDiagram()` (`js/ui.js`) renders a schematic (not to-scale)
half-court as inline SVG with 14 tappable zones, one per Spot Definition,
positioned by `GAME_SPOT_COORDS` in `js/screens/game.js` (keyed by Spot id,
not name, so it survives a spot rename in Airtable). Tapping a zone opens
an Attempts/Makes/Misses editor for that spot, same clamping behavior as
Shooting's spot rows (Makes can never exceed Attempts). Each spot with an
entry becomes a **Game Shot Results** record (`tblhvXPh4MV96bl3X`, added
this rebuild) linked to its Game Log entry — mirroring Shot Spot
Results/Shooting Sessions, including the same `dependsOn` sync-queue
pattern for the not-yet-synced parent.

**Points is now computed, not typed in.** Spot Definitions gained a
**Point Value** field (2026-09-03): 3 for the classic three-point spots
(both corners, both wings, Top of Key), 1 for Free Throw, 2 for everything
else (`SPOTS[].pointValue` in `js/data.js` mirrors it). Points on the
submitted Game Log record is `sum(row.makes * spot.pointValue)` across the
chart — there is no manual Points field anywhere in this screen or its
editor. If a new Spot Definition is ever added, it needs a Point Value set
in Airtable (and a coordinate in `GAME_SPOT_COORDS`) or it silently
contributes 0 points from the chart.

Also surfaced by this rebuild: **Steals** and **Turnovers** already existed
as fields on the live Game Log table but had never been added to
`FIELDS.gameLog` or exposed in the app — a genuine schema-doc drift, not a
new addition. Both are `singleLineText` in Airtable (not number), so they
render as free-entry text inputs here, not steppers.

Co-practice submit/edit follow the same conventions as Shooting v2:
`GameDrafts.clear()` fires immediately on successful local queueing, not
after an Airtable round-trip (offline-first — see Shooting v2 above for
why), and `LastSaved.set('gameSession', ...)` stores the whole
game-plus-shot-rows shape (not just flat Game Log fields) so the Edit Last
Entry hub's Game tab (`renderGameSessionEditForm` in
`js/screens/edit-last.js`) can reconcile every row — patch ones still
present, delete ones removed, create ones added — the same way
`renderShootingSessionEditForm` already did for Shooting.

### Attempts is derived from Makes + Misses, never a direct input (2026-09-03)

Every Attempts/Makes/Misses stepper triple in the app (Game Log's shared
shot chart, Shooting's spot rows, both screens' "edit last" forms) went
through two iterations the same day. First pass: Attempts and Makes were
both independently editable, clamped so Makes couldn't exceed Attempts —
but that meant making a shot when Makes already equaled Attempts silently
did nothing until Attempts was bumped manually first, and even the
corrected one-directional-sync version of that (Makes auto-raising
Attempts, but Attempts still independently settable) was wrong on the real
requirement: **attempts only ever go up over the course of a game or
session** — there's no real-world action that un-attempts a shot, so
Attempts should never have been a freely-adjustable stepper (up *or* down)
at all.

Fixed by dropping Attempts as an input entirely. **Makes and Misses are the
only two steppers** — the two things you actually tap as each shot happens
— and Attempts renders as a plain read-only `stepper-readonly` display
computed as `makes + misses`, recalculated on every Makes or Misses change.
This is simpler than the sync logic it replaced, not just more correct:
there's no clamping to write at all, since `makes > attempts` is no longer
a state that can occur (attempts is defined in terms of makes). Applied
identically in all five places this pattern is duplicated
(`js/screens/game.js`, `js/screens/shooting.js` ×2, `js/screens/edit-last.js`
×2) — if a sixth Attempts/Makes/Misses stepper set is ever added, it needs
the same shape (two editable counters + one derived read-only sum), since
each occurrence is independently copy-pasted rather than sharing one
implementation.

### Every active player shown side by side, one shared color-coded chart (2026-09-03)

Game Log originally followed Shooting's tab model: tapping a player's tab
switched which single player's entry was visible, hiding the rest. Changed
twice in the same day as real usage clarified what was actually wanted —
first to one always-visible card per player (stacked), then to the current
shape: every active player's card renders **side by side** in a responsive
grid (`.game-cards-grid`, `grid-template-columns: repeat(auto-fit,
minmax(260px, 1fr))` — wraps to one column on a narrow phone, sits side by
side once there's room), and the shot chart is **one shared court diagram**
above the cards rather than one per player, since logging a real game means
both kids' shots happened on the *same* physical court at the same time.
Tabs only add/remove a player from today's practice; they no longer gate
visibility.

**Shared chart, per-player color.** `courtDiagram()` (`js/ui.js`) takes a
`series` array per spot — one entry per active player — and splits a spot
with shots from 2+ players into equal colored pie wedges (`pieWedgePath()`
does the arc math); a spot only one player has shot from just fills solid
in their color; untouched spots stay a neutral gray circle. Colors always
come from an inline `style="fill:..."` on the SVG element, never a CSS
class — a class-based `fill` rule would silently win over the shape's own
per-player color in the cascade (inline `style` beats any stylesheet
selector), which is why `.court-spot-circle`/`.court-spot-outline` in
`style.css` only ever set `stroke`, not `fill`. The spot number renders
with a white-fill/black-stroke outline (`paint-order: stroke`) so it stays
legible over any wedge color. Tapping a spot opens **one shared editor**
(`renderSharedSpotEditor`) with a `.game-shot-editor-col` per active
player — its own Makes/Misses steppers plus a read-only derived Attempts
display, colored to match (see "Attempts is derived..." below) — so two
kids' shots at the same spot get logged side by side in one tap, not one
screen each. A column's row is only written into that specific player's
draft the moment *their* Makes or Misses actually changes (never on open/
close), same anti-phantom-row guard as before, scoped per player.

**Colors are assigned once, permanently, per player.** `GAME_PLAYER_COLORS`
is keyed by a player's fixed position in `PLAYERS`, not by activePlayers
order — so a given player's card/wedges are always the same color across
visits, regardless of who else is active or what order they were added.

**App shell widens for this layout.** `#app` gets a `wide` class
(`max-width: min(1100px, 100vw)`) whenever Game Log has 2+ players active,
toggled directly in `js/screens/game.js`, so the side-by-side grid actually
gets real estate on a tablet/desktop browser instead of staying capped at
the app's normal 480px phone width. This is reset centrally in `js/app.js`'s
router `render()` (`classList.remove('wide')` before every screen renders)
rather than in each screen, specifically so a stale wide layout from a
previous Game Log visit can never leak into a screen that never asked for
it — if another screen ever wants this same treatment, it should add the
`wide` class itself the same way, not rely on a prior screen having left it
on. Deliberately `100vw`, not a smaller percentage — an earlier version
used `96vw` for desktop breathing room, but on a phone (see below, the
primary way this screen is actually used) shaving off even that 4% was
enough to push the two-column card grid back down to one column, working
directly against the whole point of widening in the first place. `#screen`'s
own 16px padding already keeps content off the phone's edges, so `#app`
doesn't need a margin of its own on top of that.

**Card/stepper sizing is tuned for two columns on an actual phone
(2026-09-04).** `.game-cards-grid`'s column minimum is 165px (down from an
initial 260px — about a 37% cut), specifically so two cards fit side by
side on a ~375px+ phone screen with `#screen`'s 32px of combined padding
accounted for: `165×2 + 10px gap = 340px`, comfortably under what's left on
an iPhone SE/mini-class phone and up. Below roughly 360px of viewport width
it still falls back to one column via `auto-fit` — a graceful, unbroken
degradation, not a bug, on the very smallest devices. Steppers inside
`.game-player-card` and `.game-shot-editor-col` shrink to 44px tap targets
(from the app's usual 56px) to fit that width — 44px is the standard
minimum comfortable touch-target size, so this isn't a usability
regression, just tighter than the generous default. Text inputs keep their
16px font size untouched throughout — dropping below 16px on any focusable
input is what triggers iOS Safari's auto-zoom-on-focus, which would make
the two-column layout actively worse to use, not better. These overrides
are scoped to Game Log's own classes only; every other screen (Workout,
Strength, Benchmark, Shooting) keeps the full-size steppers.

**No more big photo-tab row for active players.** The first version of this
redesign kept Shooting's tab-switcher look — a row of large avatar buttons,
colored when active, with a small ✕ next to each to remove them — even
though switching had already been removed as a concept. That left a row of
buttons that did nothing when tapped (an active player's photo was already
fully identified by their own card below) and quietly duplicated the
remove action in a second location. Replaced with `renderAddPlayerRow()`:
a compact row that only ever lists players who *aren't* active yet, as
plain "+ Name" buttons — it shows nothing once everyone eligible for games
is already logged. Removing a player now lives on their own card instead
(a `✕`/"Confirm remove?" two-tap button in `renderPlayerForm`'s header,
shown only when 2+ players are active so the last one can't be removed) —
the destructive action sits next to the data it deletes rather than in a
separate control that reads as a toggle. If a similar side-by-side,
always-visible-card pattern gets built elsewhere, skip the tab row
entirely and go straight to this shape.

**The rendering split that matters if this pattern gets copied elsewhere**:
each card has an independent `formHost` (rebuilt on every keystroke via
`renderPlayerForm(playerId)`, scoped to just that player's own
minutes/rebounds/assists/etc — no chart in here anymore) and `recentHost`
(fetched once via `renderPlayerRecent(playerId)`, only on structural
changes — add/remove player, initial load, post-submit). Wiring a field's
`onChange` to rebuild the *whole* card would silently re-fetch that
player's recent-entries list from Airtable on every single stepper tap. The
shared chart has its own similarly-scoped `renderChart()` (rebuilds the SVG
+ the one open spot's editor, called by any active player's Attempts/Makes
change — cheap since it's just SVG) kept separate from `renderCards()`
(rebuilds the whole card grid — only on add/remove/submit) for the same
reason. There's a shared `submitHost` (one combined Submit button below
everything, listing whichever players actually have data) refreshed via
`renderSubmitBar()` alongside every field handler across both the chart and
each card, since typing into any of them can change who's eligible to
submit.

## Testing

No JS runtime is guaranteed to be present in a fresh dev container (no
`node`/`npm`/`chromium-cli` by default here). If you need to verify a
change, download a portable Node build and use `jsdom` to load the app and
simulate clicks/inputs rather than assuming a browser is available — see
git history for the pattern used the first time this was built. `jsdom`
tests always stub `fetch` and never hit the real Airtable API, so
automated testing never pollutes the live base — but **the user testing a
change on their actual phone/browser does**, and that happened enough
during this project's early days that a real evening practice session got
mixed in with debugging clutter and needed careful manual reconciliation
(see the Airtable data cleanup note below). If you're walking the user
through testing a change live, say so explicitly and consider suggesting
a throwaway date or a way to distinguish real entries from test ones.

## Airtable data cleanup (2026-08-30)

A real evening practice session (Ike + Khi shooting, ~2026-08-29 evening)
had gotten fragmented into 11 separate one-shot-per-session records by the
v1 bug this whole shooting-screen rebuild fixed, and was mixed in with
real debugging/test data created while building and testing the app live.
That got reconciled: the 11 real per-shot sessions were consolidated into
2 clean sessions (one per player, each holding its real Shot Spot
Results — the original per-shot move description moved into that
result's Move Detail field, since that field didn't exist yet when this
data was logged), and every other populated row across Workout Logs,
Strength Logs, Benchmark Results, Game Log, and the remaining test
Shooting Sessions/Shot Spot Results was deleted as test data. Player
records, Spot/Test/Move Definitions, Shot Routine Steps, and Workout
Templates (including one the user built themselves through the app) were
untouched — reference/structural data, not results.

Every table's Airtable description now starts with a tag visible right in
the Airtable UI: **`[📊 RESULTS — logged data to analyze]`** (Workout
Logs, Strength Logs, Benchmark Results, Shooting Sessions, Shot Spot
Results, Game Log) or **`[⚙️ STRUCTURAL — powers the app, edit with
care]`** (Players, Workout Templates, Test Definitions, Spot Definitions,
Move Definitions, Shot Routine Steps). Keep this tag when editing a
table's description, and tag any new table the same way.
