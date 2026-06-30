# Spec: AquaSpec Sizing Engine (Pure TypeScript Module)

## Goal
Build the framework-independent, pure TypeScript sizing engine that implements the 4-phase computation pipeline for Lotus Ozone water treatment system sizing. The engine must be fully covered by unit tests and produce identical results for identical inputs (deterministic).

## Context

### Files Already in Place (do not modify)
- `src/lib/sizing-engine/types.ts` — All TypeScript types, interfaces, and Zod schemas (the complete contract)
- `src/data/sizing-rules.json` — The rules data file with model catalog, dose rates, condition adjustments, and biomass DO defaults

### Computation Pipeline (from context.md)
The engine processes each system in a hatchery through four IMMUTABLE phases:

**Phase A: Flow Rate** — `flowRateM3Hr = (totalVolumeM3 × turnoversPerDay) / operatingHoursPerDay`

**Phase B: Ozone Demand**
1. Look up base `doseRateGM3` from `sizing-rules.json` matched by `waterSource` + `qualityBand`
2. Find all `conditionAdjustments` whose `conditions` match the system input. Apply them cumulatively:
   - For each matching adjustment, multiply the running multiplier by its `ozoneMultiplier`
   - Start with a base multiplier of 1.0
3. `ozoneDemandGHr = flowRateM3Hr × doseRateGM3 × finalOzoneMultiplier`
4. Match ozone demand to the **smallest** LT-G model where `ozoneDemandGHr > model.minCapacityGHr AND ozoneDemandGHr <= model.maxCapacityGHr`
5. Record that model's `oxygenFeedLPM` for Phase D

**Phase C: UV Sizing**
1. Starting point: `requiredFlowM3Hr = flowRateM3Hr`
2. Apply `conditionAdjustments` matching the system input: multiply by `uvMultiplier` for each match (cumulative, starting at 1.0)
3. Find smallest LTU-T model where `model.ratedFlowM3Hr >= requiredFlowM3Hr`
4. If no single model can handle the flow (flow exceeds the largest model), compute parallel units:
   - Use the largest available model
   - `parallelUnits = Math.ceil(requiredFlowM3Hr / largestModel.ratedFlowM3Hr)`

**Phase D: Oxygen Demand**
1. `ozoneFeedRequirementM3Hr = ozoneGenerator.oxygenFeedLPM × 0.06` (LPM → m³/hr conversion)
2. `biomassDODemandM3Hr`:
   - If user provided `biomassDODemandM3Hr` → use that value
   - Otherwise → look up default from `sizing-rules.json` matched by `species` + `systemType`
3. `totalOxygenDemandM3Hr = ozoneFeedRequirementM3Hr + biomassDODemandM3Hr`
4. Match to smallest LTX / LTX-M model where total demand fits within `[minCapacityM3Hr, maxCapacityM3Hr]` range

### Engine Function Signature
The engine must export a single main function:
```typescript
function sizeHatchery(input: HatcheryInput, rules: SizingRulesFile): HatcheryRecommendation
```
- `HatcheryInput`, `HatcheryRecommendation`, and `SizingRulesFile` are imported from `../lib/sizing-engine/types`
- Must throw a typed error on invalid rules file lookups (missing dose rate, no matching model, etc.)
- Must handle both `aggregate` mode (1 system) and `multi_system` mode (N systems)

### Aggregate Summary (Multi-System Mode Only)
When `mode === "multi_system"`, the engine must also compute:
- `totalFlowRateM3Hr` — sum of all system flow rates
- `totalOzoneDemandGHr` — sum of all system ozone demands
- `totalOxygenDemandM3Hr` — sum of all system oxygen demands
- `allOzoneGenerators` — list of all ozone generator model strings
- `allUVUnits` — array of `{ model, quantity }` grouping (e.g., if 2 systems use LTU-T-100, shown as `{ model: "LTU-T-100", quantity: 2 }`)
- `allOxygenPackages` — list of all oxygen package model strings

### Testing
Tests must be written using the project's built-in test runner (Vitest, Jest, or whatever `npm test` resolves to). Use TDD: write a failing test first, then implement.

**Mandatory test cases:**
1. Aggregregate mode: seawater + good quality → correct flow rate, ozone dose, ozone model, UV model, oxygen model
2. Aggregate mode: freshwater + poor quality → higher dose rate applied
3. Condition adjustment applies: salinity 30 + Vibrio → ozone multiplier 1.3 applied
4. Condition adjustment does not apply: salinity 10 + Vibrio → no 1.3 multiplier (salinity below 25)
5. Multiple condition adjustments stack: estuary + Vibrio at salinity 30 → both estuary-Vibrio (1.4) applies
6. UV parallel sizing: flow rate 450 m³/hr → 2 × LTU-T-300 (300 × 2 = 600 ≥ 450)
7. Runtime validation: missing dose rate for a waterSource/qualityBand combo → throws EngineError
8. Runtime validation: ozone demand exceeds all LT-G models → throws EngineError
9. Multi-system mode: 2 systems → 2 recommendations + aggregate summary with correct totals
10. Biomass DO: user-provided value overrides rules default
11. Biomass DO: no user value → falls back to rules default by species + systemType

## Acceptance Criteria
1. All 11 test cases above pass (green).
2. `npm test` or equivalent runs all engine tests and passes.
3. The engine function `sizeHatchery()` is importable without any React/Next.js dependency.
4. The engine produces `HatcheryRecommendation` objects that conform exactly to the types in `types.ts`.
5. `ozoneFeedLPM` is correctly converted from LPM to m³/hr (× 0.06) in Phase D.
6. Model matching always selects the smallest model that can handle the demand (not just any model that fits).
7. Condition adjustments are applied cumulatively — if two conditions match, both multipliers apply.
8. The aggregate summary in multi-system mode correctly groups UV units (e.g., two systems both using LTU-T-100 → quantity: 2).

## Constraints
- **Do NOT modify `types.ts` or `sizing-rules.json`.** If you find a genuine gap, escalate via the task's block mechanism.
- **Zero React/Next.js imports in the engine module.** The engine is pure TypeScript.
- The engine must be in `src/lib/sizing-engine/engine.ts`.
- Tests must be in `src/lib/sizing-engine/__tests__/engine.test.ts`.
- Use the project's existing test infrastructure — check `package.json` for the test script and framework. If no test framework is installed, install `vitest` and configure it.
- Throw `EngineError` (a custom Error subclass you define in the engine module) for all lookup/matching failures.

## Non-Goals
- No UI/React components
- No PDF generation
- No pricing/BOM lookup
- No persistence/saving logic
- No HTTP endpoints or API routes
- No Playwright/Chromium integration

## Known Unknowns
- The test framework (Vitest, Jest) is not yet installed. Check `package.json` and install/configure if needed — this is within scope for you.
- Unit conversions: The O₂ feed from the rules file is in LPM but Phase D works in m³/hr. Conversion: `LPM × 0.06 = m³/hr`.
- "SalesPerson role" — when condition adjustments stack, the "estuary+Vibrio" rule has ozoneMultiplier 1.4 which is intentionally higher than stacking estuary (1.15) + Vibrio (1.3) separately. When BOTH the generic AND specific condition exist, apply all that match — the specific rule is NOT exclusive. This means a single system with estuary + Vibrio could get both the estuary adjustment (1.15) AND the specific combo rule (1.4), resulting in 1.61×. This is intentional — the user confirmed the rules file is pure data and the engine applies all matching conditions.
