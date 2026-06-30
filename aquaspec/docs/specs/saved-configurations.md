# Implementation Spec: Saved Configurations (Named Full Snapshots)

**ADR:** ADR-009  
**Feature:** `feat: saved-configurations`  
**Type:** Client-side engine + store integration + UI  
**Profile:** Coder (local Ollama)

---

## Goal

Allow users to explicitly save named, permanent snapshots of their hatchery configuration (inputs + results + rules version), reopen them later with full historical fidelity, and detect when rules have changed since the save. Provide a collapsible sidebar for managing saved configs.

---

## Context

AquaSpec currently has:
- **Draft persistence** (ADR-008): auto-saves form fields to IndexedDB. Transient, single-record, no results.
- **Live compute**: results appear in the side panel on every valid input change.
- **"New" button**: clears the draft and resets the wizard.

Users need to save permanent, named configurations they can return to weeks/months later and trust that the results shown are exactly what was originally computed — even if the equipment rules file has changed.

The `SavedConfiguration` Zod schema already exists in `src/lib/sizing-engine/types.ts`. This spec implements the full CRUD + UI surface around it.

### Files you should read before starting
- `src/lib/sizing-engine/types.ts` — `SavedConfiguration` schema, `HatcheryInput`, `HatcheryRecommendation`, all Zod types
- `src/lib/sizing-engine/engine.ts` — Engine signature: `sizeHatchery(input, rules)` returns `HatcheryRecommendation`
- `src/lib/store.ts` — Zustand store (current state shape, actions, validation, draft persistence integration)
- `src/lib/persistence.ts` — IndexedDB draft wrapper (model for config persistence module)
- `src/app/api/size/route.ts` — API handler loads rules file
- `src/data/sizing-rules.json` — Rules file with `version` field
- `src/components/wizard/WizardContainer.tsx` — Main wizard layout (header, form, results)
- `src/components/results/ResultsPanel.tsx` — Results panel (states: incomplete, computing, error, ready)
- `src/components/ui/dialog.tsx` — Dialog component (used for save/unsaved-work dialogs)
- `src/components/ui/button.tsx` — Button variants
- `src/components/ui/badge.tsx` — Badge component
- `docs/context.md` — Domain model (Saved Configuration vs Draft)
- `ADRs/ADR-009-saved-configurations.md` — Architecture decision record for this feature

### Files you WILL modify
- `src/lib/config-persistence.ts` — **NEW** IndexedDB CRUD for saved configs
- `src/lib/__tests__/config-persistence.test.ts` — **NEW** tests
- `src/lib/store.ts` — Add activeConfigId, loadConfig, saveConfig, deleteConfig, stale detection, configs list loading
- `src/components/configs/SavedConfigsSidebar.tsx` — **NEW** collapsible sidebar
- `src/components/configs/SaveConfigDialog.tsx` — **NEW** save name dialog
- `src/components/configs/UnsavedWorkDialog.tsx` — **NEW** unsaved work prompt
- `src/components/results/ResultsPanel.tsx` — Version mismatch + stale edits banners
- `src/components/wizard/WizardContainer.tsx` — Sidebar toggle button + mount sidebar

### Files you MUST NOT modify
- `src/lib/sizing-engine/*` — Engine is locked
- `src/lib/persistence.ts` — Draft persistence, unrelated
- `src/lib/proposal-html.ts` — PDF pipeline
- `src/data/sizing-rules.json` — Rules data
- `src/data/pricing.json` — Pricing data
- `src/components/ui/*` — UI primitives
- `src/app/api/*` — API routes
- `src/components/wizard/Step*.tsx` — Step components
- `src/components/wizard/StepIndicator.tsx` — Bottom nav
- `src/components/results/FlowRateCard.tsx`, etc. — Result card components
- `src/components/proposal/*` — Proposal/PDF components
- `vitest.config.ts`, `vitest.setup.ts` — Test config (should remain unchanged)

---

## Domain Model

### Saved Configuration Entity

A saved configuration is a permanent, named record containing:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique identifier |
| `name` | `string` | User-provided name |
| `savedAt` | `string` (ISO) | When this was saved |
| `input` | `HatcheryInput` | All system inputs (parsed, validated) |
| `recommendation` | `HatcheryRecommendation` | Full engine output |
| `rulesVersionAtSave` | `string` | Rules file version at time of save |
| `includeBudgetaryEstimate` | `boolean` | Budget toggle state |

The `SavedConfiguration` Zod schema in `types.ts:280-296` is the canonical shape. However, because Zod v4 `z.record(z.string(), z.any())` for `recommendation` loses type safety, you should use the `HatcheryRecommendation` TypeScript interface directly in your module's types while validating the outer schema with Zod.

---

## Computation Rules

### Persistence Layer (`config-persistence.ts`)

Model after `persistence.ts` conventions: raw IndexedDB, promise-wrapped, SSR-safe.

**Database:** `aquaspec-configs`  
**Object store:** `configs` (keyPath: `"id"`)  
**Version:** 1  

```typescript
// Types used by the config persistence module
interface ConfigRecord {
  id: string;                      // UUID
  name: string;
  savedAt: string;                 // ISO 8601 timestamp
  input: HatcheryInput;            // Full parsed input (via buildHatcheryInput)
  recommendation: HatcheryRecommendation; // Full engine output
  rulesVersionAtSave: string;
  includeBudgetaryEstimate: boolean;
}
```

**CRUD functions:**

```typescript
function saveConfig(config: ConfigRecord): Promise<void>;
function loadConfig(id: string): Promise<ConfigRecord | null>;
function listConfigs(): Promise<ConfigRecord[]>;  // Returns all, sorted by savedAt descending (newest first)
function deleteConfig(id: string): Promise<void>;
```

All functions are SSR-safe: no-op on server (`typeof window === "undefined"` check). `loadConfig` returns `null` on server. `listConfigs` returns `[]` on server.

**Open/close pattern:** Each function opens the database, performs the operation, and closes the database. Do NOT cache the database connection. Rationale: avoids "database is blocked" errors when another tab opens the app.

**listConfigs details:** Open a read-only transaction on `configs`, call `store.getAll()`, sort by `savedAt` descending, close DB, return.

Store includes the current `includeBudgetaryEstimate` state per ADR-009.

### Current Rules Version Access

Import the rules JSON on the client to read the current version:

```typescript
import rulesData from "@/data/sizing-rules.json";
const CURRENT_RULES_VERSION = rulesData.version; // "1.0.0"
```

This is used for version comparison on load and for populating `rulesVersionAtSave` on save.

### Store Changes (`store.ts`)

Add these new fields to the `FormState` interface:

```typescript
// Saved configs
activeConfigId: string | null;        // null = working from scratch, UUID = a saved config is loaded
configs: ConfigRecord[];              // List of saved configs (for sidebar)
configsLoaded: boolean;               // Whether configs list has been fetched from IndexedDB
```

Add these new actions:

```typescript
loadConfig: (id: string) => Promise<void>;
saveConfig: (name: string) => Promise<void>;
deleteConfig: (id: string) => Promise<void>;
loadConfigsList: () => Promise<void>;  // Fetch list from IndexedDB
```

#### loadConfig(id)

1. If `activeConfigId !== null` and form is dirty relative to the loaded config → show the UnsavedWorkDialog. Resolve before proceeding.
2. Fetch config from IndexedDB via `loadConfig(id)`.
3. Populate form fields from `config.input` (reverse of `buildHatcheryInput`).
   - Set `hatcheryName`, `mode`, `systems[]` (all fields as strings, matching the `SystemData` interface).
   - Set `activeStep` to 1 (always start at step 1 on load — avoids confusion about which step the user was on when they saved).
   - Set `activeSystemIndex` to 0.
4. Set `recommendation` to `config.recommendation`.
5. Set `activeConfigId` to `config.id`.
6. Set `includeBudgetaryEstimate` to `config.includeBudgetaryEstimate`.
7. Set `fieldErrors = {}`, `isValid = true` (the loaded input is already validated).
8. Check version: if `config.rulesVersionAtSave !== CURRENT_RULES_VERSION`, set `showVersionMismatchBanner = true`.
9. Mark the loaded config's snapshot (for stale detection).

**Loading a config that's already loaded (`activeConfigId === id`):** No-op.

**Stale detection snapshots:** On load, capture a "pristine snapshot" of the form state. This is used to detect when the user edits a form field after loading, triggering the stale edits banner. Store as a side-car variable (not in the Zustand store — it's transient UI logic):

```typescript
let pristineInput: HatcheryInput | null = null;
// Set on load, compared on each field change
```

When any field changes AND `activeConfigId !== null` AND `pristineInput !== null`: compare current `buildHatcheryInput(...)` vs `pristineInput`. If different → set `showStaleEditsBanner = true`.

```typescript
showVersionMismatchBanner: boolean;  // Banner: rules version changed
showStaleEditsBanner: boolean;       // Banner: form edits after load
```

#### saveConfig(name)

1. Build `HatcheryInput` from current form state via `buildHatcheryInput(...)`.
2. Build `ConfigRecord`:
   - `id`: If `activeConfigId !== null` → use it (overwrite). If null → generate UUID (`crypto.randomUUID()`).
   - `name`: from parameter
   - `savedAt`: `new Date().toISOString()`
   - `input`: from step 1
   - `recommendation`: current `recommendation` from store (must not be null; if null, reject with error)
   - `rulesVersionAtSave`: `CURRENT_RULES_VERSION`
   - `includeBudgetaryEstimate`: current `includeBudgetaryEstimate` from store
3. Save to IndexedDB via `saveConfig(config)`.
4. Update store: set `activeConfigId` to `config.id`, hide both banners, update pristine snapshot.
5. Refresh configs list.

#### deleteConfig(id)

1. Call `deleteConfig(id)` on IndexedDB.
2. If `activeConfigId === id`, reset the store to defaults (same as `clearDraft` does: empty state, step 1, no recommendation, `activeConfigId = null`).
3. Refresh configs list.

#### loadConfigsList()

1. Fetch all configs via `listConfigs()`.
2. Set `configs` in the store.
3. Set `configsLoaded = true`.

Call `loadConfigsList()` once on app initialization (after draft hydration).

#### Store Initialization (Hydration)

Current flow: `(async () => { loadDraft; hydrate; validateAndSchedule; })()`.

Add after hydration completes:
```typescript
await useStore.getState().loadConfigsList();
```

#### Recompute Banner Logic

When user clicks "Recompute" on either banner:
1. Call `triggerCompute()` — this hits the API, gets fresh results.
2. When results return, update `recommendation` in store.
3. Hide both banners (`showVersionMismatchBanner = false`, `showStaleEditsBanner = false`).
4. Update `rulesVersionAtSave` for the loaded config (auto-save to IndexedDB):
   - If `activeConfigId !== null`, fetch the config record, update its `recommendation`, `rulesVersionAtSave`, `savedAt`, and save back.
5. Update pristine snapshot.

### Wizard Container Changes

Add to the header (alongside the "New" button):
- A **"Saved" toggle button** (variant="ghost", size="sm") with a `BookmarkIcon` or `FolderOpenIcon` from lucide-react. Label: "Saved".
- This button toggles the sidebar open/closed.

Mount `<SavedConfigsSidebar />` inside `WizardContainer`.

The sidebar is positioned as a fixed/absolute overlay on the right side of the screen (not pushing layout). On mobile (< `lg` breakpoint), it covers the full screen width as an overlay.

### SavedConfigsSidebar Component

**State:** Controlled by a local `isOpen` state in WizardContainer (or via store — up to you; local state is fine since it's only used in WizardContainer).

**Layout:**
```
┌─────────────────────────────────┐
│ Saved Configurations    [X]     │  ← Header with close button
├─────────────────────────────────┤
│ [Save Current]                  │  ← Save button (full width, variant="default")
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Coastal Hatchery            │ │  ← Config row (clickable)
│ │ Jul 01, 2026  Aggregate v1.0│ │  ← Date, mode badge, rules version
│ │                        [🗑] │ │  ← Delete button
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Broodstock Setup            │ │
│ │ Jun 28, 2026  Multi  v1.0   │ │
│ │                        [🗑] │ │
│ └─────────────────────────────┘ │
│                                 │
│ (empty if no configs)           │
│ "No saved configurations yet."  │
└─────────────────────────────────┘
```

**Props:** none (reads from store).

**Behavior:**
- Renders a fixed-position panel on the right: `fixed right-0 top-0 bottom-0 w-[360px] bg-background border-l shadow-lg z-50`.
- On mobile (< lg): `w-full`.
- Animated slide-in from right (use Tailwind `transform translate-x-full` controlled by `isOpen` prop — or CSS transition on a wrapper).
- **Empty state:** Centered text: "No saved configurations yet. Save your current work to get started."
- **Config rows:** Clicking a row calls `loadConfig(config.id)`.
  - If the clicked config IS the currently loaded config → no-op.
  - If `activeConfigId !== null` and form is dirty → open UnsavedWorkDialog first.
- **Delete:** Clicking trash icon shows a confirmation (could be a simple `window.confirm` or a small popover). On confirm, calls `deleteConfig(config.id)`.
- **Save Current button:** Opens `SaveConfigDialog`.
  - If `activeConfigId !== null` (already editing a saved config), save overwrites silently (no dialog, no prompt — just calls `saveConfig` with the existing name).
  - If `activeConfigId === null` (new config), opens `SaveConfigDialog`.
- **Loaded config highlight:** The row for the currently loaded config (`activeConfigId`) should have a subtle visual indicator (e.g., left border in primary color, or bg-muted).

**Date formatting:** Use `new Date(savedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })`.

**Mode badge:** Use `<Badge variant="secondary">` with text "Aggregate" or "Multi-System".

### SaveConfigDialog Component

A modal dialog (using `Dialog` from `@/components/ui/dialog`) that appears when the user clicks "Save Current" and has no active config loaded.

**Layout:**
```
┌──────────────────────────────────┐
│ Save Configuration               │  ← DialogHeader
│ Give your configuration a name.  │  ← DialogDescription
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Coastal Hatchery Setup       │ │  ← Input (auto-focused)
│ └──────────────────────────────┘ │
│                                  │
│               [Cancel]  [Save]   │  ← DialogFooter
└──────────────────────────────────┘
```

**Props:**
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}
```

**Behavior:**
- Auto-focus the input on open.
- Enter key submits.
- Save button disabled if name is empty (trimmed).
- On save → calls `onSave(name.trim())` → closes dialog.
- Default name suggestion: if `hatcheryName` is filled in, pre-populate the input with it. Otherwise empty.

### UnsavedWorkDialog Component

A modal dialog shown when the user tries to load a saved config while the wizard has unsaved changes.

**Detection of "unsaved changes":**
- If `activeConfigId !== null` (a saved config is loaded) AND the current form state differs from the pristine snapshot → show dialog.
- If `activeConfigId === null` AND the form has any data (non-default: hatcheryName non-empty OR any system has any field filled) → show dialog.
- If the wizard is completely pristine (empty hatcheryName, all fields empty, exactly one empty system named "System 1") → skip dialog, load directly.

**Layout:**
```
┌────────────────────────────────────────┐
│ Unsaved Changes                         │
│                                        │
│ You have unsaved changes. Would you     │
│ like to save your current work first?   │
│                                        │
│ [Discard & Load]  [Cancel]  [Save & Load] │
└────────────────────────────────────────┘
```

**Props:**
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAndLoad: () => void;      // Save current, then load
  onDiscardAndLoad: () => void;   // Discard current, then load
  targetConfigName: string;       // Name of the config being loaded (for context)
}
```

**Behavior:**
- **Save & Load:** Calls `saveConfig` with a generated name (could use `hatcheryName` prefilled), waits for it to complete, then calls `loadConfig(targetId)`. If no recommendation yet (can't save without results), show a brief error toast or inline message: "Complete the form to generate results before saving."
- **Discard & Load:** Resets store to defaults, then calls `loadConfig(targetId)`.
- **Cancel:** Closes dialog, nothing happens.

### ResultsPanel Banner Changes

Add two banner components that render at the top of the results panel (above the per-system cards), ONLY when results are showing (state "Ready").

**Ordering (top to bottom):**
1. Version mismatch banner (if applicable)
2. Stale edits banner (if applicable)
3. Per-system result cards (existing)

Both banners use a `div` with `bg-amber-50 border border-amber-200 rounded-lg p-3` styling (or similar warning colors using Tailwind's `bg-warning/10 border-warning/20` if that exists).

**Version Mismatch Banner:**
```
⚠️ Equipment rules have been updated since this configuration was saved. Results may be outdated.
[Recompute]
```
- Reads `showVersionMismatchBanner` from store.
- "Recompute" is a small Button (`variant="outline" size="sm"`).
- Clicking Recompute: calls `triggerCompute()`, then auto-saves (see store changes above).

**Stale Edits Banner:**
```
⚠️ Results are based on old inputs. Recompute to refresh.
[Recompute]
```
- Reads `showStaleEditsBanner` from store.
- Same Recompute button behavior.

Both banners are hidden when not applicable (store flag is false).

### Build and Test Integration

Tests require `fake-indexeddb` (already installed for draft persistence tests). The `vitest.setup.ts` already imports `fake-indexeddb/auto`. No changes needed to test config.

Use `crypto.randomUUID()` for UUID generation (available in modern browsers and jsdom).

---

## Acceptance Criteria

### AC-1: Save a new configuration
**Given** the wizard has completed form data and valid results are showing  
**When** the user opens the sidebar, clicks "Save Current," enters a name "Coastal Hatchery" in the dialog, and clicks Save  
**Then** the configuration is persisted to IndexedDB in the `aquaspec-configs` database  
**And** `activeConfigId` is set to the new UUID  
**And** the config appears in the sidebar list with name "Coastal Hatchery", current date, mode badge, and rules version  

### AC-2: Save requires results to exist
**Given** the wizard has form data but NO results (form incomplete)  
**When** the user clicks "Save Current"  
**Then** either the save is prevented with an inline message, OR the save silently fails  
**And** no config is written to IndexedDB  

### AC-3: Overwrite an existing loaded config
**Given** a saved config "Coastal Hatchery" is loaded (`activeConfigId` set)  
**When** the user modifies a field (e.g., changes totalVolumeM3 from "100" to "200"), waits for recompute, then clicks "Save Current"  
**Then** the dialog is NOT shown (since `activeConfigId !== null`)  
**And** the existing record is overwritten with the new input, new results, and new `savedAt` timestamp  
**And** `activeConfigId` remains unchanged  

### AC-4: Load a saved configuration into the wizard
**Given** a saved config "Coastal Hatchery" exists with 5 systems in multi-system mode, rules version "1.0.0"  
**When** the user clicks the config row in the sidebar  
**Then** the wizard form is populated with the hatchery name, mode, and all 5 systems with their field values  
**And** `activeStep` is set to 1  
**And** the results panel shows the saved results (not a loading spinner)  
**And** `activeConfigId` is set to the config's UUID  

### AC-5: Version mismatch banner appears
**Given** a saved config has `rulesVersionAtSave: "0.9.0"` but `CURRENT_RULES_VERSION` is `"1.0.0"`  
**When** the user loads the config  
**Then** the results panel shows a version mismatch banner at the top  
**And** the banner text mentions that rules have been updated  
**And** a "Recompute" button is present  

### AC-6: Recompute on version mismatch auto-saves
**Given** the version mismatch banner is showing  
**When** the user clicks "Recompute"  
**Then** the compute runs against current rules  
**And** the results panel updates with fresh results  
**And** the banner disappears  
**And** the config is auto-saved to IndexedDB with the new results and `rulesVersionAtSave: "1.0.0"`  

### AC-7: Stale edits banner appears
**Given** a saved config is loaded with valid results showing  
**When** the user edits a form field (e.g., changes totalVolumeM3 from "100" to "200")  
**Then** a stale edits banner appears at the top of the results panel  
**And** the banner text mentions results are based on old inputs  

### AC-8: Stale edits banner disappears on recompute
**Given** the stale edits banner is showing  
**When** the user clicks "Recompute"  
**Then** the compute runs with the updated inputs  
**And** the banner disappears  
**And** the results panel shows fresh results  

### AC-9: Delete a configuration
**Given** a saved config "Old Setup" exists in the sidebar  
**When** the user clicks the trash icon and confirms deletion  
**Then** the config is removed from IndexedDB  
**And** it disappears from the sidebar list  
**And** if it was the currently loaded config, the wizard resets to default empty state  

### AC-10: Sidebar toggle
**Given** the wizard is showing  
**When** the user clicks the "Saved" button in the header  
**Then** the sidebar slides in from the right  
**When** the user clicks "Saved" again or clicks the close (X) button  
**Then** the sidebar slides out  

### AC-11: Unsaved work prompt before loading
**Given** the wizard has form data (hatcheryName = "Unsaved Work", system fields partially filled)  
**And** `activeConfigId` is null (unsaved work)  
**When** the user clicks a saved config "Coastal Hatchery" in the sidebar  
**Then** the UnsavedWorkDialog appears with three options: Save & Load, Discard & Load, Cancel  

### AC-12: Skip prompt when wizard is pristine
**Given** the wizard is in default empty state (empty hatcheryName, one empty system "System 1", no results)  
**When** the user clicks a saved config in the sidebar  
**Then** the config loads directly (no unsaved work dialog)  

### AC-13: No prompt when loading the same config twice
**Given** "Coastal Hatchery" is already loaded and showing  
**When** the user clicks "Coastal Hatchery" in the sidebar again  
**Then** nothing happens (no-op, no dialog, no reload)  

### AC-14: Empty sidebar state
**Given** no saved configurations exist in IndexedDB  
**When** the user opens the sidebar  
**Then** the sidebar shows an empty state message: "No saved configurations yet."

### AC-15: SSR safety
**Given** the config persistence module is imported during SSR  
**When** any function is called  
**Then** no error is thrown  
**And** `loadConfig` returns `null`, `listConfigs` returns `[]`, `saveConfig` and `deleteConfig` are no-ops  

### AC-16: Existing tests still pass
**Given** the store has been modified  
**When** `npm test` is run  
**Then** all 19 existing tests pass (11 engine + 8 persistence)

### AC-17: Build succeeds
**Given** all changes are implemented  
**When** `npm run build` is run  
**Then** the Next.js build completes with zero TypeScript errors  

---

## Constraints

1. **No external libraries.** Raw IndexedDB API only. No `uuid`, `nanoid`, `dexie`, `idb`, or similar. Use `crypto.randomUUID()` for UUID generation.
2. **Store changes must be additive.** The existing store interface must not break. New fields and actions are added; existing actions keep the same signature.
3. **Do not modify the sizing engine, rules file, or PDF pipeline.** Listed in "Files you MUST NOT modify."
4. **TypeScript strict mode.** No `any` types in new code.
5. **Follow existing UI patterns.** Use shadcn/ui (`@base-ui/react`) components. Match existing button styles, card styles, dialog patterns.
6. **Database lifecycle.** Open and close the IndexedDB connection on every operation. Do not cache a persistent handle.
7. **SSR gating.** `typeof window !== "undefined"` check before all IndexedDB access.
8. **Budgetary estimate state.** The current `includeBudgetaryEstimate` toggle state must be persisted in saved configs.

---

## Non-Goals

- **Not** implementing server-side persistence (future admin portal concern).
- **Not** syncing saved configs across devices.
- **Not** versioning configs on overwrite (no history — simple overwrite).
- **Not** exporting/importing configs as files (future feature).
- **Not** adding a "Duplicate" config feature.
- **Not** encrypting config data.
- **Not** changing the existing draft persistence behavior.
- **Not** modifying any step components or the bottom navigation.

---

## Component Tree

```
src/
├── lib/
│   ├── config-persistence.ts       ← NEW: IndexedDB CRUD for saved configs
│   ├── store.ts                    ← MODIFY: add config actions, banners, loading
│   └── __tests__/
│       └── config-persistence.test.ts  ← NEW: tests for config-persistence
├── components/
│   ├── configs/
│   │   ├── SavedConfigsSidebar.tsx     ← NEW: collapsible sidebar panel
│   │   ├── SaveConfigDialog.tsx        ← NEW: save dialog (name input)
│   │   └── UnsavedWorkDialog.tsx       ← NEW: unsaved work prompt dialog
│   ├── results/
│   │   └── ResultsPanel.tsx            ← MODIFY: add banners
│   └── wizard/
│       └── WizardContainer.tsx         ← MODIFY: toggle button + sidebar mount
```

---

## Known Unknowns

- **Zustand v5 `subscribe` behavior:** The draft persistence already uses `useStore.subscribe(...)`. The config list loading and stale detection need to work alongside it. Verify that multiple subscribers work correctly in v5.
- **`crypto.randomUUID()` in jsdom:** Modern jsdom should support this. If not, fallback to a simple UUID v4 generator function (no external library — a ~10-line function using `Math.random()`).
- **IndexedDB `getAll()`:** The `listConfigs` function uses `store.getAll()`. This is standard IndexedDB API. Verify jsdom support.
- **Zustand `setState` vs `set`:** The draft hydration uses `useStore.setState(...)`. Config load should follow the same pattern for consistency.
- **Banner persistence across page reloads:** When a config is loaded and the page reloads, the draft will be restored (it auto-saves). But the saved config will NOT automatically reload — the user must click it again in the sidebar. This is by design (avoiding complex re-hydration of configs). Document this if asked.
