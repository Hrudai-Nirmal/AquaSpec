# ADR-009: Saved Configurations — Named Full Snapshots with Version-Aware Change Detection

**Date:** 2026-07-01
**Status:** Accepted
**Supersedes:** ADR-003 (incorporates its decisions into concrete implementation)

## Context

ADR-003 defined saved configurations as full snapshots (inputs + results + rules version) with version-aware change detection and no auto-recompute. Draft persistence (ADR-008) is now complete, handling transient auto-saved form state. Saved Configurations are the permanent-record counterpart: user-named, explicitly saved, reopenable months later with full historical fidelity.

## Decision

### Storage

- **Backend:** IndexedDB, separate database `aquaspec-configs`, object store `configs`, keyed by UUID `id`.
- **Rationale:** Separate from `aquaspec-drafts` (transient, single-record). Different lifecycle. Future admin portal will need server-side persistence — IndexedDB is browser-only, so no coupling benefit to sharing a database.
- **Pattern:** Raw IndexedDB API, promise-wrapped, SSR-safe. Mirrors `persistence.ts` conventions.

### Snapshot Shape

Per the existing `SavedConfiguration` Zod schema in `types.ts`:
```typescript
{
  id: string;                    // UUID
  name: string;                  // User-provided
  savedAt: string;               // ISO timestamp
  input: HatcheryInput;          // All system inputs (validated, parsed values)
  recommendation: HatcheryRecommendation; // Full engine output
  rulesVersionAtSave: string;    // From sizing-rules.json at time of save
  includeBudgetaryEstimate: boolean;
}
```

### Load Behavior

- **Loads into the wizard** — populates form fields, active step, mode, AND shows saved results in the panel. Not a separate read-only view.
- The loaded config becomes the active working state. User can edit inputs, recompute, re-save.

### Unsaved Work Handling

When the user opens a saved config while the wizard has in-progress work (form dirty vs last loaded config, OR no config loaded yet but form has data):

- **Prompt dialog:** "Save current work before loading [Config Name]?"
- **Three options:**
  1. **Save & Load** — saves current work as a new config, then loads the selected config
  2. **Discard & Load** — discards current work, loads selected config
  3. **Cancel** — closes dialog, nothing changes

"Dirty" detection: compare current `systems[]`, `hatcheryName`, `mode` against the last-saved-snapshot's `input`. If they differ, prompt. If the wizard is still pristine (or matches a loaded config exactly), skip the prompt.

### Save Flow

- **First save:** Dialog asks for name. UUID generated. Allowed names are duplicates (UUIDs uniquely identify).
- **Re-save:** Overwrites existing record (same UUID). No prompt. Updates `savedAt`, `recommendation`, `rulesVersionAtSave` to current.
- **What gets saved:** Full `HatcheryInput` (parsed values via `buildHatcheryInput()`) + current `HatcheryRecommendation` + current rules version from `sizing-rules.json`.

### Recompute Triggers

Two banners in the ResultsPanel, both with a "Recompute" button:

1. **Version Mismatch Banner:** Appears on load when `rulesVersionAtSave !== currentRulesVersion`. Text: "Equipment rules have been updated since this configuration was saved. Results may be outdated."
2. **Stale Edits Banner:** Appears when user edits any form field after loading a config. The results no longer match the inputs. Text: "Results are based on old inputs. Recompute to refresh."

Clicking "Recompute" on either banner:
- Runs the engine with current inputs against current rules
- Replaces `recommendation` in the store (results panel updates immediately)
- Auto-saves the updated snapshot to IndexedDB (same UUID, updated `savedAt`, `recommendation`, `rulesVersionAtSave`)

### Sidebar UI

- **Trigger:** Button in the wizard header (alongside "New"), toggles a collapsible sidebar panel.
- **Position:** Right side of the screen (desktop), overlay on mobile.
- **Contents:**
  - Header: "Saved Configurations" with close button
  - "Save Current" button at top → triggers save dialog
  - Config list: scrollable, each row shows:
    - Config name
    - Save date (formatted)
    - Mode badge (Aggregate / Multi-System)
    - Rules version
    - Delete button (trash icon, with confirmation)
  - Clicking a config row → attempts load (may trigger Unsaved Work dialog)
  - Clicking a config row when it's already loaded → no-op
- **Empty state:** "No saved configurations yet. Save your current work to get started."

### Stale Detection in Store

Track `activeConfigId: string | null` in the Zustand store:
- `null` = working from scratch (new, unsaved)
- UUID string = a saved config is currently loaded

When form fields change AND `activeConfigId !== null` → compare current form state against saved snapshot. If different → show Stale Edits banner.

### Rules Version Access

Import `sizing-rules.json` directly on the client (small file, already imported server-side) to read `currentRulesVersion`. The stored `rulesVersionAtSave` is compared on load.

## Consequences

### Positive
- Full historical fidelity — reopening a 6-month-old config shows exactly what was presented
- No auto-recompute surprises. User explicitly opts in via banner.
- Sidebar always accessible; saved configs are first-class citizens in the wizard, not a separate page
- Auto-save on recompute means version-mismatch resolution is a single click

### Negative
- Banners add visual noise to the results panel (but are contextual and actionable)
- Stale detection requires comparing form state against saved snapshot — adds complexity to the store
- No server-side persistence yet; configs are browser-only (same limitation as drafts)

## Alternatives Considered

- **Separate route for config library:** Rejected — adds navigation friction. Sales engineers want configs available while working.
- **Versioning configs on re-save (keep history):** Added complexity without clear demand. Overwrite is simpler.
- **Auto-recompute on version mismatch:** Rejected per ADR-003 — surprises the user with different results than what was presented.
