# Spec Delta

## MODIFIED Requirements

### Requirement: Three-column dashboard layout

The dashboard SHALL present a left control rail, a central column, and a right telemetry
rail. The central column SHALL hold the ride visualization with the kermis soundboard
directly beneath it. The central column SHALL be the visually dominant region, with the
two rails flanking it, and within it the ride visualization SHALL take all vertical space
not needed by the soundboard.

#### Scenario: Wide viewport

- **WHEN** the dashboard is shown on a viewport at least 1024px wide
- **THEN** the left rail, central column, and right rail are laid out side by side, with the central column occupying the largest share of the width

#### Scenario: Narrow viewport

- **WHEN** the dashboard is shown on a viewport narrower than 1024px
- **THEN** the columns reflow into a single vertically stacked column (visualization with the soundboard beneath it, then controls, then telemetry) without horizontal overflow

#### Scenario: Soundboard beneath the visualization

- **WHEN** the dashboard is displayed at any viewport width
- **THEN** the soundboard appears directly below the ride visualization in the central column, and the visualization remains taller than the soundboard
