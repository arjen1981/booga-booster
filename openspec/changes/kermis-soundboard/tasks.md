# Tasks

All paths are relative to `src/FourDotnet.BoogaBooster.App` unless stated otherwise.
Use the `angular-architect` agent and consult the `primeng` MCP server before writing any
PrimeNG markup or configuration.

## 1. Audio assets

- [x] 1.1 Download the Freesound HQ previews of #203424, #352980, #263142 and #353221 to a scratch directory (not the repo) and verify each file plays and matches the title/author on its Freesound page
- [x] 1.2 Run an ffmpeg loudness scan (`ebur128`/`astats`, via Docker or a local ffmpeg) over Draaiorgel, Booster and Kamelenrace and record the chosen ~12 s excerpt start for each (loudest window; a melodic phrase for the organ); Kermis is used whole — verify the offsets are written down
- [x] 1.3 Cut, normalise (loudnorm I=−16), fade 0.3 s in/out, downmix to mono and encode 96 kbit/s 44.1 kHz MP3 into `public/sounds/{draaiorgel,booster,kamelenrace,kermis}.mp3`; verify with `ffprobe` that each is ≤ 15 s and the four total ≤ 1 MB
- [x] 1.4 Write `public/sounds/CREDITS.md` listing for each clip: source title, author, Freesound URL, licence (CC BY 4.0), excerpt start/length and the ffmpeg command used; verify all four entries are complete

## 2. PrimeNG setup

- [x] 2.1 Add `providePrimeNG` with the Aura preset, `cssLayer: true` and a `definePreset` mapping the primary colour to the dashboard accent in `src/app/app.config.ts`; verify `npm run build` succeeds and the existing dashboard specs (incl. `ride-dashboard.a11y.spec.ts`) still pass

## 3. Soundboard logic

- [x] 3.1 Create `src/app/soundboard/sounds.ts` with the typed four-entry catalogue (id, Dutch label, src, credit) and a spec asserting the order `Draaiorgel, Booster, Kamelenrace, Kermis`, unique ids, and a complete credit (title, author, https URL, licence) for every entry
- [x] 3.2 Create the `AudioPlayer` interface, `AUDIO_PLAYER` token and the default single-`HTMLAudioElement` implementation; verify with a spec that stubs `HTMLMediaElement.prototype.play/pause` that `play` resets `currentTime` and sets `src`, `stop` pauses, and `ended` is forwarded
- [ ] 3.3 Create `src/app/soundboard/testing/fake-audio-player.ts` that records `play`/`stop` calls and can emit `ended` or reject `play`; verify it is used by the component specs in 4.x

## 4. Soundboard component

- [ ] 4.1 Build `bb-soundboard` (standalone, OnPush, signal `playing`, PrimeNG `p-togglebutton` per sound with `lang="nl"` labels and a non-colour playing cue, labelled `<section>` with a visually hidden heading); verify with a spec that four buttons render in the specified order
- [ ] 4.2 Implement playback toggling (start, switch, stop-on-repress, reset on `ended`, reset on rejected `play`, stop on destroy); verify with specs covering each `kermis-soundboard` spec scenario, asserting `aria-pressed` and the fake player's calls
- [ ] 4.3 Add the "Credits" `p-button` + `p-popover` rendering title, author, link and licence from the catalogue; verify with a spec that opening it shows all four credits
- [ ] 4.4 Add `soundboard.a11y.spec.ts` running AXE idle, with a sound playing, and with credits open; verify zero violations

## 5. Dashboard integration

- [ ] 5.1 Place `<bb-soundboard />` under `<bb-ride-visualization>` in `ride-dashboard.html` and change `.center` to a `minmax(0,1fr) auto` row grid in `ride-dashboard.scss`; verify the dashboard spec asserts the soundboard renders inside the central section after the visualization
- [ ] 5.2 Provide the default `AUDIO_PLAYER` in `app.config.ts` and the fake in dashboard specs that render the soundboard; verify `ride-dashboard.a11y.spec.ts` passes with no violations

## 6. Verification

- [ ] 6.1 Run `npm test` and `npm run build` from the app folder; verify all specs pass and the build has no new warnings
- [ ] 6.2 Run the app (`npm start` or the Aspire AppHost) and check in a browser at ≥ 1024 px and at ~375 px: soundboard is one thin row under the 3D view, buttons wrap on narrow widths without horizontal scroll, each sound plays, switching/stopping works, credits popover opens and closes with Escape, existing panels look unchanged
- [ ] 6.3 Run `openspec validate kermis-soundboard --strict` and verify it passes
