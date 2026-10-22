# Spec Delta

## MODIFIED Requirements

### Requirement: Weather updates carry a nice-weather indicator

Every weather update (the snapshot served to consumers and the published `WeatherUpdateIntegrationEvent`) SHALL include a "nice weather" indicator: a value in the range [0, 1] where 1 means pleasant, moderate weather and 0 means bad weather such as a severe storm or heavy precipitation. While the active regime is `Godzilla`, the indicator SHALL be 0 regardless of the readings, so that no visitor joins the queue while Godzilla is present.

#### Scenario: Moderate weather scores as nice

- **WHEN** the weather is at its moderate defaults with no precipitation and light wind
- **THEN** the nice-weather indicator is 1

#### Scenario: A storm or heavy precipitation scores as not nice

- **WHEN** the weather is a severe storm (very strong wind) or has heavy precipitation
- **THEN** the nice-weather indicator is 0 (or near 0)

#### Scenario: Godzilla scores as not nice

- **WHEN** the active regime is `Godzilla`, even with moderate readings
- **THEN** the nice-weather indicator is exactly 0, both in the snapshot and in the published `WeatherUpdateIntegrationEvent`

#### Scenario: Niceness recovers when Godzilla leaves

- **WHEN** the Godzilla event ends and the readings are at their moderate defaults
- **THEN** the nice-weather indicator is again computed from the readings and is 1
