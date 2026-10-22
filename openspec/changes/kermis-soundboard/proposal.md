## Why

BoogaBooster is a digital twin of a Dutch *kermis* ride, but the operator dashboard is
silent. A small soundboard with four recognisable Dutch fairground sounds gives the
demo atmosphere and personality — and is a compact, self-contained frontend feature
that shows the spec-driven workflow end to end, including the first real use of the
mandated PrimeNG component library.

## What Changes

- Add a compact **kermis soundboard** directly below the 3D ride visualization in the
  dashboard's central column: one row of four buttons, taking a thin strip of height so
  the visualization stays the dominant region.
- Ship four short, real field-recorded Dutch fairground clips, all licensed
  **Creative Commons Attribution 4.0** on Freesound:
  - **Draaiorgel** — Dutch street organ, Den Haag (RTB45, Freesound #203424)
  - **Booster** — riders screaming in a *Booster* attraction, 's-Hertogenbosch
    (klankbeeld, Freesound #352980) — the namesake of this ride
  - **Kamelenrace** — the kermis camel-race game, 's-Hertogenbosch
    (klankbeeld, Freesound #263142)
  - **Kermis** — fairground ambience, 's-Hertogenbosch (klankbeeld, Freesound #353221)
- Trim each recording to a short excerpt and transcode it to a small mono MP3 so the
  four assets together stay well under 1 MB in the repo and the browser.
- Play one sound at a time: pressing a button starts its clip (stopping any other);
  pressing the playing button again stops it. Each button exposes its playing state to
  assistive technology.
- Credit the authors as CC BY 4.0 requires: a credits disclosure in the soundboard UI and
  a `CREDITS.md` next to the audio files.
- Configure PrimeNG (`providePrimeNG` with a theme) in the app, since this is the first
  component to use it.

## Capabilities

### New Capabilities
- `kermis-soundboard`: the dashboard soundboard — its four sounds, playback behaviour
  (one at a time, toggle to stop, reset on clip end), accessible playing state, asset
  size budget, and the licence attribution it must display.

### Modified Capabilities
- `ride-dashboard-layout`: the central column now holds the ride visualization **and** the
  soundboard beneath it; the visualization must remain the dominant region and the
  soundboard must not cause overflow on narrow viewports.

## Impact

- **Frontend only** (`src/FourDotnet.BoogaBooster.App`): new `soundboard/` feature folder
  (component, audio-player abstraction, sound catalogue, specs incl. an AXE spec),
  `ride-dashboard.html/.scss` (central column becomes a two-row layout),
  `app.config.ts` (PrimeNG provider), and `public/sounds/` (four MP3s + `CREDITS.md`).
- **No backend, API, messaging or physics changes.** No new runtime npm dependencies —
  PrimeNG and `@primeuix/themes` are already installed.
- Repo size grows by under 1 MB of audio.
- Audio plays only after an explicit user gesture, so browser autoplay policies are not
  an issue.
