# Spec Delta

## Purpose

Gives the operator dashboard a compact soundboard that plays four short, real Dutch
fairground (*kermis*) recordings on demand, with accessible controls and the licence
attribution the recordings require.

## ADDED Requirements

### Requirement: Four kermis sounds

The soundboard SHALL offer exactly four sounds, each a real field recording of a Dutch
fairground, presented as one button per sound with a short visible Dutch name:

| Name | Content |
| --- | --- |
| Draaiorgel | a Dutch street organ playing |
| Booster | riders screaming in a *Booster* attraction |
| Kamelenrace | the kermis camel-race game |
| Kermis | general fairground ambience |

#### Scenario: Soundboard rendered

- **WHEN** the dashboard is displayed
- **THEN** the soundboard shows four buttons labelled `Draaiorgel`, `Booster`,
  `Kamelenrace` and `Kermis`, in that order

#### Scenario: Dutch labels identified as Dutch

- **WHEN** assistive technology reads a sound's visible name
- **THEN** the name is marked as Dutch-language text so it is pronounced correctly in the
  otherwise English UI

### Requirement: One sound plays at a time

Pressing a sound's button SHALL start that sound from its beginning. At most one sound
SHALL play at any moment: starting a sound SHALL stop any other sound that is playing.

#### Scenario: Start a sound

- **WHEN** no sound is playing and the operator presses `Draaiorgel`
- **THEN** the street-organ clip starts playing from its beginning

#### Scenario: Switch sounds

- **WHEN** `Draaiorgel` is playing and the operator presses `Booster`
- **THEN** the street-organ clip stops and the Booster clip starts from its beginning

### Requirement: Toggle a playing sound off

Pressing the button of the sound that is currently playing SHALL stop it.

#### Scenario: Stop the playing sound

- **WHEN** `Kermis` is playing and the operator presses `Kermis`
- **THEN** playback stops and no sound is playing

### Requirement: Playing state is exposed

Each button SHALL expose whether its sound is playing — as a pressed/not-pressed toggle
state to assistive technology, and visually by more than colour alone. When a clip
reaches its end, its button SHALL return to the not-playing state.

#### Scenario: Playing button reports pressed

- **WHEN** `Kamelenrace` is playing
- **THEN** the `Kamelenrace` button reports a pressed state and the other three report not
  pressed

#### Scenario: Clip ends

- **WHEN** the playing clip reaches its natural end
- **THEN** its button reports not pressed and no sound is considered playing

#### Scenario: Playback cannot start

- **WHEN** the browser refuses or fails to play a clip
- **THEN** the button reports not pressed and the dashboard keeps working without an
  unhandled error

### Requirement: Compact footprint

The soundboard SHALL occupy a single compact row beneath the ride visualization and SHALL
NOT take more vertical space than needed for one row of buttons and its credits control.
The four audio clips together SHALL total no more than 1 MB, and each clip SHALL last no
longer than 15 seconds.

#### Scenario: Asset budget

- **WHEN** the four shipped audio files are measured
- **THEN** their combined size is at most 1 MB and no clip is longer than 15 seconds

#### Scenario: Narrow viewport

- **WHEN** the dashboard is shown on a viewport narrower than 1024px
- **THEN** the soundboard's buttons wrap or shrink to fit without horizontal overflow

### Requirement: Licence attribution

Every recording SHALL be licensed under Creative Commons Attribution 4.0 (or a more
permissive licence), and the soundboard SHALL make the attribution for each sound —
title, author, source link and licence — reachable from the dashboard. The same
attribution SHALL be kept in a credits file shipped alongside the audio files.

#### Scenario: Viewing credits

- **WHEN** the operator activates the soundboard's credits control
- **THEN** the title, author, source link and licence of each of the four recordings are
  shown

#### Scenario: Credits file

- **WHEN** the shipped audio assets are inspected
- **THEN** a credits file next to them lists, for each clip, the source recording, author,
  licence and the excerpt that was taken

### Requirement: Accessible soundboard

The soundboard SHALL be keyboard operable, be a labelled region of the dashboard, and
pass AXE checks with no violations.

#### Scenario: Keyboard operation

- **WHEN** the operator tabs to a sound button and presses Enter or Space
- **THEN** the sound toggles exactly as it does on a pointer press

#### Scenario: Automated accessibility audit

- **WHEN** an AXE audit is run against the rendered soundboard, both idle and with a sound
  playing, and with the credits shown
- **THEN** no violations are reported
