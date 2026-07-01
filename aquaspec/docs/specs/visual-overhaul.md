# Implementation Spec: Visual Overhaul — Lotus Ozone Brand Design

**ADR:** ADR-010  
**Feature:** `feat: lotus-ozone-visual-overhaul`  
**Type:** Design system + component-level visual overhaul  
**Profile:** Coder

---

## Goal

Transform AquaSpec from a grayscale shadcn/ui wireframe into a branded, professional Lotus Ozone water treatment sizing tool. Apply the Lotus Ozone cyan/teal palette, Geist+Inter typography, polished card/input/button/stepper styling, slide-in results panel, and branded header.

---

## Context

The app is functionally complete but reads as unstyled — serif headings, grayscale-only palette, low-contrast buttons, empty-space results panel. The Lotus Ozone official site uses shadcn/ui + Tailwind with a cyan/teal water palette. This spec applies that brand language across every component.

A visual prototype demonstrating the target design is at `public/prototype.html`. Open it in a browser for reference.

### Files you should read before starting
- `public/prototype.html` — **Visual reference prototype** (open in browser to see the target design)
- `src/app/globals.css` — Current Tailwind CSS + shadcn theme variables
- `src/app/layout.tsx` — Root layout (where fonts are loaded)
- `src/components/wizard/WizardContainer.tsx` — Main wizard layout
- `src/components/results/ResultsPanel.tsx` — Results panel (will become slide-in)
- `src/components/wizard/StepIndicator.tsx` — Bottom stepper
- `src/components/ui/button.tsx` — Button variants
- `src/components/ui/card.tsx` — Card component
- `src/components/ui/input.tsx` — Input component
- `src/components/ui/select.tsx` — Select/dropdown
- `src/components/ui/badge.tsx` — Badge
- `src/components/ui/dialog.tsx` — Dialog (modals)
- `src/components/configs/SavedConfigsSidebar.tsx` — Saved configs sidebar
- `src/components/configs/SaveConfigDialog.tsx` — Save dialog
- `tailwind.config.ts` or PostCSS config — Tailwind configuration
- `docs/ADRs/ADR-010-visual-overhaul.md` — Architecture decision record

### Files you WILL modify
- `src/app/globals.css` — **Rewrite CSS custom properties** with Lotus Ozone palette
- `src/app/layout.tsx` — Add Geist + Inter Google Fonts
- `src/components/ui/card.tsx` — Teal gradient accent variant
- `src/components/ui/button.tsx` — Cyan primary, ensure proper contrast
- `src/components/ui/input.tsx` — Cyan focus ring
- `src/components/ui/select.tsx` — Cyan focus ring
- `src/components/ui/badge.tsx` — Add teal/cyan variants if needed
- `src/components/wizard/WizardContainer.tsx` — Branded header, slide-in results logic
- `src/components/wizard/StepIndicator.tsx` — Polished stepper (cyan/teal, tracks)
- `src/components/results/ResultsPanel.tsx` — Slide-in behavior, model tags
- `src/components/wizard/Step1Identity.tsx` through `Step5Review.tsx` — Card styling, typography
- `src/components/results/FlowRateCard.tsx`, `OzoneCard.tsx`, `UVCard.tsx`, `OxygenCard.tsx`, `AggregateSummary.tsx` — Result card polish
- `src/components/configs/SavedConfigsSidebar.tsx` — Teal accent, typography
- `src/components/configs/SaveConfigDialog.tsx` — Typography
- `src/components/configs/UnsavedWorkDialog.tsx` — Typography
- `src/components/proposal/ProposalPreview.tsx` — Polish (if present)

### Files you MUST NOT modify
- `src/lib/*` — All logic modules (sizing engine, persistence, store — logic is locked)
- `src/data/*` — Rules and pricing data
- `src/app/api/*` — API routes
- `package.json`, `tsconfig.json`, `vitest.config.ts` — Config files
- Tests — do not touch test files

### Target: Visual Reference Prototype

Open `public/prototype.html` in a browser. The production app should visually match this prototype. Every color, font, spacing, and border treatment in the prototype is the specification. The prototype is your source of truth for visual decisions.

---

## Design System (from prototype)

### Colors (CSS Custom Properties in `globals.css`)

```css
:root {
  --background: 210 40% 98%;       /* slate-50: #f8fafc — page background */
  --foreground: 222 47% 11%;       /* slate-900: #0f172a — headings */
  --card: 0 0% 100%;              /* white */
  --card-foreground: 222 47% 11%;
  --primary: 189 94% 43%;         /* cyan-500: #06b6d4 — buttons, interactive */
  --primary-foreground: 0 0% 100%;
  --secondary: 175 77% 32%;       /* teal-500: #0d9488 — structural accents */
  --secondary-foreground: 0 0% 100%;
  --muted: 210 40% 96%;           /* slate-100 */
  --muted-foreground: 215 16% 47%; /* slate-500 */
  --accent: 189 94% 43%;          /* cyan-500 */
  --accent-foreground: 0 0% 100%;
  --border: 214 32% 91%;          /* slate-200 */
  --input: 214 32% 91%;
  --ring: 189 94% 43%;            /* cyan-500 focus ring */
  --radius: 0.75rem;
  
  /* Additional tokens */
  --cyan-50: 183 100% 96%;       /* #ecfeff */
  --cyan-100: 185 96% 90%;       /* #cffafe */
  --cyan-700: 192 82% 31%;       /* #0e7490 */
  --teal-50: 170 82% 96%;        /* #f0fdfa */
  --teal-100: 170 76% 90%;       /* #ccfbf1 */
  --teal-600: 176 68% 27%;       /* #0f766e */
}
```

**IMPORTANT:** Do NOT define a `.dark` variant. AquaSpec is light-mode only per ADR-010.

### Typography

- **Headings (h1-h4, step titles, card titles):** Geist, 600-700 weight, -0.02em letter-spacing
- **Body, inputs, buttons, labels:** Inter, 400-500 weight

Google Fonts import (add to `layout.tsx` `<head>`):
```html
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

Tailwind font config (in `globals.css` or tailwind config):
```css
--font-heading: 'Geist', system-ui, sans-serif;
--font-sans: 'Inter', system-ui, sans-serif;
```

Tailwind config extension:
```js
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  heading: ['Geist', 'system-ui', 'sans-serif'],
}
```

---

## Component Specifications

### 1. Top Accent Bar

Add a 3px gradient bar at the very top of the app, above the header:
```css
background: linear-gradient(90deg, #06b6d4, #0d9488);
height: 3px;
```
Place this inside `WizardContainer` as the first child `<div>`.

### 2. Header (WizardContainer.tsx)

```
┌──────────────────────────────────────────────────────┐
│ [L] AquaSpec                          [Saved] [New] │
│     Lotus Ozone Water Treatment Sizing Wizard        │
└──────────────────────────────────────────────────────┘
```

- **Logo mark:** 32×32px rounded square (8px radius), cyan-to-teal gradient background, white "L" in Geist 700
- **Title:** "AquaSpec" — Geist 700, text-lg, slate-900
- **Subtitle:** "Lotus Ozone Water Treatment Sizing Wizard" — Inter 400, text-xs, slate-500
- **Actions:** Ghost buttons, slate-700, Inter 500, text-sm
- **Header padding:** `py-3 px-6`
- **Bottom border:** 1px solid `border` (slate-200)
- **Background:** white

### 3. Cards (card.tsx)

Two variants:

**Default card** (form steps, sidebar):
- White background
- 1px border `border` (slate-200)
- `rounded-lg` (12px, `var(--radius)`)

**Gradient-accent card** (main step content):
- Top border: 3px solid teal-500
- Background gradient: `linear-gradient(180deg, hsl(var(--teal-50)) 0%, transparent 8px)`
- The gradient is subtle — 8px of teal-50 at the top, fading to white
- `rounded-lg`, 1px border `border`
- This is the default card variant used for step content

Implement as a prop on the Card component, or create a CSS class `.card-accent` in globals.css.

### 4. Input Fields (input.tsx + select.tsx)

- Background: white
- Border: 1px solid `border` (slate-200)
- Border-radius: `rounded-md` (8px)
- Padding: `py-2 px-3`
- Font: Inter, text-sm
- Placeholder: slate-400
- **Focus state:** `border-cyan-500 ring-[3px] ring-cyan-500/15` (cyan-500 border + 3px cyan ring at 15% opacity)
- Label color: slate-700, font-medium, text-sm
- Required asterisk: cyan-600 color

### 5. Buttons (button.tsx)

**Primary (default):**
- Background: cyan-500 `#06b6d4`
- Text: white
- Border: transparent
- Hover: cyan-600 `#0891b2`
- Used for: "Next", "Save", "Recompute", "Generate Proposal"

**Secondary (outline):**
- Background: white
- Text: slate-700
- Border: slate-200
- Hover: slate-100 background
- Used for: "Previous", "Cancel", "New" (ghost variant)

**Ghost:**
- Background: transparent
- Text: slate-500
- Hover: slate-100 background
- Used for: header action buttons ("Saved", "New")

### 6. Toggle Buttons (Step1Identity mode toggle)

- Inactive: white background, slate-200 border, slate-600 text
- Active: cyan-500 background, cyan-500 border, white text
- Font: Inter 500, text-sm
- Border-radius: `rounded-md`

### 7. Stepper (StepIndicator.tsx)

```
[← Previous]  ①━━━②━━━③━━━④━━━⑤  [Next →]
               Identity  Water  Hydr  Disinf  Review
```

- **Circle:** 32×32px, rounded-full
  - Inactive: slate-200 border, white bg, slate-400 text
  - Active: cyan-500 border + bg, white text
  - Completed: teal-500 border + bg, white text
- **Track (between circles):** 32px wide, 2px tall
  - Inactive: slate-200
  - Completed: teal-500
- **Label below circle:** 10px Inter, slate-400 (active: cyan-600, completed: teal-600)
- **Previous button:** Outline, slate-700, disabled when on step 1
- **Next button:** Primary (cyan-500), disabled when on step 5 (but keep visible, not hidden)
- **Background:** white, top border 1px slate-200

### 8. Results Panel (ResultsPanel.tsx)

**Slide-in behavior:**
- The results panel renders as a fixed-right panel that slides in/out
- **Hidden state** (no recommendation OR incomplete form): `transform translate-x-full`, panel is off-screen to the right. The form area takes full width.
- **Visible state** (recommendation exists): `transform translate-x-0`, panel at `w-[420px]` on desktop
- **Transition:** `transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]`
- On mobile (< 1024px): panel covers full width when visible

**Panel contents (when results ready):**
```
┌─────────────────────────────┐
│ Results                     │
│                             │
│ Flow Rate                   │
│ 250 m³/hr                   │
│                             │
│ Ozone Generator             │
│ [LT-G-4] 375 g/hr          │
│                             │
│ UV System                   │
│ [LTU-T-100] × 2 units      │
│                             │
│ Oxygen Package              │
│ [LTX-10] 8 m³/hr total     │
└─────────────────────────────┘
```

- Panel: white bg, left border 1px slate-200, padding 1.25rem
- "Results" heading: Geist 600, text-lg, slate-900
- **Result cards:** white bg, 1px slate-200 border, rounded-lg, pad 0.875rem 1rem, margin-bottom 0.75rem
- **Model tags:** cyan-50 background, cyan-700 text, cyan-100 border, rounded, text-xs, font-semibold, inline padding
- **Values:** Geist 700, text-xl, slate-900
- **Units:** text-sm, slate-500

**Banners (version mismatch, stale edits):**
- Keep existing amber banners but reposition them above the result cards
- Same amber-50 bg, amber-200 border, amber-800 text styling

### 9. Results Cards (individual card components)

`FlowRateCard.tsx`, `OzoneCard.tsx`, `UVCard.tsx`, `OxygenCard.tsx`:

- Replace whatever current card layout they use with the result-card pattern from the prototype:
  - Small uppercase label (text-xs, tracking-wider, slate-500)
  - Large value (Geist 700, text-xl)
  - Unit suffix (text-sm, slate-500)
  - Model tag for model names (cyan-50 bg, cyan-700 text)

### 10. Saved Configs Sidebar

- Top border: 3px teal-500 instead of default
- Heading: Geist 600
- List items: Inter 400
- Active config highlight: left border-2 cyan-500 + bg-slate-50
- "Save Current" button: cyan-500 primary
- Date text: slate-400, text-xs
- "No saved configurations" text: slate-400

### 11. Proposal Preview Modal

- Headings: Geist 600
- Body text: Inter 400
- Close button: ghost

### 12. Empty/Incomplete State (ResultsPanel)

When the form is incomplete or computing, the results panel is NOT rendered at all. The form area takes full width. The slide-in only triggers when `recommendation !== null`.

Remove the inline "Complete all fields" card from the results area. Replace with: nothing. The form area simply fills the space.

---

## Implementation Order

1. **globals.css** — Rewrite CSS custom properties with Lotus Ozone palette. Remove any `.dark` variant.
2. **layout.tsx** — Add Google Fonts link (Geist + Inter)
3. **UI primitives** — card.tsx (accent variant), input.tsx (focus ring), button.tsx (cyan primary), badge.tsx (model tag variant)
4. **WizardContainer.tsx** — Add top accent bar, branded header, slide-in results logic
5. **StepIndicator.tsx** — Polished stepper with tracks
6. **ResultsPanel.tsx** — Slide-in behavior, model tag styling
7. **Result card components** — FlowRateCard, OzoneCard, UVCard, OxygenCard — restyle
8. **Step components** (Step1-5) — Card accent variant, typography fixes
9. **Configs components** — Sidebar polish, dialog typography
10. **Proposal components** — Typography polish

---

## Acceptance Criteria

### AC-1: Lotus Ozone color palette is applied
**Given** the app is loaded  
**When** inspecting the page  
**Then** the primary interactive color is cyan-500 (`#06b6d4`)  
**And** the secondary structural color is teal-500 (`#0d9488`)  
**And** the page background is slate-50 (`#f8fafc`)  
**And** there is a 3px cyan-to-teal gradient accent bar at the top of the app  

### AC-2: Geist + Inter typography is applied
**Given** the app is loaded  
**When** inspecting the page  
**Then** all headings (h1-h4, card titles, step titles, "Results") use Geist font family  
**And** all body text, labels, inputs, buttons use Inter font family  
**And** no serif fonts (Times New Roman) appear anywhere  

### AC-3: Branded header with logo mark
**Given** the app is loaded  
**When** viewing the header  
**Then** a Lotus logo mark (32×32, cyan/teal gradient, "L") is visible  
**And** "AquaSpec" title is in Geist 700  
**And** "Lotus Ozone Water Treatment Sizing Wizard" subtitle is in Inter 400, slate-500  

### AC-4: Cards have teal accent gradient
**Given** the user is on any wizard step  
**When** viewing the main step card  
**Then** the card has a 3px teal-500 top border  
**And** a subtle teal-50 to white gradient at the top (8px height)  

### AC-5: Input fields have cyan focus ring
**Given** the user clicks or tabs into any input field  
**When** the field is focused  
**Then** the border changes to cyan-500  
**And** a 3px cyan ring at 15% opacity appears around the field  

### AC-6: Next button is clearly visible (cyan)
**Given** the user is on any step before step 5  
**When** viewing the bottom stepper  
**Then** the "Next" button has a solid cyan-500 background with white text  
**And** it is clearly distinguishable as the primary action (not gray/disabled-looking)  

### AC-7: Stepper shows completed states in teal
**Given** the user has navigated past step 2  
**When** viewing the stepper  
**Then** steps 1 and 2 show teal-500 circles with white numbers  
**And** the connecting tracks between completed steps are teal-500  
**And** the completed step labels are teal-600 color  

### AC-8: Results panel slides in only when results are ready
**Given** the form is incomplete (no recommendation)  
**When** viewing the app  
**Then** the results panel is not visible (off-screen to the right)  
**And** the form area takes the full width  

**Given** the form is complete and results exist  
**When** the results arrive  
**Then** the results panel slides in from the right with a 350ms cubic-bezier transition  
**And** the panel is 420px wide on desktop  

### AC-9: Result cards use model tags
**Given** results are showing in the panel  
**When** viewing each result card  
**Then** equipment model names (LT-G-4, LTU-T-100, LTX-10) appear as tags with cyan-50 background, cyan-700 text, cyan-100 border  
**And** values use Geist 700 font at text-xl size  

### AC-10: Existing tests still pass
**Given** the visual changes are applied  
**When** `npm test` is run  
**Then** all 31 tests pass  

### AC-11: Build succeeds
**Given** all visual changes are applied  
**When** `npm run build` is run  
**Then** the Next.js build completes with zero TypeScript errors  

### AC-12: Prototype match
**Given** the visual overhaul is applied  
**When** comparing the running app to `public/prototype.html`  
**Then** the color palette, typography, card styling, stepper, results panel, and header visually match the prototype  

---

## Constraints

1. **Do not modify any logic files** — `src/lib/*` is off-limits. This is a pure visual/CSS change.
2. **Do not modify tests** — existing tests must pass without changes.
3. **Do not add `.dark` mode** — AquaSpec is light-mode only.
4. **No new npm dependencies** — Geist and Inter are Google Fonts, loaded via CDN `<link>`.
5. **Maintain existing component APIs** — UI primitives (button, card, input, etc.) must keep the same prop interfaces. Add variants, don't break existing usage.
6. **The prototype at `public/prototype.html` is your visual specification** — match it.

---

## Non-Goals

- **Not** adding dark mode
- **Not** changing component behavior or logic
- **Not** adding animations beyond the slide-in results panel
- **Not** modifying the PDF pipeline styling (separate concern)
- **Not** touching any API routes, data files, or engine code
- **Not** rewriting the proposal preview modal (minor polish only)

---

## Known Unknowns

- **Tailwind v4 with shadcn/ui:** Tailwind v4 is used (per the top accent bar gradient). CSS custom properties may work differently. The shadcn/ui v4 (@base-ui/react) may handle theme variables differently than v3. Check `globals.css` for the actual variable structure before rewriting.
- **Geist font availability:** Geist is available on Google Fonts. If the CDN is unavailable, the system-ui fallback (system sans-serif) should look acceptable but less branded.
- **Results panel slide-in with existing ResultsPanel states:** The current ResultsPanel has 4 states (incomplete, computing, error, ready). The slide-in should only happen for the "ready" state. Incomplete/computing/error states should keep the panel hidden. This means the ResultsPanel needs to be conditionally mounted or wrapped in a container that handles visibility.
- **Card accent variant implementation:** shadcn/ui v4 cards use @base-ui/react. Adding a custom variant may require a wrapper or a className extension rather than modifying the variant system directly. Check how variants work in the current setup.
