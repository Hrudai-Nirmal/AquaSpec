/**
 * AquaSpec — Proposal HTML Generator
 *
 * Pure TypeScript module. Zero React imports.
 * Exports functions that generate HTML strings from HatcheryRecommendation data.
 */

import fs from "fs";
import path from "path";
import type { HatcheryRecommendation, SystemRecommendation } from "./sizing-engine/types";

// ─── Label helpers ──────────────────────────────────────────────────────────

function waterSourceLabel(ws: string): string {
  const map: Record<string, string> = {
    seawater: "Seawater",
    freshwater: "Freshwater",
    borewell: "Borewell",
    estuary: "Estuary",
  };
  return map[ws] ?? ws;
}

function qualityBandLabel(qb: string): string {
  const map: Record<string, string> = {
    good: "Good",
    moderate: "Moderate",
    poor: "Poor",
  };
  return map[qb] ?? qb;
}

function pathogenLabel(tp: string): string {
  const map: Record<string, string> = {
    vibrio: "Vibrio",
    wssv: "WSSV",
    general_disinfection: "General Disinfection",
  };
  return map[tp] ?? tp;
}

function speciesLabel(sp: string): string {
  const map: Record<string, string> = {
    vannamei: "Vannamei",
    monodon: "Monodon",
    indicus: "Indicus",
    other: "Other",
  };
  return map[sp] ?? sp;
}

function systemTypeLabel(st: string): string {
  const map: Record<string, string> = {
    larval_rearing: "Larval Rearing",
    broodstock: "Broodstock",
    algae_culture: "Algae Culture",
    nauplii: "Nauplii",
    general: "General",
  };
  return map[st] ?? st;
}

function modeLabel(mode: string): string {
  return mode === "aggregate" ? "Single System" : "Multi-System";
}

// For system blocks, we need the original input data to display all
// the user-provided fields. The SystemRecommendation only carries the
// systemName and engineering results. We accept an optional
// inputs map (systemName → input params) for full display.
export interface SystemInputDisplay {
  name: string;
  waterSource: string;
  qualityBand: string;
  salinityPpt: number;
  totalVolumeM3: number;
  turnoversPerDay: number;
  operatingHoursPerDay: number;
  targetPathogen: string;
  species: string;
  systemType: string;
}

// ─── HTML escaping ─────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── renderSystemsHtml ─────────────────────────────────────────────────────

export function renderSystemsHtml(
  recommendation: HatcheryRecommendation,
  inputs?: SystemInputDisplay[]
): string {
  const parts: string[] = [];

  for (let i = 0; i < recommendation.systems.length; i++) {
    const sys = recommendation.systems[i];
    const input = inputs?.[i];
    const isMulti = recommendation.mode === "multi_system";
    const pageBreakClass = isMulti && i > 0 ? ' class="page-break"' : "";

    let html = `<div${pageBreakClass} class="system-block">\n`;
    html += `  <h3>${escapeHtml(sys.systemName)}</h3>\n`;

    // Input parameters table (if input data provided)
    if (input) {
      html += `  <p class="section-title">Input Parameters</p>\n`;
      html += `  <table>\n`;
      html += `    <tr><th>Parameter</th><th>Value</th></tr>\n`;
      html += `    <tr><td>Water Source</td><td>${escapeHtml(waterSourceLabel(input.waterSource))}</td></tr>\n`;
      html += `    <tr><td>Quality Band</td><td>${escapeHtml(qualityBandLabel(input.qualityBand))}</td></tr>\n`;
      html += `    <tr><td>Salinity</td><td>${input.salinityPpt} ppt</td></tr>\n`;
      html += `    <tr><td>Total Volume</td><td>${input.totalVolumeM3} m³</td></tr>\n`;
      html += `    <tr><td>Turnovers / Day</td><td>${input.turnoversPerDay}</td></tr>\n`;
      html += `    <tr><td>Operating Hours / Day</td><td>${input.operatingHoursPerDay}h</td></tr>\n`;
      html += `    <tr><td>Target Pathogen</td><td>${escapeHtml(pathogenLabel(input.targetPathogen))}</td></tr>\n`;
      html += `    <tr><td>Species</td><td>${escapeHtml(speciesLabel(input.species))}</td></tr>\n`;
      html += `    <tr><td>System Type</td><td>${escapeHtml(systemTypeLabel(input.systemType))}</td></tr>\n`;
      html += `  </table>\n`;
    }

    // Engineering results table
    html += `  <p class="section-title">Engineering Results</p>\n`;
    html += `  <table>\n`;
    html += `    <tr><th>Result</th><th>Value</th></tr>\n`;
    html += `    <tr><td>Flow Rate</td><td>${sys.flowRate.flowRateM3Hr.toFixed(2)} m³/hr</td></tr>\n`;
    html += `    <tr><td>Ozone Demand</td><td>${sys.ozoneDemand.ozoneDemandGHr.toFixed(2)} g/hr → ${escapeHtml(sys.ozoneGeneratorModel)}</td></tr>\n`;
    html += `    <tr><td>UV Unit</td><td>${escapeHtml(sys.uvSizing.selectedModel)}`;
    if (sys.uvSizing.parallelUnits > 1) {
      html += ` ×${sys.uvSizing.parallelUnits}`;
    }
    html += `</td></tr>\n`;
    html += `    <tr><td>Oxygen Package</td><td>${escapeHtml(sys.oxygenDemand.selectedModel)} (Total: ${sys.oxygenDemand.totalOxygenDemandM3Hr.toFixed(3)} m³/hr)</td></tr>\n`;
    html += `  </table>\n`;

    html += `</div>\n`;
    parts.push(html);
  }

  return parts.join("\n");
}

// ─── renderAggregateHtml ───────────────────────────────────────────────────

export function renderAggregateHtml(recommendation: HatcheryRecommendation): string {
  if (recommendation.mode === "aggregate") {
    return "";
  }

  const summary = recommendation.aggregateSummary;
  if (!summary) {
    return "";
  }

  let html = `<div class="section-title">Aggregate Totals</div>\n`;
  html += `<table>\n`;
  html += `  <tr><th>Metric</th><th>Value</th></tr>\n`;
  html += `  <tr><td>Total Flow Rate</td><td>${summary.totalFlowRateM3Hr.toFixed(2)} m³/hr</td></tr>\n`;
  html += `  <tr><td>Total Ozone Demand</td><td>${summary.totalOzoneDemandGHr.toFixed(2)} g/hr</td></tr>\n`;
  html += `  <tr><td>Total Oxygen Demand</td><td>${summary.totalOxygenDemandM3Hr.toFixed(3)} m³/hr</td></tr>\n`;
  html += `</table>\n`;

  // Equipment summary
  html += `<p class="section-title">Combined Equipment</p>\n`;
  html += `<table>\n`;
  html += `  <tr><th>Category</th><th>Equipment</th></tr>\n`;

  if (summary.allOzoneGenerators.length > 0) {
    html += `  <tr><td>Ozone Generators</td><td>${escapeHtml(summary.allOzoneGenerators.join(", "))}</td></tr>\n`;
  }
  if (summary.allUVUnits.length > 0) {
    const uvItems = summary.allUVUnits.map(
      (u) => `${escapeHtml(u.model)}${u.quantity > 1 ? ` ×${u.quantity}` : ""}`
    );
    html += `  <tr><td>UV Units</td><td>${uvItems.join(", ")}</td></tr>\n`;
  }
  if (summary.allOxygenPackages.length > 0) {
    html += `  <tr><td>Oxygen Packages</td><td>${escapeHtml(summary.allOxygenPackages.join(", "))}</td></tr>\n`;
  }

  html += `</table>\n`;

  return html;
}

// ─── renderBudgetaryHtml ───────────────────────────────────────────────────

export function renderBudgetaryHtml(pricing: Record<string, string>): string {
  let html = `<div class="budgetary">\n`;
  html += `  <h3>Budgetary Estimate</h3>\n`;

  if (pricing.ozone) {
    html += `  <p><strong>Ozone Generators:</strong> ${escapeHtml(pricing.ozone)}</p>\n`;
  }
  if (pricing.uv) {
    html += `  <p><strong>UV Disinfection:</strong> ${escapeHtml(pricing.uv)}</p>\n`;
  }
  if (pricing.oxygen) {
    html += `  <p><strong>Oxygen Packages:</strong> ${escapeHtml(pricing.oxygen)}</p>\n`;
  }
  if (pricing.disclaimer) {
    html += `  <p><em>${escapeHtml(pricing.disclaimer)}</em></p>\n`;
  }

  html += `</div>\n`;
  return html;
}

// ─── applyTemplate ─────────────────────────────────────────────────────────

export function applyTemplate(template: string, tokens: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(tokens)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

// ─── renderProposalHtml (shared between preview and PDF) ───────────────────

export function renderProposalHtml(
  recommendation: HatcheryRecommendation,
  includeBudgetary: boolean,
  logoUrl: string,
  inputs?: SystemInputDisplay[]
): string {
  const templatePath = path.resolve(process.cwd(), "src/templates/proposal.html");
  const template = fs.readFileSync(templatePath, "utf-8");

  const pricingPath = path.resolve(process.cwd(), "src/data/pricing.json");
  const pricing = JSON.parse(fs.readFileSync(pricingPath, "utf-8")) as Record<string, string>;

  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tokens: Record<string, string> = {
    PRIMARY_COLOR: "#1F5DE1",
    LOGO_URL: logoUrl,
    HATCHERY_NAME: recommendation.hatcheryName,
    DATE: date,
    MODE_LABEL: modeLabel(recommendation.mode),
    SYSTEMS_HTML: renderSystemsHtml(recommendation, inputs),
    AGGREGATE_HTML: renderAggregateHtml(recommendation),
    BUDGETARY_HTML: includeBudgetary ? renderBudgetaryHtml(pricing) : "",
    FOOTER_TEXT: "Generated by AquaSpec — Lotus Ozone Tech Pvt. Ltd.",
  };

  return applyTemplate(template, tokens);
}
