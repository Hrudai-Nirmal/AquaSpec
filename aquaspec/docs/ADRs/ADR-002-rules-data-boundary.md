# ADR-002: Rules File as Pure Data with Fixed Computation Path

**Date:** 2026-06-30
**Status:** Accepted

## Context
The equipment rules file (`sizing-rules.json`) must provide model specs, conditional safety factors, and oxygen feed requirements. The boundary between "data" and "logic" determines engine architecture, testability, and the file's editability by non-developers.

## Decision
1. The rules file is **pure declarative data** (JSON) with zero executable code.
2. The computation pipeline has an **immutable 4-phase path** (Flow → Ozone → UV → Oxygen).
3. The rules file can only alter **coefficients** within phases — it cannot branch the computation path, select different formulas, or introduce conditional logic.

## Consequences
- **Positive:** The rules file can be edited by engineers/sales without touching TypeScript code. Versioning is simple — diff the JSON. The engine remains purely deterministic and fully testable with mocked rule data.
- **Negative:** If a future equipment model requires a genuinely different sizing *method* (not just different coefficients), the engine code must be modified — the rules file cannot accommodate it. This is an intentional constraint.
- **Risk:** The "only coefficients" constraint means we must be disciplined about keeping all computational logic in TypeScript, not sneaking pseudo-logic into the JSON via nested conditional structures that mimic branching.
