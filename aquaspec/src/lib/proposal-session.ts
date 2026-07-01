/**
 * Session-backed proposal persistence keeps the dedicated preview route alive
 * even when in-memory wizard state is unavailable after navigation.
 */

import type { HatcheryRecommendation } from "./sizing-engine/types";
import type { SystemInputDisplay } from "./proposal-html";

const PROPOSAL_SESSION_KEY = "aquaspec-proposal-session";

export interface ProposalSessionPayload {
  hatcheryName: string;
  includeBudgetary: boolean;
  recommendation: HatcheryRecommendation;
  inputs: SystemInputDisplay[];
}

/**
 * Checks whether browser session storage is available in the current runtime.
 */
function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

/**
 * Persists the latest proposal payload for the preview page fallback.
 */
export function saveProposalSession(payload: ProposalSessionPayload): void {
  if (!canUseSessionStorage()) return;
  sessionStorage.setItem(PROPOSAL_SESSION_KEY, JSON.stringify(payload));
}

/**
 * Loads the most recent proposal payload from session storage.
 */
export function loadProposalSession(): ProposalSessionPayload | null {
  if (!canUseSessionStorage()) return null;

  try {
    const rawPayload = sessionStorage.getItem(PROPOSAL_SESSION_KEY);
    return rawPayload ? (JSON.parse(rawPayload) as ProposalSessionPayload) : null;
  } catch {
    return null;
  }
}

/**
 * Clears any persisted proposal payload after it is no longer needed.
 */
export function clearProposalSession(): void {
  if (!canUseSessionStorage()) return;
  sessionStorage.removeItem(PROPOSAL_SESSION_KEY);
}
