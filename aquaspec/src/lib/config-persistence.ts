/**
 * AquaSpec — Saved Configuration Persistence (IndexedDB)
 *
 * Raw IndexedDB wrapper for managing named, permanent hatchery configuration
 * snapshots. No external persistence libraries — pure IDB API with
 * Promise-based helpers.
 *
 * Database: aquaspec-configs
 * Object Store: configs (keyPath: "id")
 */

import type { HatcheryInput, HatcheryRecommendation } from "./sizing-engine/types";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ConfigRecord {
  id: string; // UUID
  name: string;
  savedAt: string; // ISO 8601 timestamp
  input: HatcheryInput;
  recommendation: HatcheryRecommendation;
  rulesVersionAtSave: string;
  includeBudgetaryEstimate: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const DB_NAME = "aquaspec-configs";
const DB_VERSION = 1;
const STORE_NAME = "configs";

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
 * Save a configuration to IndexedDB.
 * Uses put() so it overwrites if the same id already exists.
 * No-op on the server (SSR-safe).
 */
export async function saveConfig(config: ConfigRecord): Promise<void> {
  if (!isBrowser) return;

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.put(config);

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
}

/**
 * Load a single configuration by id.
 * Returns null if not found, or on the server (SSR-safe).
 */
export async function loadConfig(id: string): Promise<ConfigRecord | null> {
  if (!isBrowser) return null;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    return new Promise<ConfigRecord | null>((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        const result = request.result;
        resolve(result ? (result as ConfigRecord) : null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch {
    return null;
  }
}

/**
 * List all saved configurations, sorted by savedAt descending (newest first).
 * Returns [] on the server (SSR-safe).
 */
export async function listConfigs(): Promise<ConfigRecord[]> {
  if (!isBrowser) return [];

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise<ConfigRecord[]>((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        const results = request.result as ConfigRecord[];
        // Sort by savedAt descending (newest first)
        results.sort(
          (a, b) =>
            new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        );
        resolve(results);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch {
    return [];
  }
}

/**
 * Delete a configuration by id.
 * No-op on the server (SSR-safe).
 */
export async function deleteConfig(id: string): Promise<void> {
  if (!isBrowser) return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);

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
