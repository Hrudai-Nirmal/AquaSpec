# ADR-004: Dual-Mode Hatchery Configuration (Aggregate / Multi-System)

**Date:** 2026-06-30
**Status:** Accepted

## Context
Shrimp hatcheries often have multiple independent water treatment systems (larval rearing, broodstock, algae culture) with different parameters. The app must handle both simple single-system facilities and complex multi-system ones without forcing complexity on simple use cases.

## Decision
1. Each hatchery config operates in one of two **user-selectable modes**: Aggregate or Multi-System.
2. **Aggregate Mode (default):** One global parameter set → one recommended package.
3. **Multi-System Mode:** N named "Systems", each with independent parameters → N recommended packages.
4. Mode switching is **manual only** — no auto-splitting of aggregate data into systems, no auto-summing of systems into aggregate.
5. The PDF covers all systems with an aggregate summary plus per-system sections.

## Consequences
- **Positive:** Simple hatcheries get a simple UX (aggregate mode). Complex hatcheries get full multi-system support without a separate tool. The PDF is self-contained and readable by non-technical stakeholders.
- **Negative:** The UI must handle mode switching gracefully, which adds complexity to form state management. Users switching from aggregate → multi-system face a blank slate (no auto-population), which may cause friction.
- **Open Question:** Should the PDF in multi-system mode auto-derive the aggregate summary (sum of flows, combined equipment), or should the user manually define the aggregate? Decision deferred to UI design phase.
