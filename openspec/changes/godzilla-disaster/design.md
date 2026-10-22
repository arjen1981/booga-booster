# Design

## Context

See `proposal.md` for motivation and `specs/` for the behavioural contract.

How disturbances work today:

- **Domain.** `WeatherRegime { Calm = 0, Precipitation = 1, StrongWind = 2 }` lives in
  `Weather.Abstractions`. `Weather.StartStrongWind()` sets `Regime` and
  `RemainingEventDuration`; `Weather.Advance()` counts the duration down, returns to `Calm`
  at zero, and drifts every reading toward `WeatherDefaults.ProfileFor(Regime)`.
  `ToConditionDto()` computes `NiceWeather` from the readings via `WeatherNiceness`.
- **Application/feature.** `Features/StartStrongWind/` holds a `Command` + a
  `CommandHandler<T>` that calls `IWeatherStore.StartStrongWind()`, adds to the
  `boogabooster.weather.disturbances` counter with a `weather.disturbance.kind` tag, and
  publishes the snapshot as `WeatherUpdateIntegrationEvent` (`weather-updated`). The
  regime travels in that event as a **string**.
- **HTTP.** `POST /weather/strong-wind`, no body, `202`.
- **Queue** consumes only `NiceWeather`; at 0 `ArrivalPlanner` yields zero arrivals.
- **DigitalTwin** has no weather dependency at all.
- **Frontend.** `weather/models` maps the regime (`REGIME_BY_INDEX` — order matters for
  numeric enum payloads) and derives a `WeatherScene.kind` used by the CSS-animated
  `weather-conditions-view`. `WeatherSource`/`HttpWeatherSource`/`FakeWeatherSource` and
  `WeatherStateService` carry one method + pending signal per disturbance;
  `weather-disturbance-controls` renders two buttons in a 2-column grid.
- **3D view.** `ride-visualization.ts` (Three.js 0.169, `OrbitControls` from
  `three/examples/jsm`) builds the ride procedurally, takes only ride-motion inputs, and
  knows nothing about weather. Ride footprint: main arm 6 m + hub arm 2 m + half a gondola
  ≈ **9 m swept radius**, ≈ 7.5 m tall. Default camera at (18, 13, 18) looking at
  (0, 5.5, 0); fog from 40 m to 95 m.
- The `4dotnet-csharp-style-guide` MCP server was unreachable while this was written; the
  apply phase must consult it before writing C# (as CLAUDE.md requires).

### Chosen model

[*Dino* by Quaternius on Poly Pizza](https://poly.pizza/m/wuerCFCWNR) — **CC0**, glTF
binary 404 KB, ~5.4 k triangles, one skinned armature, 14 animations including
`CharacterArmature|Walk`, `|Idle`, `|Punch`, `|Run`. Materials are named
(`Dino_Main`, `Dino_Secondary`, eyes, teeth, tongue), which makes recolouring easy.
Rejected: sugamo's *KAIJYU* (CC BY 3.0, static OBJ-derived, no rig — could not walk);
Mechagodzilla/Godzilla fan models (derivative of Toho's IP).

## Goals / Non-Goals

**Goals:**
- Godzilla is a first-class disturbance built exactly like strong wind, so the pattern stays
  uniform and the event schema stays unchanged.
- The visible effect in the digital twin is decoupled from the weather model: the
  visualization knows "Godzilla present: yes/no", nothing about regimes.
- Zero cost until Godzilla is first summoned (no loader code or model in the initial load).

**Non-Goals:**
- Any effect on the ride: no emergency stop, no physics, no `DigitalTwin` change.
- Actively evacuating the existing queue (the planned `bad-weather-closure` change covers
  evacuation semantics); here arrivals simply stop.
- Godzilla interacting with the rig (collisions, knocking gondolas), sound, or camera moves.
- Fixing the pre-existing DTO-placement discrepancy in `WeatherEndpoints` — the new endpoint
  has no body, so it adds no DTO.

## Decisions

### D1. Godzilla is a weather regime, appended to the enum
Add `WeatherRegime.Godzilla = 3`. Appending keeps the numeric values of existing members
stable for any client that receives numbers; the frontend appends `'Godzilla'` to
`REGIME_BY_INDEX` in the same position.
*Alternative:* a separate "disaster" concept/aggregate — rejected: the existing regime
machinery (start, countdown, return to `Calm`, publish) is exactly the needed behaviour, and
a parallel mechanism would duplicate it and need a new integration event.

### D2. Readings follow the calm profile
`WeatherDefaults.ProfileFor(Godzilla)` returns the `Calm` profile, and
`GodzillaDuration = TimeSpan.FromMinutes(3)` sits with the other durations. No new magic
numbers outside `WeatherDefaults`.

### D3. Niceness override lives in the domain
`Weather.ToConditionDto()` reports `NiceWeather = 0` when `Regime == Godzilla`, otherwise
the existing `WeatherNiceness.Calculate(...)`. Because the store snapshot, the
`IWeatherConditionProvider` and the publisher all derive from `ToConditionDto()`, every
consumer sees the same value with one change.
*Alternative:* overriding in the publisher — rejected; `GET /weather` and the provider would
then disagree with the event.

### D4. Feature slice mirrors StartStrongWind
`Weather.StartGodzilla()`, `IWeatherStore`/`WeatherStore.StartGodzilla()`,
`Features/StartGodzilla/StartGodzillaCommand` + `StartGodzillaCommandHandler`
(implements `ExecuteAsync`; tags the regime in `EnrichActivity`; counter tag
`WeatherTelemetryAttributes.GodzillaDisturbance = "godzilla"`), registered in
`AddWeatherModule()`, mapped as `POST /weather/godzilla` → `202` in `WeatherEndpoints`.

### D5. Frontend weather plumbing mirrors strong wind
- `WeatherRegime` type and `REGIME_BY_INDEX` gain `'Godzilla'`; `regimeLabel` → "Godzilla";
  `sceneFor` returns a new `kind: 'godzilla'` (checked before precipitation, like wind).
- `WeatherSource.startGodzilla()` (HTTP: `POST /api/weather/godzilla`, then `refresh()`),
  the fake records `godzillaCalls`, `WeatherStateService` gets a `godzillaPending` signal
  through the existing `run(...)` helper and error message.
- `weather-disturbance-controls` adds a third button (🦖, accessible name "Summon
  Godzilla", same `disabled`/`aria-busy` pattern). The grid changes from `1fr 1fr` to
  `repeat(auto-fit, minmax(6.5rem, 1fr))` so three buttons fit the narrowest rail
  (280 px) and wrap instead of overflowing.
- `weather-conditions-view` gets a `data-kind="godzilla"` scene: a dark, decorative
  silhouette rising behind the horizon and a short periodic backdrop shake, all inside the
  existing `aria-hidden` scene and disabled under `prefers-reduced-motion`.

### D6. Visualization input is a boolean, fed by the dashboard
`bb-ride-visualization` gains `godzillaPresent = input(false)`. `ride-dashboard.ts` injects
`WeatherStateService` and binds
`[godzillaPresent]="weather.conditions()?.regime === 'Godzilla'"` (exact accessor per the
service's API). Keeping the input boolean means the 3D code has no dependency on the
weather model, and the existing purely-decorative status of the visualization holds — the
regime is already conveyed in text by the weather panel.

### D7. A self-contained `GodzillaActor` drives the figure
New `visualization/godzilla-actor.ts`, owned by the visualization component:

- **State machine** `absent → loading → entering → present → leaving → absent`, advanced by
  `update(dt, wanted: boolean)` from the existing animation loop. If the regime ends while
  still loading or entering, it turns round and leaves; if it returns while leaving, it
  comes back.
- **Pose as a pure function.** `godzillaPose(phase, t)` returns `{ position, heading,
  clip }` for a phase and its elapsed time, so the walking path and timings are unit-tested
  without WebGL. Placement: stands **16 m** from the ride axis (outside the 9 m swept
  radius with margin) on the far side of the ride from the default camera, facing the ride;
  enters from **45 m** out along the same bearing (inside the fog, so it emerges from the
  haze) over ~6 s; leaves by turning round and walking back out over ~6 s.
- **Animation.** `THREE.AnimationMixer` with cross-faded `Walk` while moving and `Idle`
  while standing, plus a `Punch` "roar" played once every ~6 s while present. Clips are
  looked up by suffix (`…|Walk`) so the armature prefix does not matter; a missing clip
  degrades to a static pose.
- **Scale** is computed at load time from the model's bounding box so the figure is
  **18 m** tall (≈ 2.5× the ride) regardless of the file's units.
- **Look.** At load, `Dino_Main` is recoloured charcoal green and `Dino_Secondary` a pale
  dorsal-plate grey, so the cartoon dinosaur reads as a kaiju; meshes cast shadows.
- **Loading.** On the first `wanted = true`, `GLTFLoader` is pulled in with a dynamic
  `import('three/examples/jsm/loaders/GLTFLoader.js')` and `/3dmodels/godzilla.glb` is
  fetched; both land in a lazy chunk/request, never in the initial load. The loaded scene is
  cached for later appearances. A load failure is caught, logged once with `console.warn`,
  and leaves the actor permanently `absent`.
- **Reduced motion.** When the component's existing reduced-motion flag is set, the actor
  jumps straight to the standing pose / removal and never advances the mixer.
- **Disposal.** Hooked into the component's existing `disposeScene` on destroy (geometries,
  materials, textures, `mixer.stopAllAction()`).

### D8. Asset shipped unmodified, credited
The GLB is committed byte-for-byte as `public/3dmodels/godzilla.glb` (recolouring happens
at runtime, D7), with `public/3dmodels/CREDITS.md` naming source, author and CC0. Served
like the existing `boogabooster.fbx`.

## Risks / Trade-offs

- [The CC0 model looks like a friendly cartoon dinosaur, not a kaiju] → runtime recolour,
  18 m scale, fog entrance and the roar clip; the model is a single file, so a better one
  can be swapped in later without code changes beyond clip names.
- [Trademark: "Godzilla" name] → generic CC0 model, no Toho likeness; label used as an
  in-joke in a non-commercial demo (noted in the proposal).
- [Numeric-vs-string enum drift between backend and frontend] → enum value appended;
  frontend `REGIME_BY_INDEX` test asserts index 3 maps to `'Godzilla'`.
- [Three.js rendering cannot be unit-tested in jsdom] → logic sits in the pure
  `godzillaPose` and the actor's state machine (testable with a stub loader); the rendered
  result is checked by running the app in a real browser.
- [Merge overlap with the unmerged `kermis-soundboard` PR] → both touch
  `ride-dashboard.html/.ts`, but different lines (soundboard adds `<bb-soundboard />`; this
  adds an input binding and an injection). Resolve trivially when catching up with
  `development`.
- [Queue appears unaffected for a while] → by design arrivals stop but the existing queue
  drains at the ride's pace; the panel's nice-weather meter at 0 makes the cause visible.

## Implementation notes

Decisions refined during `/opsx:apply` (behaviour unchanged unless stated):

- **D3.** The zero comes from a named `WeatherNiceness.NotNice` constant via a private
  `Weather.CalculateNiceWeather()`, not a bare literal.
- **D4.** `StartGodzillaCommandHandler.EnrichActivity` tags the regime and the resulting
  nice-weather value (what Godzilla affects) instead of the wind that StartStrongWind tags.
  No HTTP endpoint test was added: the Weather test project has no HTTP test
  infrastructure; the route is covered by module registration plus a manual check against
  the running API (`POST /weather/godzilla` → 202, regime 3, `niceWeather` 0).
- **D6.** The dashboard exposes a `godzillaPresent` computed signal and binds
  `[godzillaPresent]="godzillaPresent()"` rather than an inline template expression.
- **D7.** If the regime ends while the model is still loading, the actor goes straight to
  `absent` when the load lands (nothing was visible yet). Reversing mid-walk continues from
  the current spot via a pure `reversedElapsed(phase, t)` helper; the heading flips rather
  than turning smoothly. The Punch "roar" plays every 6 s, fading Idle out and back in.
- **D5.** The weather-panel shake moves the whole `.scene` box 1–2 px, as the scene has no
  separate backdrop element.
