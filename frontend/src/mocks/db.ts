import { readJson, removeKey, storageKey, writeJson } from "@/lib/persistence";
import { buildTenantSeed, DB_VERSION, type TenantDb } from "./seed";
import { buildBackoffice } from "./seed-backoffice";
import { buildPeople } from "./seed-people";

// In-memory, per-tenant mock database. Each tenant's data lives in its own
// storage key, so one restaurant can never read another's records.
const cache = new Map<string, TenantDb>();

export function tenantDb(tenantId: string): TenantDb {
  const hit = cache.get(tenantId);
  if (hit) return hit;
  const stored = readJson<TenantDb>(storageKey("db", tenantId));
  let db: TenantDb;
  if (stored && stored.version === DB_VERSION) db = stored;
  else if (stored && (stored.version === 1 || stored.version === 2)) {
    // Migrate older data in steps, keeping every existing order and stock record.
    let next = stored;
    if (next.version === 1) {
      // v1 -> v2: add back-office collections.
      const branchIds = [...new Set(next.ingredients.map((i) => i.branchId))];
      next = { ...buildBackoffice(tenantId, next.menuItems, next.ingredients, branchIds), ...next, version: 2 };
    }
    // v2 -> v3: add people & money collections; orders gain refunds + delivery.
    for (const o of next.orders) {
      o.refunds ??= [];
      o.refunded ??= 0;
      o.delivery ??= null;
    }
    db = { ...buildPeople(tenantId, next.orders), ...next, version: DB_VERSION };
  } else db = buildTenantSeed(tenantId);
  cache.set(tenantId, db);
  return db;
}

export function commit(tenantId: string) {
  const db = cache.get(tenantId);
  if (db) writeJson(storageKey("db", tenantId), db);
}

export function resetTenantDb(tenantId: string) {
  cache.delete(tenantId);
  removeKey(storageKey("db", tenantId));
}

export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

/** Simulated network latency. */
export const latency = (min = 120, max = 380) =>
  new Promise<void>((r) => setTimeout(r, min + Math.random() * (max - min)));

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
