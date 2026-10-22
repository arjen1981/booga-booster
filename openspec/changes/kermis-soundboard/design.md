# Design

## Context

See `proposal.md` for motivation and `specs/` for the behavioural contract.

- The dashboard (`src/app/ride-dashboard/ride-dashboard.{ts,html,scss}`) is a three-column
  grid. The central `<section class="center">` holds only `<bb-ride-visualization>` and
  uses `place-items: center`, so it has no room for a second row today.
- Static files are served from `public/` (`angular.json` assets glob), e.g.
  `/3dmodels/boogabooster.fbx`. There is no audio in the app yet.
- Panels are standalone, OnPush, inline-template components in a feature folder, use the
  `--bb-*` design tokens, and are tested with Vitest + jsdom plus an `*.a11y.spec.ts`
  running `axe.run` (colour-contrast disabled under jsdom). Browser APIs that jsdom lacks
  are put behind an `InjectionToken` with a fake in `testing/` (see `QUEUE_SOURCE`,
  `RIDE_TELEMETRY_SOURCE`).
- PrimeNG 22 and `@primeuix/themes` are installed but **not configured** — no
  `providePrimeNG` in `app.config.ts`. CLAUDE.md mandates PrimeNG for new UI.
- The UI is English; the sound names are Dutch on purpose.
- `ffmpeg` is not installed on the developer machine; Docker (Rancher Desktop) is.

### Chosen recordings

All four are field recordings on Freesound under **CC BY 4.0**, three from klankbeeld's
*fairground Holland* pack (recorded at the 's-Hertogenbosch kermis):

| Name | Source | Length | Excerpt plan |
| --- | --- | --- | --- |
| Draaiorgel | [RTB45 — *Mechanical Street Organ - The Hague*](https://freesound.org/people/RTB45/sounds/203424/) | 2:18 | ~12 s of a melodic phrase |
| Booster | [klankbeeld — *FunFair NL 002 160827_00*](https://freesound.org/people/klankbeeld/sounds/352980/) | 1:55 | ~12 s around the loudest screaming peak |
| Kamelenrace | [klankbeeld — *fairground camel race ambience NL 140829_19*](https://freesound.org/people/klankbeeld/sounds/263142/) | 1:09 | ~12 s with the announcer and bells |
| Kermis | [klankbeeld — *FunFair NL 001 160827_00*](https://freesound.org/people/klankbeeld/sounds/353221/) | 0:12 | whole clip |

Alternatives seen and rejected: hanstimm's *draaiorgel* clips (CC BY-NC — non-commercial
clause), bilwiss's *Kirmes Orgel* (German fair, not Dutch), reinsamba's Vlissingen street
organ (9 minutes, harbour-hall reverb).

## Goals / Non-Goals

**Goals:**
- A single thin row under the visualization; the 3D view keeps nearly all the height.
- Deterministic, unit-testable playback logic with no real audio in tests.
- First PrimeNG usage done properly (provider + theme), but scoped so existing
  hand-rolled panels look unchanged.

**Non-Goals:**
- Volume control, looping, mixing several sounds, or a mute-all.
- Linking sounds to ride telemetry (e.g. auto-play Booster screams when the mill spins
  up) — a possible follow-up, not this change.
- Any backend involvement; sounds are static assets.
- Restyling existing panels in PrimeNG.

## Decisions

### D1. Frontend-only static assets in `public/sounds/`
Clips live in `public/sounds/*.mp3` and are played via plain URLs (`/sounds/draaiorgel.mp3`).
*Alternative:* serving them from the API — rejected; there is no domain behaviour, and it
would couple a cosmetic feature to the backend.

### D2. Trim + transcode to small mono MP3
Each excerpt is cut to ≤ 15 s (target ~12 s), loudness-normalised (EBU R128 `loudnorm`,
I = −16 LUFS) so the buttons are equally loud, given 0.3 s fade-in/out, downmixed to mono
and encoded as MP3 at 96 kbit/s, 44.1 kHz — about 140 KB per clip, ~0.6 MB total (spec
budget: 1 MB). Sources are Freesound's HQ previews (MP3 ~128 kbit/s; the originals need a
login) — ample quality for a 96 kbit/s mono target.
*Why MP3:* universally supported by `HTMLAudioElement` (including Safari), unlike Ogg.
*Tooling:* ffmpeg run once via Docker (e.g. `docker run --rm -v "$PWD:/w" -w /w
jrottenberg/ffmpeg …`) or a locally installed ffmpeg; only the resulting MP3s are
committed. The exact offsets and command go in `public/sounds/CREDITS.md`, so the
assets can be reproduced. Excerpt start points are chosen with ffmpeg's
`ebur128`/`astats` loudness scan (the loudest ~12 s window for Booster/Kamelenrace),
not by ear.

### D3. Sound catalogue as typed data
A `SOUNDS` constant (`soundboard/sounds.ts`) lists `{ id, label, src, credit: { title,
author, url, licence } }` for the four clips. The component and the credits popover both
render from it, so the UI attribution and `CREDITS.md` come from one checked list.

### D4. `AUDIO_PLAYER` token over `HTMLAudioElement`
An `AudioPlayer` interface (`play(src): Promise<void>`, `stop()`, `ended` callback/observable)
is provided under an `AUDIO_PLAYER` `InjectionToken`. The default implementation owns **one**
reused `HTMLAudioElement`: `play` sets `src`, resets `currentTime = 0` and calls
`audio.play()`; `stop` pauses it. A single element makes "one sound at a time" structural
rather than something to coordinate. Tests provide a `FakeAudioPlayer` from
`soundboard/testing/` that records calls and can fire `ended` or reject `play`.
*Alternative:* Web Audio API with decoded buffers — lower latency, but more code and
decoding all four clips up front, for no visible benefit here.

### D5. Signal state in the component
`playing = signal<SoundId | null>(null)`. Pressing a button: if it is the playing id →
`stop()` and set `null`; otherwise → `play(src)` and set the id. `ended` and a rejected
`play()` promise both reset to `null` (the rejection is caught — autoplay/decoding
failures must not surface as unhandled errors). The audio is stopped in `DestroyRef`
`onDestroy`.

### D6. PrimeNG `ToggleButton` for sounds, `Popover` for credits
Each sound is a `p-togglebutton` bound to `playing() === id` — it renders a native button
with `aria-pressed`, which is exactly the spec's toggle semantics, and its checked style
plus an on/off icon or "■/▶" glyph gives a non-colour cue. Credits sit behind a small text
`p-button` ("Credits") opening a `p-popover` (dialog role, focus-trapped, Escape closes)
containing a list of links. Visible labels carry `lang="nl"`; no `aria-label` overrides
the visible text (WCAG 2.5.3 label-in-name).
*Alternative:* hand-rolled `<button aria-pressed>` — simpler, but contradicts the PrimeNG
mandate; `<details>` for credits — rejected because it would push the strip taller when
open, whereas the popover overlays.

### D7. Configure PrimeNG once, with low-impact theming
Add `providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: … ,
cssLayer: true } } })` to `app.config.ts`. `cssLayer` puts PrimeNG's CSS in a cascade layer
so the app's existing styles win and current panels are unaffected. Map the primary
colour to the dashboard's `--bb-accent` via a `definePreset` so the toggles match the
dashboard. Consult the `primeng` MCP server for the exact v22 API before writing it.

### D8. Layout: central column becomes a two-row grid
`.center` changes from `place-items: center` to `grid-template-rows: minmax(0, 1fr) auto`.
Row 1 is the visualization (fills remaining height), row 2 the soundboard strip
(`<section aria-labelledby>` with a visually hidden "Kermis soundboard" heading, buttons
in a `flex-wrap` row, ~3 rem tall). On narrow viewports the buttons wrap; nothing scrolls
horizontally.

## Risks / Trade-offs

- [Freesound preview URLs or files change] → assets are committed to the repo, not
  hot-linked; `CREDITS.md` keeps the source links for re-derivation.
- [CC BY attribution missed] → attribution in both UI and `CREDITS.md`, generated from
  the same catalogue; a unit test asserts every sound has a complete credit.
- [Booster recording is long and builds slowly; a bad excerpt is dull] → pick the window
  by loudness scan, and the user can listen to the four clips in the PR before merging.
- [PrimeNG theme leaking into hand-rolled panels] → `cssLayer: true`; the existing
  dashboard a11y spec and a visual check of the running app guard it.
- [jsdom has no media playback] → all playback goes through `AUDIO_PLAYER`; tests never
  touch `HTMLAudioElement`. The default player gets one small spec stubbing
  `HTMLMediaElement.prototype.play/pause`.
- [~0.6 MB of binaries in git] → within the spec budget; acceptable for a demo repo.
