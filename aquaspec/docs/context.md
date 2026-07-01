# AquaSpec — Project Context

## Domain Entities

### Hatchery Configuration
A saved set of inputs and results representing one customer's water treatment sizing scenario. Stores the complete snapshot (inputs + computed results + rules file version metadata) to preserve historical fidelity.

**Modes:**
- **Aggregate Mode (default):** One set of global parameters → one recommended package.
- **Multi-System Mode:** N named "Systems" (e.g., "Larval Rearing", "Broodstock"), each with independent parameters → N independent recommended packages within one file.

**Mode Switching:** Manual only. No auto-splitting or auto-aggregation of data between modes.

**Reopen Behavior:** Displays saved results as-is. Detects rules file version changes and notifies user. Manual recompute trigger available.

---

### Sizing Engine
**Type:** Pure, deterministic, single-pass arithmetic pipeline. Framework-independent TypeScript module. 100% unit test coverage target.

**Computation Pipeline (immutable — 4 sequential phases):**

| Phase | Formula | Input Source |
|-------|---------|-------------|
| **A: Flow Rate** | `(Total Volume × Turnovers per Day) / Operating Hours` | User input (m³, int, hours) |
| **B: Ozone Demand** | `Flow Rate × Dose Rate (g/m³)` | Flow from Phase A + `sizing-rules.json` (dose rate by water source/quality) |
| **C: UV Sizing** | Capacity match: `Required ≥ Flow Rate` | Flow from Phase A → match smallest LTU-T model; parallel units if flow exceeds largest model |
| **D: Oxygen Demand** | `Ozone Generator Feed Req + Biomass DO Demand` | Feed req from rules file (per ozone model) + Biomass DO (user-entered or rules default) |

**Invariants:**
- Rules file NEVER alters the computation path. It is a coefficient store, not a control-flow store.
- Engine does NOT compute pricing, margins, or commercial logic.
- Engine outputs ONE design point per system. No multi-scenario spread.
- Live recompute on any input change.

---

### Equipment Rules File (`sizing-rules.json`)
**Type:** Pure data file. Contains zero executable code.

**Contents:**
1. **Model Catalog:** LT-G (Ozone), LTU-T (UV), LTX/LTX-M (Oxygen) with capacity ranges for range-matching.
2. **Conditional Parameters:** Safety factors and dose adjustments keyed on input conditions (water source, salinity, pathogen target, quality band). Declared as data.
3. **Per-Model Oxygen Feed Requirements:** Minimum O₂ feed per ozone generator model.
4. **Biomass DO Defaults:** Default dissolved oxygen demand per species/system type.
5. **Version Identifier:** Timestamp or hash for saved-config change detection.

---

### Pricing / Budgetary Estimate
**Type:** Static text snippets in a separate file.
**Engine Role:** None — engine does not touch pricing.
**PDF Role:** Optional inclusion. Pulls relevant text snippet from static file when user enables it.
**Business Rule:** Salesperson retains final pricing authority.

---

### PDF Proposal
**Aggregate Mode:** Single-section document — engineering summary + recommended equipment + optional budgetary estimate.

**Multi-System Mode:** Multi-section document with:
- Aggregate summary (total flow, combined equipment list, optional combined estimate)
- Per-System sections with independent summaries
- Clear visual separation between systems

**Generation:** Playwright/Chromium HTML-to-PDF pipeline. Branded with Lotus Ozone styling.

---

### Draft (Auto-Saved Form State)
**Persistence:** Form data only — systems[], hatcheryName, mode, activeStep, activeSystemIndex. No computed results.
**Behavior:** Auto-saved to IndexedDB on every field change (debounced 500ms). Silent restore on app open — user picks up exactly where they left off with no prompt.
**Recompute:** Full re-compute triggered on restore. Results are always fresh against current rules.
**Discard:** "New Configuration" button clears the draft and resets the store.
**Scope:** Single draft per browser. One device only (not synced). Transient work-in-progress — not a permanent record.

---

### Saved Configuration (Hatchery Config)
**Persistence:** Full snapshot — all inputs + all computed results + rules file version metadata. Stored in separate IndexedDB database `aquaspec-configs`, object store `configs`, keyed by UUID.
**Save:** User clicks "Save Current" in sidebar → name dialog (first save) or silent overwrite (re-save). Duplicate names allowed (UUIDs are unique). Saves `HatcheryInput` (parsed values), `HatcheryRecommendation`, `rulesVersionAtSave`, `includeBudgetaryEstimate`.
**Reopen:** Loads into wizard — populates form fields AND results panel. Displays saved results as-is; no auto-recompute. Active step resets to 1.
**Unsaved Work:** Prompt dialog (Save & Load / Discard & Load / Cancel) when loading a config over in-progress work.
**Change Detection:** On load, compare stored `rulesVersionAtSave` vs current `sizing-rules.json` version. Mismatch → version-mismatch banner in results panel.
**Stale Edits Detection:** After loading, if user edits any form field → stale-edits banner in results panel.
**Recompute:** Banner button only. Recomputes with current inputs + current rules. Auto-saves updated results to IndexedDB (same UUID).
**Management:** Collapsible sidebar panel. Lists all saved configs (name, date, mode, rules version). Direct delete from sidebar. Click to load.

### Configs Sidebar
**Position:** Fixed overlay panel on right side (desktop) or full-width (mobile). Toggled via "Saved" button in wizard header.
**Contents:** "Save Current" button + scrollable config list + empty state when no configs.
**Behavior:** Highlighted row for currently loaded config. Delete with confirmation. Click row to load (with unsaved-work check).

---

## Technical Stack
- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui v4
- **Validation:** Zod
- **State:** Zustand
- **PDF:** Playwright/Chromium (HTML → PDF)
- **Engine:** Framework-independent pure TypeScript module
- **Data Files:** JSON (sizing rules, static pricing text)

## Visual System
- **Brand Direction:** Lotus Ozone light-mode visual language uses a white page canvas with `#007979`, `#24B1B1`, and `#6FD1D7` accents, plus the real `public/LotusOzoneLogo.png` in the enlarged header.
- **Typography:** Inter drives body copy and step numbers, while heading moments use the branded display stack already wired through `--font-heading`.
- **Card Treatment:** Main wizard cards and support sections use soft white surfaces, clean teal borders, and restrained drop shadows instead of the earlier warm beige shell.
- **Field Styling:** Inputs and selects keep colored borders, larger hit areas, and glassy white fills without inline red error copy, while steps 2-4 include compact info icons for field guidance.
- **Navigation Feedback:** The main wizard card now uses a combined ReactBits-style stepper shell that advances between sections while marking incomplete ones red and completed ones green.
- **Support CTA Areas:** The form rail now continues into a “What happens next?” explainer and a direct-contact section with call and WhatsApp cards.
