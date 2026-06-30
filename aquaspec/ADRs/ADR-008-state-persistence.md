# ADR-008: Client-Side Draft Persistence via IndexedDB

**Date:** 2026-07-01
**Status:** Accepted

## Context

AquaSpec's wizard form collects up to 11 fields across 5 steps plus a hatchery name. Sales engineers may start a configuration, get interrupted, and return later. Without persistence, closing the tab loses all in-progress work. We need auto-save of in-progress form state so the user always returns to where they left off.

## Decision

We implement **draft-only auto-save via IndexedDB** with the following semantics:

1. **Persistence scope:** Form data only — `systems[]`, `hatcheryName`, `mode`, `activeStep`, `activeSystemIndex`. NOT persisted: `fieldErrors`, `isValid`, `recommendation`, `isComputing`, `computeError`, `proposalOpen`, `biomassDefaults`.

2. **Restore behavior:** Silent restore on app load. If a draft exists in IndexedDB, it hydrates the store immediately. No prompt, no banner. The user sees their exact form state from the previous session.

3. **Write timing:** Debounced writes (500ms delay) triggered on every form field change (`updateField`, `setMode`, `setHatcheryName`, `addSystem`, `removeSystem`, `renameSystem`, `setActiveStep`, `setActiveSystemIndex`). Separate from the compute debounce (300ms).

4. **Re-compute on restore:** After hydrating from IndexedDB, the store triggers validation and a debounced compute. Results are always fresh against current rules.

5. **Discard mechanism:** A "New Configuration" button (already in the wizard UI, presumably) clears IndexedDB and resets the store to defaults. This is the only way to start fresh.

6. **Storage backend:** IndexedDB via a thin wrapper module (`src/lib/persistence.ts`). No external library — raw IndexedDB API with a Promise-based wrapper. Single database: `aquaspec-drafts`, single object store: `drafts`, single key: `"current"`.

7. **SSR safety:** IndexedDB access is gated behind `typeof window !== "undefined"` checks. The persistence module only runs in the browser. On the server, `loadDraft()` returns `null` and `saveDraft()` is a no-op.

8. **Schema versioning:** The persisted draft carries a `schemaVersion: 1` field. On load, if the stored version doesn't match, the draft is silently discarded (prevents migration bugs when the form shape changes).

## Consequences

### Positive
- Zero latency on restore (no server round-trip)
- No auth required (works anywhere the app loads)
- Survives tab close, browser restart, OS reboot
- Independent of the compute pipeline — results are always fresh

### Negative
- Tied to one browser/device (not synced across devices)
- IndexedDB is cleared if the user clears browser data
- Adds a small async dependency to store initialization (hydration race)

## Alternatives Considered

- **localStorage:** Simpler API but synchronous (blocks main thread). Same cross-device limitation. Rejected in favor of IndexedDB's async API.
- **Server-side persist:** Cross-device, survives cache clears. Requires auth, adds latency, offline users lose drafts. Out of scope for v1.
- **Persist results too:** Would skip re-compute on restore but risks showing stale results if rules file changed. Rejected per product decision.
- **"Resume?" banner:** Adds friction. Silent restore chosen for speed.