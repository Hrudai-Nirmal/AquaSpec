import type { HatcheryRecommendation } from "./sizing-engine/types";
import type { SystemInputDisplay } from "./proposal-html";

const PROPOSAL_SESSION_KEY = "aquaspec-proposal-session";

export interface ProposalSessionPayload {
  hatcheryName: string;
  includeBudgetary: boolean;
  recommendation: HatcheryRecommendation;
  inputs: SystemInputDisplay[];
}

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function saveProposalSession(payload: ProposalSessionPayload): void {
  if (!canUseSessionStorage()) return;
  sessionStorage.setItem(PROPOSAL_SESSION_KEY, JSON.stringify(payload));
}

export function loadProposalSession(): ProposalSessionPayload | null {
  if (!canUseSessionStorage()) return null;

  try {
    const rawPayload = sessionStorage.getItem(PROPOSAL_SESSION_KEY);
    return rawPayload ? (JSON.parse(rawPayload) as ProposalSessionPayload) : null;
  } catch {
    return null;
  }
}

export function clearProposalSession(): void {
  if (!canUseSessionStorage()) return;
  sessionStorage.removeItem(PROPOSAL_SESSION_KEY);
}
