# ADR-001: Single Design-Point Engine with Live Recompute

**Date:** 2026-06-30
**Status:** Accepted

## Context
AquaSpec's sizing engine must convert hatchery parameters into equipment recommendations. The core architectural question was whether the engine generates a *profile* of scenarios or a *single* design point.

## Decision
The engine produces exactly **one design point per system** — a single-pass pipeline: Flow Rate → Ozone Demand → UV Sizing → Oxygen Demand → Model Match. The user explores alternatives by modifying inputs directly and seeing results update live, not by selecting from pre-computed scenarios.

## Consequences
- **Positive:** Engine complexity is linear and predictable. No multi-branch scenario engine needed. UI can be simpler (no scenario selector). Testing is straightforward — one input set = one output set.
- **Negative:** The burden of scenario exploration shifts entirely to the user. If the salesperson wants to compare "peak biomass" vs "average stocking", they must manually re-enter and compare. No side-by-side comparison built into the engine.
- **Mitigation:** The saved config snapshot system means users can save Scenario A, tweak to Scenario B, and reopen A to compare — but this is manual. If comparison becomes a high-demand feature, a separate comparison UI layer could be built on top without changing the engine.
