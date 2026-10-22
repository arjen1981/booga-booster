# Spec Delta

## ADDED Requirements

### Requirement: Summon Godzilla over HTTP

The weather module SHALL expose a minimal-API endpoint that lets a client trigger a Godzilla event. The endpoint SHALL take no request body and SHALL map the request to a `StartGodzilla` command dispatched to its handler. The resulting regime SHALL be visible through `GET /weather` and the published weather-update event as `Godzilla`.

#### Scenario: Summon Godzilla

- **WHEN** a client sends `POST /weather/godzilla`
- **THEN** the response is `202 Accepted` and a Godzilla event becomes active

#### Scenario: Godzilla visible in the weather read

- **WHEN** a Godzilla event is active and a client sends `GET /weather`
- **THEN** the response reports the active regime as `Godzilla` and a nice-weather indicator of 0
