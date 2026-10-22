# Spec Delta

## ADDED Requirements

### Requirement: User can summon Godzilla

A user SHALL be able to trigger a Godzilla event. Triggering SHALL set the active regime to
`Godzilla` and begin the event immediately, replacing any precipitation or strong-wind event
that was active, exactly as starting one weather event replaces another.

#### Scenario: Godzilla is summoned

- **WHEN** a user triggers a Godzilla event
- **THEN** the active regime becomes `Godzilla` and the event's duration begins counting down

#### Scenario: Godzilla replaces an active weather event

- **WHEN** strong wind is active and a user triggers a Godzilla event
- **THEN** the active regime becomes `Godzilla` and the Godzilla duration starts from its beginning

### Requirement: Godzilla leaves the weather readings alone

While a Godzilla event is active, temperature, wind, sunshine and precipitation SHALL keep
drifting toward the calm defaults, as they would in the `Calm` regime. Godzilla is not
weather; its effect is on the visitors (see the nice-weather indicator in
`weather-simulation`).

#### Scenario: Readings trend toward calm during Godzilla

- **WHEN** a Godzilla event has been active for several ticks after a strong-wind event
- **THEN** wind, sunshine and temperature move toward their calm defaults rather than toward the strong-wind targets

### Requirement: Godzilla leaves after about three minutes

A Godzilla event SHALL last approximately 3 minutes of simulation time. When that duration
elapses, the event SHALL stop and the active regime SHALL return to `Calm`.

#### Scenario: Godzilla leaves after its duration

- **WHEN** approximately 3 minutes of simulation time have elapsed since Godzilla was summoned
- **THEN** the Godzilla event stops and the active regime returns to `Calm`

#### Scenario: Godzilla is still present before its duration ends

- **WHEN** less than 3 minutes of simulation time have elapsed since Godzilla was summoned
- **THEN** the active regime is still `Godzilla`
