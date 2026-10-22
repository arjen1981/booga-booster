# Tasks

Backend work uses the `csharp-expert` agent and MUST consult the
`4dotnet-csharp-style-guide` MCP server first; frontend work uses the `angular-architect`
agent. Backend paths are under `src/`, frontend paths under
`src/FourDotnet.BoogaBooster.App/`.

## 1. Weather domain

- [ ] 1.1 Append `Godzilla = 3` to `WeatherRegime` and add `GodzillaDuration` (3 min) plus the `ProfileFor(Godzilla) => Calm` case to `WeatherDefaults`; verify the solution builds and existing Weather tests still pass
- [ ] 1.2 Add `Weather.StartGodzilla()` (sets regime and duration, replaces an active event); verify with domain tests that the regime becomes `Godzilla`, the countdown starts, it replaces strong wind, it is still active just before 3 min and returns to `Calm` after 3 min, and readings drift toward the calm defaults
- [ ] 1.3 Make `ToConditionDto()` report `NiceWeather = 0` while the regime is `Godzilla`; verify with tests that it is exactly 0 with calm readings and recomputes to 1 after Godzilla leaves at calm defaults

## 2. Weather application, feature and endpoint

- [ ] 2.1 Add `StartGodzilla()` to `IWeatherStore` / `WeatherStore` (returns `Changed: true` and the snapshot, under the lock); verify with a store test
- [ ] 2.2 Add `Features/StartGodzilla/` (`StartGodzillaCommand`, `StartGodzillaCommandHandler` implementing `ExecuteAsync`, `EnrichActivity` tagging the regime) and `WeatherTelemetryAttributes.GodzillaDisturbance = "godzilla"`; verify with handler tests that it starts Godzilla, publishes a snapshot with regime `Godzilla` and `NiceWeather` 0, and records the disturbance counter with kind `godzilla`
- [ ] 2.3 Register the handler in `AddWeatherModule()` and map `POST /weather/godzilla` → `202` in `WeatherEndpoints`; verify with the module-registration test that the handler resolves, and with an endpoint test (or `WebApplicationFactory`-style test if the module tests support it) that the route returns `202` and `GET /weather` then reports `Godzilla`
- [ ] 2.4 Run `dotnet test` for the Weather and Queue test projects and check Weather line coverage stays ≥ 80 % (the `test-coverage` skill); verify both pass

## 3. Model asset

- [x] 3.1 Download the CC0 *Dino* GLB from Poly Pizza (`https://static.poly.pizza/1c1ae302-b948-4de4-961a-44f762b722cf.glb`) to `public/3dmodels/godzilla.glb` unmodified and add `public/3dmodels/CREDITS.md` (title, author Quaternius, source URL `https://poly.pizza/m/wuerCFCWNR`, CC0); verify the file is ~404 KB and lists the `Walk`, `Idle` and `Punch` animations

## 4. Frontend weather plumbing

- [x] 4.1 Add `'Godzilla'` to the `WeatherRegime` type and `REGIME_BY_INDEX`, `regimeLabel` → "Godzilla", and `sceneFor` → `kind: 'godzilla'`; verify with `weather.models.spec.ts` (index 3 and the string both map to `Godzilla`, label, scene kind)
- [x] 4.2 Add `startGodzilla()` to `WeatherSource`, `HttpWeatherSource` (`POST /api/weather/godzilla` then refresh) and `FakeWeatherSource` (`godzillaCalls`); verify with `http-weather-source.spec.ts`
- [ ] 4.3 Add the `godzillaPending` signal and `startGodzilla()` to `WeatherStateService` using the existing `run(...)` helper; verify with `weather-state.service.spec.ts` (pending while in flight, error message on failure)
- [ ] 4.4 Add the third "Summon Godzilla" button to `weather-disturbance-controls` and switch the grid to `repeat(auto-fit, minmax(6.5rem, 1fr))`; verify with `weather-disturbance-controls.spec.ts` (calls the source, pending/disabled/aria-busy, failure message) and `weather-panel.a11y.spec.ts`
- [ ] 4.5 Add the `godzilla` scene to `weather-conditions-view` (decorative silhouette + backdrop shake, off under reduced motion); verify with `weather-conditions-view.spec.ts` that `data-kind="godzilla"` renders the silhouette inside the `aria-hidden` scene

## 5. Godzilla in the digital twin

- [ ] 5.1 Implement the pure `godzillaPose(phase, t)` and the `GodzillaActor` state machine in `visualization/godzilla-actor.ts` with an injectable loader; verify with `godzilla-actor.spec.ts`: standing point is 16 m from the axis (> 9 m swept radius), enter/leave paths start/end at 45 m, phase transitions (summon → enter → present → leave → absent, leave-while-entering turns round, resummon-while-leaving returns), reduced motion skips walking, a rejected load leaves it absent without throwing, and nothing is loaded until first wanted
- [ ] 5.2 Wire the actor into `ride-visualization.ts`: `godzillaPresent = input(false)`, lazy `GLTFLoader` dynamic import + `/3dmodels/godzilla.glb`, bounding-box scaling to 18 m, runtime recolour, `AnimationMixer` Walk/Idle/Punch, update from the existing loop, disposal on destroy; verify `ride-visualization.spec.ts` still passes and a new test shows the input is accepted without WebGL
- [ ] 5.3 Bind `[godzillaPresent]` in `ride-dashboard.html` from `WeatherStateService` in `ride-dashboard.ts`; verify with `ride-dashboard.spec.ts` that the visualization receives `true` when the fake weather source reports regime `Godzilla` and `false` otherwise, and `ride-dashboard.a11y.spec.ts` still passes

## 6. Verification

- [ ] 6.1 Run `dotnet build` + `dotnet test` on `BoogaBooster.slnx` and `npm test` + `npm run build` in the app; verify all green, no new build warnings, and the GLTFLoader ends up in a lazy chunk (initial bundle not grown by it)
- [ ] 6.2 Run the system (Aspire AppHost, or API + `npm start`) and in a browser: summon Godzilla and confirm it walks in from the fog, stands roaring beside the ride without overlapping it, the weather panel shows the Godzilla scene/label and niceness 0, queue arrivals stop, and after ~3 min it walks off; confirm the other two disturbances still work
- [ ] 6.3 Run `openspec validate godzilla-disaster --strict`; verify it passes
