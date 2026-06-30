# ADR-007: PDF Pipeline — Playwright HTML-to-PDF with Branded Template

**Date:** 2026-07-01
**Status:** Accepted

## Context
AquaSpec must generate branded PDF proposals from computed sizing results. The PDF is the salesperson's deliverable to the client. Key decisions needed around generation technology, template architecture, branding, UX flow, and error handling.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Playwright (Chromium)** for server-side PDF generation | Full Chromium rendering ensures pixel-perfect branded output. Heavier than Puppeteer (~400MB) but accepted by user for quality. |
| 2 | **Dedicated HTML print template** (not React component) | Separate from ProposalPreview modal — A4-optimized CSS, page breaks, letterhead. Zero React dependency in PDF rendering path. |
| 3 | **Same HTML template serves both preview page and PDF source** | Single source of truth. Browser renders it as `/proposal/preview`; Playwright renders the same file server-side for PDF. |
| 4 | **Preview-then-download UX** | Salesperson sees full branded preview before downloading. Modal closes → preview page renders → "Download PDF" button triggers API → browser downloads. |
| 5 | **A4 format, branded filename** | `LotusOzone_Proposal_{HatcheryName}_{Date}.pdf` — sortable, professional. A4 standard for Indian engineering proposals. |
| 6 | **Budgetary estimate included now** | Toggle checkbox on Step 5 modal controls inclusion. Static pricing text from `pricing.json`. Engine never touches pricing. |
| 7 | **Flat pricing file** | Single text block per equipment category. No tiered or model-specific pricing — salesperson retains final authority. |
| 8 | **Template location: `src/templates/proposal.html`** | Standalone HTML with `{{TOKEN}}` placeholders. API route reads file, injects data, passes to Playwright. |
| 9 | **15s timeout + toast error** | Large proposals (10+ systems) may take time. Toast: "Proposal generation timed out. Please try again." |
| 10 | **Chromium retry 1× then fallback** | On Chromium crash/missing binary: one automatic retry, then error toast: "PDF service unavailable." |

## Brand Identity (extracted from LotusOzoneLogo.png)
- **Primary color:** `#1F5DE1` (Lotus Blue)
- **Background:** White
- **Font:** Bold geometric sans-serif, all-caps (→ Montserrat Bold)
- **Logo:** `/public/LotusOzoneLogo.png`, 700×301px, centered lotus icon + "LOTUS OZONE" wordmark
- **No tagline**

## Consequences
- **Positive:** Single HTML template = single source of truth for both preview and PDF. Branded output from day one. Budgetary estimate gated behind toggle. Playwright gives pixel-perfect A4 output with headers/footers.
- **Negative:** Playwright adds ~400MB to deployment footprint. Template token replacement is string-based, not TypeScript-safe (mitigated by testing the token map against the Zod schema). Preview page is a raw HTML route, not a Next.js layout — no shared nav/chrome.
- **Risk:** Budgetary estimate toggle adds conditional template logic — must test both toggle states. If `pricing.json` is missing, template must degrade gracefully.
