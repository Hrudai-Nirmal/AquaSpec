# ADR-006: UI Architecture — 5-Step Wizard with Server-Side Engine

**Date:** 2026-06-30
**Status:** Accepted

## Context
The AquaSpec frontend must guide sales personnel through a 5-step data entry wizard that feeds the sizing engine and displays live results. Key decisions needed around navigation, results display, responsiveness, validation, state management, and engine invocation strategy.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Bottom progress bar + Prev/Next** for navigation | Maximizes form space; dots are clickable for free-form jumping |
| 2 | **Full-width collapsible results panel** (Pattern B) | Shows all Phase A–D metrics at once; engineering-forward feel |
| 3 | **Server-side engine via API route** | Proprietary Lotus Ozone rules file never exposed to client |
| 4 | **Real-time Zod validation** (200ms debounced on keystroke) | Instant feedback; guard prevents red-while-typing |
| 5 | **Tab-per-system** in Steps 2–4 for multi-system mode | Natural mental model — configure one system fully before moving on |
| 6 | **System CRUD on Step 1 only** | Clean separation: Step 1 = structure, Steps 2–4 = configuration |
| 7 | **Zustand** for state management | Handles multi-system complexity with minimal boilerplate (~1KB) |
| 8 | **PDF preview modal** with Download button on Step 5 | Salesperson sees branded document before it leaves their hands |
| 9 | **Fully responsive** — mobile (<768px) stacked, tablet (768–1024px) compact, desktop (>1024px) side-by-side | Required by user |

## Consequences
- **Positive:** Clean separation between form state (Zustand), validation (Zod), and computation (API route → engine). Results panel always visible. Free-form navigation without forced linear flow.
- **Negative:** Zustand adds one dependency. Tablet breakpoint adds layout complexity. Server-side engine means 50-200ms latency per recompute (acceptable with 300ms debounce).
- **Risk:** The tab-per-system pattern in Steps 2–4 means all N systems share the same 3-step form structure — a system with radically different parameters might feel constrained, but this matches the existing `SystemInput` schema.
