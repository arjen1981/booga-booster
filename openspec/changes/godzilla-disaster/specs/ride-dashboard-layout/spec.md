# Spec Delta

## ADDED Requirements

### Requirement: Godzilla appears in the ride visualization

While the weather regime is `Godzilla`, the central ride visualization SHALL show a giant
Godzilla figure beside the ride — clearly taller than the ride, standing outside the
ride's swept area so it never overlaps the rotating rig. Godzilla SHALL enter by walking in
from the edge of the scene, stay animated beside the ride while the regime lasts, and walk
off and disappear once the regime is no longer `Godzilla`. The ride's own animation SHALL
continue unchanged throughout.

#### Scenario: Godzilla arrives

- **WHEN** the weather regime changes to `Godzilla`
- **THEN** a Godzilla figure walks into the visualization and comes to a stop beside the ride, outside the rig's swept radius

#### Scenario: Godzilla leaves

- **WHEN** the weather regime changes from `Godzilla` to any other regime
- **THEN** the figure walks out of the scene and is then removed from it

#### Scenario: No Godzilla in other regimes

- **WHEN** the weather regime is `Calm`, `Precipitation` or `StrongWind`, or the weather is unavailable
- **THEN** no Godzilla figure is shown

#### Scenario: Reduced motion

- **WHEN** the user prefers reduced motion
- **THEN** Godzilla appears beside the ride and disappears without walking or other animation

#### Scenario: Model cannot be loaded

- **WHEN** the Godzilla model fails to load
- **THEN** the visualization keeps rendering the ride without a Godzilla figure and without an unhandled error

#### Scenario: Model is loaded only when needed

- **WHEN** the dashboard loads and Godzilla has not been summoned
- **THEN** the Godzilla model has not been downloaded

### Requirement: Godzilla model licence

The Godzilla model SHALL be shipped under a licence that permits redistribution and
modification (CC0 or CC BY), and its source, author and licence SHALL be recorded in a
credits file next to the model.

#### Scenario: Credits file

- **WHEN** the shipped 3D model assets are inspected
- **THEN** a credits file next to the Godzilla model names its source, author and licence
