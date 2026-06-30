# ADR-005: Oxygen Sizing as Ozone-Coupled with Biological Flexibility

**Date:** 2026-06-30
**Status:** Accepted

## Context
Oxygen sizing for Lotus Ozone's LTX/LTX-M packages must account for both the ozone generator's feed requirements AND the hatchery's biological oxygen demand. The two are fundamentally different — one is machine-coupled, the other is biology-driven.

## Decision
**Formula:** `Total O₂ Demand = Ozone Generator Feed Requirement + Biomass DO Demand`

- **Ozone Generator Feed Requirement:** Minimum O₂ feed (LPM or m³/hr) required to safely operate the ozone generator sized in Phase B. Pulled from the rules file as a per-generator-model property.
- **Biomass DO Demand:** Direct dissolved oxygen for hatchery livestock. User-entered OR defaults from rules file (per species/system type).
- **Model Match:** Combined total matched against LTX / LTX-M catalog.

## Consequences
- **Positive:** The coupling with ozone sizing ensures the oxygen package is always sized to support the ozone generator (no undersized oxygen feed). The separate biomass DO term allows hatchery-specific biological needs.
- **Negative:** If the ozone generator is changed (e.g., user tweaks parameters that shift the model match in Phase B), the oxygen demand automatically changes too. This could be confusing if the user doesn't understand the coupling.
- **Design Note:** The UI should visually indicate that the Ozone Generator Feed Requirement is derived (not independently editable), while Biomass DO Demand is user-controllable.
