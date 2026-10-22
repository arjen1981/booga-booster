# Spec Delta

## MODIFIED Requirements

### Requirement: Precipitation and strong-wind buttons

The weather panel SHALL provide three buttons that let the operator disturb the simulation: one that starts precipitation, one that summons strong wind, and one that summons Godzilla. Each SHALL invoke the corresponding server operation.

#### Scenario: Operator starts precipitation

- **WHEN** the operator activates the precipitation button
- **THEN** the app starts precipitation on the server (default type `Rain`)
- **AND** the displayed conditions refresh to show the precipitation

#### Scenario: Operator summons strong wind

- **WHEN** the operator activates the strong-wind button
- **THEN** the app starts a strong-wind event on the server
- **AND** the displayed conditions refresh to show the strong wind

#### Scenario: Operator summons Godzilla

- **WHEN** the operator activates the Godzilla button
- **THEN** the app starts a Godzilla event on the server
- **AND** the displayed conditions refresh to show the Godzilla regime

#### Scenario: Buttons fit the left rail

- **WHEN** the weather panel is shown in the left control column at its narrowest width
- **THEN** all three buttons are fully visible and readable without horizontal overflow

### Requirement: Accessible controls

The buttons SHALL be real, keyboard-operable controls with clear accessible names and visible focus, meeting WCAG AA / AXE.

#### Scenario: Buttons are keyboard operable with clear names

- **WHEN** the operator navigates with the keyboard
- **THEN** each button is focusable with a visible focus indicator and an accessible name that states its effect (e.g. "Start precipitation", "Summon strong wind", "Summon Godzilla")
