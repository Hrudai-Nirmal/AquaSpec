# ADR-010: LLaMA 4 Maverick

**Date:** 2026-07-01
**Status:** Accepted

## Context

The AquaSpec client app is functionally complete (sizing engine, 5-step wizard, PDF pipeline, draft persistence, saved configurations) but visually reads as grayscale wireframe. The app uses shadcn/ui defaults — near-black primary, serif headings, light gray inputs, zero brand color. Sales engineers need a tool that feels professional, branded, and trustworthy.

The Lotus Ozone official site (lotusozone.com) uses shadcn/ui + Tailwind with a cyan/teal water-themed palette and clean sans-serif typography. AquaSpec should extend this brand language into the tool.

## Decision

We implement a full visual overhaul grounded in the Lotus Ozone brand:

### Color Palette

- **Primary (interactive):** Cyan-500 `#06b6d4` — buttons, links, focus rings, active states, stepper active step, toggles
- **Secondary (structural):** Teal-500 `#0d9488` — card accent borders, completed stepper states, section dividers
- **Background:** Slate-50 `#f8fafc` (page background), White `#ffffff` (cards)
- **Text:** Slate-900 `#0f172a` (headings), Slate-700 `#334155` (body), Slate-500 (muted)
- **Top accent bar:** 3px gradient from cyan-500 to teal-500

### Typography

- **Headings:** Geist (Google Fonts, geometric sans-serif, 600-700 weight, -0.02em tracking)
- **Body/UI:** Inter (Google Fonts, 400-500 weight)
- Drop all serif fonts entirely

### Component Upgrades

1. **Cards:** Subtle teal gradient top (teal-50 → white), 3px teal-500 top border accent
2. **Input fields:** Proper focus ring (cyan-500, 3px spread, 12% opacity), Inter font
3. **Buttons:** Solid cyan-500 for primary actions (Next, Save, Recompute), ghost/outline for secondary
4. **Stepper:** Cyan active circle, teal completed circles with connecting track, step labels
5. **Toggles:** Cyan background for active, slate border for inactive
6. **Header:** Lotus logo mark (stylized "L" or actual logo) + "AquaSpec" title + subtitle
7. **Results panel:** Slide-in from right (350ms cubic-bezier), model tag badges (cyan-50 bg)

### Results Panel Behavior Change

The results panel now slides in from the right side ONLY when results are ready (i.e., form is valid and computation completed). When incomplete/loading/error, the form area takes full width. This eliminates the "dead space" problem (empty card with spinner) and creates a more dynamic layout. The slide transition is 350ms with cubic-bezier easing.

### Brand Integration

- Top accent bar: 3px gradient cyan → teal
- Logo mark in header (geometric "L" in cyan/teal gradient, 32px)
- "AquaSpec" title + "Lotus Ozone Water Treatment Sizing Wizard" subtitle
- Consistent cyan-500/teal-500 palette across all interactive and structural elements

## Consequences

### Positive
- Instant brand recognition — tool looks like a Lotus Ozone product
- No more "Word document" feel from serif fonts
- Professional, modern aesthetic matching current SaaS design standards
- More space-efficient layout (results panel only occupies space when useful)
- Better contrast on buttons (Next button no longer looks disabled)

### Negative
- Slide-in results panel adds motion complexity — must handle transition states properly
- Geist font requires Google Fonts CDN dependency (cached, small impact)
- Top accent bar is 3px — minor layout adjustment needed
- Teal gradient on cards requires careful implementation in Tailwind (linear gradient utilities)

## Alternatives Considered

- **Keep results panel always visible:** Rejected — wastes space when incomplete and creates a dead zone
- **Match official site exactly (grayscale shadcn defaults):** The official site happens to use similar defaults, but our tool needs stronger brand presence since it IS the product interface, not a marketing page
- **Full dark mode:** Rejected — sales engineers work in well-lit environments, light mode is more readable for data entry