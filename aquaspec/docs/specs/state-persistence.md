# Implementation Spec: Client-Side Draft Persistence (IndexedDB)

**ADR:** ADR-008  
**Feature:** `feat: state-persistence`  
**Type:** Client-side engine + store integration  
**Profile:** Coder (local Ollama)

---

## Goal

Automatically save in-progress wizard form data to IndexedDB on every change, and silently restore it when the user reopens the app. No prompts, no banners — the wizard picks up exactly where it left off.

---

## Context

AquaSpec's wizard collects 11+ form fields across 5 steps. Currently, all state lives in a Zustand store (in-memory only). Closing the tab loses everything.

This spec adds an IndexedDB-backed draft persistence layer that:
- Writes form state to IndexedDB on every field change (debounced 500ms)
- Hydrates the store from IndexedDB on app load (silent restore)
- Re-triggers validation + compute after hydration
- Provides a "New Configuration" button to discard the draft and start fresh
- Handles SSR gracefully (IndexedDB is browser-only)

### Files you should read before starting
- `src/lib/store.ts` — Zustand store (form state, actions, validation)
- `src/lib/sizing-engine/types.ts` — Type definitions (DraftData will mirror fields from here)
- `src/components/wizard/StepIndicator.tsx` — Bottom navigation bar
- `src/components/wizard/WizardContainer.tsx` — Main wizard layout
- `src/app/page.tsx` — Root page (renders WizardContainer)
- `src/app/layout.tsx` — Root layout
- `docs/context.md` — Domain model
- `ADRs/ADR-008-state-persistence.md` — Architecture decision record for this feature

### Files you MUST NOT modify
- `src/lib/sizing-engine/*` — Engine is locked
- `src/lib/proposal-html.ts` — PDF pipeline, unrelated
- `src/data/sizing-rules.json` — Rules data
- `src/data/pricing.json` — Pricing data
- `src/components/ui/*` — UI primitives (unless adding a new one following the existing pattern)
- Any API route files (`src/app/api/*`)

### Files you WILL modify
- `src/lib/persistence.ts` — **NEW** IndexedDB wrapper module
- `src/lib/store.ts` — Add hydration + auto-persist
- `src/components/wizard/WizardContainer.tsx` — Add "New" button, hydration guard (minor)
- `src/components/wizard/StepIndicator.tsx` — May need no changes (New button goes in WizardContainer header)
- `src/lib/persistence.test.ts` — **NEW** tests (or under `__tests__/`)

---

## Computation Rules

### Draft Data Shape (what gets persisted)

```typescript
interface DraftData {
  schemaVersion: number;     // Always 1 for this implementation
  hatcheryName: string;
  mode: "aggregate" | "multi_system";
  activeStep: number;        // 1-5
  activeSystemIndex: number; // 0-indexed
  systems: Array<{
    name: string;
    waterSource: string;
    qualityBand: string;
    totalVolumeM3: string;
    turnoversPerDay: string;
    operatingHoursPerDay: string;
    salinityPpt: string;
    targetPathogen: string;
    species: string;
    systemType: string;
    biomassDODemandM3Hr: string;
  }>;
}
```

All values are strings (exactly as stored in the Zustand `SystemData` interface). No parsing, no validation at the persistence layer — it's a raw byte-level save of the form state.

### Persistence Flow

1. **App loads** → persistence module attempts `loadDraft()` from IndexedDB
   - If draft exists AND `schemaVersion === 1`: hydrate the store with `hatcheryName`, `mode`, `systems[]`, `activeStep`, `activeSystemIndex`
   - If no draft OR schemaVersion mismatch: use default empty state
   - Set `isHydrated = true` (regardless of whether a draft was found)

2. **User changes any form field** → Zustand store updates → `subscribe` callback fires
   - Extract the persistable subset from the store
   - Debounce 500ms (separate timer from the compute debounce)
   - Write to IndexedDB

3. **After hydration with a draft** → trigger validation (`validateAndSchedule` equivalent)
   - This re-validates all fields and schedules a debounced compute
   - If the form is valid, compute fires and results appear in the panel

4. **User clicks "New Configuration"** → call `clearDraft()` (deletes from IndexedDB) → reset store to defaults → navigate to step 1

### IndexedDB Schema

- **Database name:** `aquaspec-drafts`
- **Object store:** `drafts` (keyPath: `"id"`)
- **Single record:** `{ id: "current", ...DraftData }`
- **Version:** 1

### SSR Safety

All IndexedDB code must be gated behind:
```typescript
if (typeof window === "undefined") return null; // or no-op
```

- `loadDraft()` returns `null` on server
- `saveDraft()` is a no-op on server
- `clearDraft()` is a no-op on server

### Hydration Guard

While `isHydrated === false`, the store has NOT yet attempted to load from IndexedDB. The UI should NOT render form fields during this window (they'd show defaults briefly, then flash to restored values). Show nothing or a minimal loading indicator until hydration completes.

The hydration window is extremely brief (IndexedDB read is milliseconds). In practice, the user may never see it — but the guard prevents a flash of wrong content.

---

## Acceptance Criteria

### AC-1: Draft is auto-saved on field change
**Given** the user is on any wizard step with form data filled in  
**When** they type in a field, select a dropdown, or change any input  
**And** 500ms pass without further changes  
**Then** the current form state (systems, hatcheryName, mode, activeStep, activeSystemIndex) is persisted to IndexedDB under key `"current"` in database `aquaspec-drafts`

### AC-2: Draft is restored silently on app load
**Given** a draft exists in IndexedDB from a previous session  
**When** the user opens the app in a fresh tab  
**Then** the wizard loads at the exact step they were on, with all form fields populated as they left them  
**And** no prompt, banner, or dialog is shown

### AC-3: App starts fresh when no draft exists
**Given** IndexedDB contains no draft  
**When** the user opens the app  
**Then** the wizard shows default empty state (Step 1, empty fields, "System 1" as default name)

### AC-4: App starts fresh on schema version mismatch
**Given** IndexedDB contains a draft with `schemaVersion !== 1`  
**When** the user opens the app  
**Then** the draft is silently ignored, the wizard shows default empty state  
**And** the stale draft remains in IndexedDB (not deleted — may be useful for debugging)

### AC-5: Compute re-triggers after restore
**Given** a draft is restored with fully valid form data (all required fields filled)  
**When** hydration completes  
**Then** validation runs and triggers a debounced compute  
**And** results appear in the results panel

### AC-6: Transient state is NOT persisted
**Given** the user has computed results showing in the panel, and field validation errors exist  
**When** the draft is written to IndexedDB  
**Then** the persisted data does NOT contain: `recommendation`, `fieldErrors`, `isValid`, `isComputing`, `computeError`, `proposalOpen`, `biomassDefaults`

### AC-7: "New Configuration" clears everything
**Given** a draft exists in IndexedDB and the wizard has form data  
**When** the user clicks "New Configuration"  
**Then** the IndexedDB draft is deleted  
**And** the store resets to default empty state (Step 1, empty fields, mode = "aggregate", 1 empty system named "System 1")  
**And** the results panel shows empty state

### AC-8: No IndexedDB access on server
**Given** the persistence module is imported during SSR  
**When** `loadDraft()`, `saveDraft()`, or `clearDraft()` is called  
**Then** no error is thrown  
**And** `loadDraft()` returns `null`  
**And** `saveDraft()` and `clearDraft()` are no-ops

### AC-9: Hydration guard prevents flash
**Given** the app is loading with `isHydrated === false`  
**When** the wizard container renders  
**Then** it does NOT render form fields or results  
**And** shows nothing (or a minimal loading indicator if you prefer)  
**And** once `isHydrated === true`, the full wizard renders with the correct (possibly restored) state

### AC-10: Existing tests still pass
**Given** the store module has been modified to add persistence  
**When** `npm test` is run  
**Then** all existing engine tests in `src/lib/sizing-engine/__tests__/` pass with zero failures

### AC-11: Build succeeds
**Given** all changes are implemented  
**When** `npm run build` is run  
**Then** the Next.js build completes with zero TypeScript errors

---

## Constraints

1. **No external persistence libraries.** Use raw IndexedDB API. No `idb`, `dexie`, `localforage`, or similar.
2. **Store changes must be additive.** The existing store interface must not break. New actions (`clearDraft`, `isHydrated`) are added; existing actions are unchanged.
3. **Persistence debounce must be independent of compute debounce.** Two separate timers.
4. **IndexedDB operations must be non-blocking.** All async/await. No synchronous IndexedDB (it doesn't exist, but just to be explicit).
5. **The "New Configuration" button must use existing shadcn/ui `Button` component** with `variant="outline"` or `variant="ghost"`. Match the existing button style in StepIndicator.
6. **No changes to engine, rules file, or PDF pipeline.**
7. **TypeScript strict mode.** No `any` types in the persistence module.

---

## Non-Goals

- **Not** implementing "Saved Configurations" (named, user-initiated saves with full snapshot per ADR-003). That's a separate feature.
- **Not** syncing drafts across devices/browsers.
- **Not** persisting computed results. Drafts are form-data only.
- **Not** adding a "Resume?" prompt or banner.
- **Not** handling multiple tabs (if user opens two tabs, each gets its own IndexedDB read on load; the last tab to write wins — acceptable for v1).
- **Not** encrypting or compressing the draft data.

---

## "New Configuration" Button Placement

Add a "New" button in the WizardContainer header area (next to the "AquaSpec" title and subtitle). It should be a small `variant="ghost"` button with a `Plus` or `FilePlus` icon from lucide-react. Position: top-right of the header area, aligned with the title.

When clicked:
1. Call `clearDraft()` (delete from IndexedDB)
2. Call `useStore.getState().resetToDefaults()` (or equivalent — you'll add this action to the store)
3. User sees a fresh empty wizard at Step 1

---

## Known Unknowns

- **Zustand `subscribe` vs `subscribeWithSelector`:** Zustand v5 may have changed the subscribe API. Check the installed version (`zustand@^5.0.14`) and use the appropriate subscribe mechanism to watch for store changes.
- **Next.js 16 App Router hydration behavior:** The `"use client"` boundary may affect when `typeof window` becomes available. Test with `npm run dev` to ensure no hydration mismatch errors in the console.
- **IndexedDB in Vitest:** Tests for the persistence module will need a browser-like environment (jsdom supports IndexedDB). Vitest should handle this with the existing jsdom configuration, but verify.