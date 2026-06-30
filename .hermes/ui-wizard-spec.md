# Spec: AquaSpec 5-Step Wizard + Results Panel

## Goal
Build the complete 5-step data entry wizard for the AquaSpec web application. The form collects hatchery parameters (Steps 1–4) and displays live sizing results (persistent + Step 5). The engine runs server-side via a Next.js API route. The UI must be fully responsive (mobile/tablet/desktop) and support both aggregate and multi-system hatchery modes.

## Context

### What Exists
- `src/lib/sizing-engine/types.ts` — All TypeScript types, Zod schemas (`HatcheryInput`, `SystemInput`, etc.)
- `src/lib/sizing-engine/engine.ts` — `sizeHatchery(input, rules)` function
- `src/data/sizing-rules.json` — Rules data file (server-side only — never imported client-side)
- `src/components/ui/button.tsx` — shadcn/ui Button component
- `src/lib/utils.ts` — shadcn/ui utility (`cn()`)

### Engine Invocation
The engine runs server-side ONLY. Create an API route at `src/app/api/size/route.ts`:
- **POST** — Accepts `HatcheryInput` (Zod-validated), loads `sizing-rules.json`, calls `sizeHatchery()`, returns `HatcheryRecommendation`
- Returns 400 with field-level errors on validation failure
- Returns 500 with error message on engine failure

### State Management
Use **Zustand** (install `zustand` as a dependency). Create `src/lib/store.ts` with:
```typescript
interface FormState {
  // --- UI State ---
  activeStep: number; // 1-5
  activeSystemIndex: number; // current tab in multi-system mode (0-based)
  
  // --- Form Data ---
  hatcheryName: string;
  mode: 'aggregate' | 'multi_system';
  systems: SystemData[]; // array of per-system form data
  
  // --- Validation ---
  fieldErrors: Record<string, string>; // keyed by "systems.0.waterSource" etc.
  isValid: boolean; // true when all fields pass validation
  
  // --- Results ---
  recommendation: HatcheryRecommendation | null;
  isComputing: boolean;
  computeError: string | null;
  
  // --- Actions ---
  setActiveStep(step: number): void;
  setActiveSystemIndex(index: number): void;
  updateField(path: string, value: any): void;
  addSystem(): void;
  removeSystem(index: number): void;
  renameSystem(index: number, name: string): void;
  setMode(mode: 'aggregate' | 'multi_system'): void;
  triggerCompute(): Promise<void>;
}
```

### Validation (Pattern B — Guarded)
- Zod validation fires **200ms after last keystroke** on text/number inputs
- Zod validation fires **instantly** on dropdown/select changes
- Engine API call is suppressed until ALL fields across ALL systems pass client-side validation
- Inline error messages appear below invalid fields
- Server-side re-validates and returns 400 with errors if client validation was somehow bypassed

### Responsive Breakpoints
- **Mobile (<768px):** Single column, stacked. Form above, results panel below. Bottom nav compact.
- **Tablet (768–1024px):** Side-by-side compact. Narrower form, narrower results panel.
- **Desktop (>1024px):** Full side-by-side. Generous spacing. Max-width container.

---

## Step 1: Hatchery Identity

**Fields:**
- Hatchery Name (text input, required, min 1 char)
- Mode toggle: "Single System" / "Multi-System" (radio or segmented control)

**Multi-System Mode — System Management (shown only when mode = multi_system):**
- List of systems with their names
- Each system row: editable name input + delete button (trash icon)
- "Add System" button at bottom
- Minimum 1 system, no arbitrary maximum (let user decide)

**Default:** When switching from aggregate → multi_system, create one system named "System 1" with empty fields. Do NOT auto-populate from aggregate data.

---

## Step 2: Water Profile

**Fields (per system):**
- Water Source — dropdown: Seawater / Freshwater / Borewell / Estuary
- Quality Band — dropdown: Good / Moderate / Poor
- Salinity — numeric input, 0–50 ppt

**Multi-System:** Tabs at top — one per system. Fields below the selected tab.

---

## Step 3: Hydraulic Parameters

**Fields (per system):**
- Total Volume — numeric input, m³, positive
- Turnovers Per Day — numeric input, integer, positive
- Operating Hours Per Day — numeric input, 1–24

**Multi-System:** Same tab pattern as Step 2.

---

## Step 4: Disinfection Target

**Fields (per system):**
- Target Pathogen — dropdown: Vibrio / WSSV / General Disinfection
- Species — dropdown: Vannamei / Monodon / Indicus / Other
- System Type — dropdown: Larval Rearing / Broodstock / Algae Culture / Nauplii / General
- Biomass DO Demand — numeric input (m³/hr), optional. Placeholder: "Default from rules (X.XX m³/hr)" showing the current default value from the rules file

**Multi-System:** Same tab pattern as Steps 2–3.

---

## Step 5: Review & Generate

This step is primarily the **Results Panel** (always visible, but Step 5 makes it the focus with no form fields).

**Additional elements on Step 5:**
- Summary of all systems and their inputs (read-only)
- "Generate Proposal" button → opens PDF preview modal (see below)
- Aggregate summary card (multi-system mode only)

---

## Results Panel (Persistent)

Always visible regardless of active step. States:

### State 1: Incomplete
"Complete all fields to see recommendations."
Shown when ANY field across ANY system is invalid/empty.

### State 2: Computing
Spinner/skeleton with "Calculating..." text.
Shown during the API call (debounced 300ms after last valid input change).

### State 3: Error
Red banner with error message from the API.
Shown on API failure or engine error.

### State 4: Ready (Aggregate Mode)
Cards showing:
- **Flow Rate:** XX.XX m³/hr (with input summary: volume, turnovers, hours)
- **Ozone:** XX.XX g/hr → LT-G-XX (dose rate, condition multiplier shown)
- **UV:** LTU-T-XX (×N if parallel) — rated flow, required flow shown
- **Oxygen:** XX.XX m³/hr → LTX-XX (ozone feed XX.XX m³/hr + biomass DO XX.XX m³/hr breakdown)

### State 4b: Ready (Multi-System Mode)
Above per-system cards PLUS an aggregate summary card:
- Total Flow Rate
- Total Ozone Demand
- Combined equipment list (all ozone generators, UV units grouped by model, all oxygen packages)

### Panel Behavior
- **Desktop/Tablet:** Fixed position on the right side, scrollable independently of form
- **Mobile:** Below the form, scrollable in flow

---

## Navigation (Pattern C)
- **Bottom bar** with: Previous button (←), progress dots (1–5, clickable), Next button (→)
- Previous disabled on Step 1, Next disabled on Step 5
- Clicking a dot jumps to that step
- On mobile: buttons stack at bottom, dots centered. Keep it sticky (fixed at bottom of viewport).

---

## PDF Preview Modal (Step 5 only)

**Trigger:** "Generate Proposal" button on Step 5.

**Modal content:**
- For now: a styled preview that mirrors what the PDF will look like
- Header: Lotus Ozone logo placeholder + "AquaSpec Proposal" title + hatchery name + date
- Body: Per-system engineering summaries (or aggregate if single system)
- Footer: Optional budgetary estimate section (if user opts in — add a toggle on Step 5)
- Bottom: "Download PDF" button (primary) + "Close" button (secondary)
- "Download PDF" button is a **placeholder** — for now it logs "PDF generation not yet implemented" to console. The actual Playwright pipeline is a FUTURE task.

**Modal implementation:** Use shadcn/ui Dialog component.

---

## Components to Build

Create under `src/components/`:
```
src/components/
  wizard/
    WizardContainer.tsx    — orchestrates steps + nav + results panel
    StepIndicator.tsx      — bottom progress bar with dots + prev/next
    Step1Identity.tsx      — hatchery name + mode + system CRUD
    Step2WaterProfile.tsx  — water source + quality + salinity (per-system)
    Step3Hydraulics.tsx    — volume + turnovers + hours (per-system)
    Step4Disinfection.tsx  — pathogen + species + type + biomass DO (per-system)
    Step5Review.tsx        — read-only summary + generate button
    SystemTabs.tsx         — tab bar for multi-system mode (used in Steps 2-4)
  results/
    ResultsPanel.tsx       — persistent panel, handles all 4 states
    FlowRateCard.tsx       — Phase A result card
    OzoneCard.tsx          — Phase B result card
    UVCard.tsx             — Phase C result card
    OxygenCard.tsx         — Phase D result card
    AggregateSummary.tsx   — aggregate card for multi-system mode
  proposal/
    ProposalPreview.tsx    — PDF preview modal content
```

## API Route
```
src/app/api/size/route.ts  — POST handler
```
Exact implementation: validate body with `HatcheryInput.parse()`, load `src/data/sizing-rules.json`, call `sizeHatchery()`, return JSON response.

## Main Page
Update `src/app/page.tsx` to render `WizardContainer`.

---

## Acceptance Criteria

1. **Step 1:** Can enter hatchery name. Can toggle between aggregate and multi-system mode. In multi-system mode, can add/rename/delete systems. Minimum 1 system enforced.
2. **Steps 2–4:** All dropdowns populated with correct options. Numeric inputs accept valid ranges. Fields show inline validation errors after 200ms debounce on keystroke (instant on dropdowns). Multi-system mode shows system tabs — switching tabs preserves data independently.
3. **Step 3 specific:** Volume must be > 0. Turnovers must be positive integer. Hours must be 1–24.
4. **Step 4 specific:** Biomass DO input shows placeholder with current rules default value. Optional field.
5. **Free-form navigation:** Can click any progress dot to jump to any step. Prev/Next buttons work. No forced linear flow.
6. **Results panel — incomplete state:** Shows "Complete all fields" message when any required field is empty.
7. **Results panel — ready state:** All Phase A–D cards render with correct values pulled from the API response. Values match engine output (verified against known test cases from engine tests).
8. **Results panel — multi-system:** Per-system cards + aggregate summary card with correct totals and grouped equipment list.
9. **API route:** POST to `/api/size` returns `HatcheryRecommendation` JSON. Invalid input returns 400 with Zod error details. Engine failure returns 500.
10. **Debounced computation:** Changing a field does not immediately fire the API. Wait 300ms after last change. Changing multiple fields rapidly fires only one API call.
11. **Responsive:** Mobile (<768px) — single column, form above results. Tablet (768–1024px) — compact side-by-side. Desktop (>1024px) — full side-by-side. Bottom nav is sticky on mobile.
12. **PDF preview modal:** Opens on "Generate Proposal" click. Shows styled preview with placeholder branding. "Download PDF" button exists but logs placeholder message.
13. **Step 5:** Shows read-only summary of all inputs. "Generate Proposal" button present. Results panel still visible.
14. **No rules file on client:** `sizing-rules.json` is imported ONLY in the API route. Not in any client component.
15. **Empty state handling:** When switching from aggregate → multi_system, new systems start with empty fields. Results panel shows "incomplete" state.

## Constraints
- Use **shadcn/ui** components for all UI elements (Button, Input, Select, Tabs, Card, Badge, Dialog). Install additional shadcn components as needed (`npx shadcn add <component>`).
- Use **Zustand** for state management (`npm install zustand`).
- Use **Tailwind CSS** for all styling. No CSS modules or styled-components.
- Use existing `src/lib/sizing-engine/types.ts` — import types, do NOT modify.
- Do NOT import `sizing-rules.json` in any client component.
- The `page.tsx` should be a server component. The wizard is a client component (`'use client'`).
- Number formatting: flow rate to 2 decimal places, ozone to 2 decimal places, oxygen to 3 decimal places.

## Non-Goals
- Playwright/Chromium PDF generation (placeholder only)
- Pricing/budgetary estimate toggling (future task)
- Save/load hatchery configurations (future task)
- Rules file version change detection (future task)
- "Send to Client" email functionality (future task)
- Authentication/authorization (app is internal, auth is future)

## Known Unknowns
- Lotus Ozone logo/branding assets — use placeholder text "LOTUS OZONE" in the PDF preview modal
- Exact color palette — use shadcn/ui default theme (neutral/slate). Can be customized later.
- The rules file's biomass DO defaults are not queryable client-side. For the Step 4 placeholder text showing the default value, either:
  - Add a small API endpoint `GET /api/defaults?species=X&systemType=Y` that returns the default, OR
  - Hard-code display values in a small client-side mapping (since the actual computation still happens server-side)
  - **Choose:** Add the API endpoint — it's one extra route and keeps the rules file fully server-side.
