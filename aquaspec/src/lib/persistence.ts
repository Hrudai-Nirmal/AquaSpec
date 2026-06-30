/**
 * AquaSpec — Client-Side Draft Persistence (IndexedDB)
 *
 * Raw IndexedDB wrapper for auto-saving in-progress wizard form data.
 * No external persistence libraries — pure IDB API with Promise-based helpers.
 *
 * Database: aquaspec-drafts
 * Object Store: drafts (keyPath: "id")
 * Single record: { id: "current", ...DraftData }
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DraftSystemData {
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
}

export interface DraftData {
  schemaVersion: number;
  hatcheryName: string;
  mode: "aggregate" | "multi_system";
  activeStep: number;
  activeSystemIndex: number;
  systems: DraftSystemData[];
}

// ─── Constants ─────────────────────────────────────────────────────────────

const DB_NAME = "aquaspec-drafts";
const DB_VERSION = 1;
const STORE_NAME = "drafts";
const DRAFT_KEY = "current";

// ─── SSR Gate ──────────────────────────────────────────────────────────────

const isBrowser = typeof window !== "undefined";

// ─── Internal: open database (promisified) ─────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  if (!isBrowser) {
    return Promise.reject(new Error("IndexedDB is not available during SSR"));
  }

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Save the current draft to IndexedDB.
 * No-op on the server (SSR-safe).
 */
export async function saveDraft(data: DraftData): Promise<void> {
  if (!isBrowser) return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: DRAFT_KEY, ...data });

    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Silently fail — persistence is best-effort
  }
}

/**
 * Load the current draft from IndexedDB.
 * Returns null if no draft exists, schema version doesn't match,
 * or running on the server (SSR-safe).
 */
export async function loadDraft(): Promise<DraftData | null> {
  if (!isBrowser) return null;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(DRAFT_KEY);

    return new Promise<DraftData | null>((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }
        // Check schema version matches before returning
        if (result.schemaVersion !== 1) {
          // Stale schema — silently ignore, don't delete
          resolve(null);
          return;
        }
        resolve(result as DraftData);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch {
    return null; // Silently fail — best-effort
  }
}

/**
 * Delete the current draft from IndexedDB.
 * No-op on the server (SSR-safe).
 */
export async function clearDraft(): Promise<void> {
  if (!isBrowser) return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(DRAFT_KEY);

    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Silently fail
  }
}
