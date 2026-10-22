## Why

The operator can already disturb the simulation with precipitation and strong wind, but
both are ordinary weather. A deliberately over-the-top disaster — Godzilla stomping onto
the fairground — makes the demo memorable, exercises the full disturbance path (domain →
command → endpoint → integration event → Queue → dashboard) once more, and for the first
time makes a disturbance **visible in the 3D digital twin** rather than only in the
weather panel.

## What Changes

- Add a third user-triggerable disturbance, **Godzilla**, alongside precipitation and
  strong wind: a new `Godzilla` weather regime that lasts about three minutes of simulation
  time and then returns to `Calm`.
- Godzilla does not change temperature, wind, sunshine or precipitation — the readings keep
  drifting toward the calm defaults — but while it is active the **nice-weather indicator is
  0**. Through the existing weather-update event this stops all new queue arrivals (nobody
  joins a queue next to a kaiju); the queue that is already there drains normally.
- `POST /weather/godzilla` triggers it, mirroring `POST /weather/strong-wind`.
- The weather panel gets a third disturbance button, **Summon Godzilla**, with the same
  pending/failure behaviour as the other two, and its animated scene and regime label
  reflect the new regime.
- The 3D ride visualization shows a giant **Godzilla model** while the regime is active:
  it walks in from the edge of the scene, stands roaring next to the ride, and walks off
  when the regime ends. The model is the CC0 low-poly *Dino* by Quaternius (rigged,
  with Walk/Idle/Punch animations, ~400 KB GLB), loaded only when Godzilla first appears.
- The ride itself is **not** affected: no emergency stop, no physics change.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `weather-events`: adds the Godzilla event — trigger, (absence of) weather effects, and
  its ~3 minute duration.
- `weather-simulation`: the nice-weather indicator is forced to 0 while Godzilla is active.
- `weather-api`: adds `POST /weather/godzilla`.
- `weather-disturbance-controls`: a third, *Summon Godzilla*, button.
- `weather-panel-display`: the animated scene and regime label reflect the Godzilla regime.
- `ride-dashboard-layout`: the central visualization shows Godzilla next to the ride while
  the regime is active.

## Impact

- **Weather module** (`src/Weather/…`): `WeatherRegime.Godzilla` in Abstractions (appended,
  so existing numeric values are unchanged), `WeatherDefaults` duration/profile,
  `Weather.StartGodzilla()`, store method, `Features/StartGodzilla/` command + handler,
  telemetry disturbance kind, DI registration, endpoint. Tests in
  `FourDotnet.BoogaBooster.Weather.Tests`.
- **Integration event**: no schema change — the regime already travels as a string in
  `WeatherUpdateIntegrationEvent`. **Queue**: no code change; it already scales arrivals by
  `NiceWeather` and stops them at 0.
- **DigitalTwin backend**: untouched.
- **Angular app**: weather models/source/state/controls/scene, `ride-dashboard` passes the
  regime to `bb-ride-visualization`, which gains a lazily loaded Godzilla layer
  (`GLTFLoader` from `three/examples`, already a dependency). New asset
  `public/3dmodels/godzilla.glb` (~400 KB) plus a credits file.
- **Naming**: "Godzilla" is a Toho trademark. The model is a generic CC0 dinosaur, not a
  Godzilla likeness; the name appears only as an in-joke label in this non-commercial demo.
