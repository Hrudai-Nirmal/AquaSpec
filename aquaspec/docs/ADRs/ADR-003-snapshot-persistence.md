# ADR-003: Saved Configuration as Full Snapshot with Version-Aware Change Detection

**Date:** 2026-06-30
**Status:** Accepted

## Context
Hatchery configurations must be saveable and reopenable. The rules file can change over time (new models, updated coefficients), which means recomputing a saved config could produce different results than when it was originally created.

## Decision
1. Saved configs store the **complete snapshot** — all inputs AND all computed results.
2. On reopen, the system displays the **saved results as-is** and does NOT auto-recompute.
3. The system detects rules file version changes by comparing the snapshot's stored version identifier against the current rules file.
4. On version mismatch, a notification banner alerts the user, who can manually trigger recomputation.

## Consequences
- **Positive:** Sales quotes remain faithful to what was originally presented. No surprises when reopening a 6-month-old config. Clear audit trail.
- **Negative:** Stale results could be presented to customers if the user ignores the version-change notification. The system cannot force recomputation.
- **Mitigation:** The notification banner should be prominent and persistent (not dismissible without action). Future enhancement: expiration/validity period on saved configs.
