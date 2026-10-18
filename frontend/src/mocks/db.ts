import { readJson, removeKey, storageKey, writeJson } from "@/lib/persistence";
import { buildTenantSeed, DB_VERSION, type TenantDb } from "./seed";
import { buildBackoffice } from "./seed-backoffice";
import { buildPeople } from "./seed-people";
import { buildStage4 } from "./seed-stage4";

// In-memory, per-tenant mock database. Each tenant's data lives in its own
// storage key, so one restaurant can never read another's records.
const cache = new Map<string, TenantDb>();

export function tenantDb(tenantId: string): TenantDb {
  const hit = cache.get(tenantId);
  if (hit) return hit;
  const stored = readJson<TenantDb>(storageKey("db", tenantId));
  let db: TenantDb;
  if (stored && stored.version === DB_VERSION) db = stored;
  else if (stored && (stored.version === 1 || stored.version === 2 || stored.version === 3)) {
    // Migrate older data in steps, keeping every existing order and stock record.
    let next: any = stored;
    if (next.version === 1) {
      // v1 -> v2: add back-office collections.
      const branchIds = [...new Set(next.ingredients.map((i: any) => i.branchId))];
      next = { ...buildBackoffice(tenantId, next.menuItems, next.ingredients, branchIds as string[]), ...next, version: 2 };
    }
    if (next.version === 2) {
      // v2 -> v3: add people & money collections; orders gain refunds + delivery.
      for (const o of next.orders) {
        o.refunds ??= [];
        o.refunded ??= 0;
        o.delivery ??= null;
      }
      next = { ...buildPeople(tenantId, next.orders), ...next, version: 3 };
    }
    if (next.version === 3) {
      // v3 -> v4: add stage 4 reports, audit logs, integrations, and tenant settings.
      const stage4 = buildStage4(tenantId);
      next = { ...next, ...stage4, version: DB_VERSION };
    }
    db = next as TenantDb;
  } else db = buildTenantSeed(tenantId);

  // Guarantee Stage 4 data and notifications exist even if an existing cache was loaded
  if (db) {
    db.notifications ??= [];
    if (!db.notifications.length) {
      const prefix = tenantId.replace(/^t_/, "").slice(0, 3);
      db.notifications = [
        {
          id: `${prefix}_n1`,
          tenantId,
          title: "Low stock",
          body: "Some ingredients are below reorder level.",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          read: false,
        },
        {
          id: `${prefix}_n2`,
          tenantId,
          title: "Welcome",
          body: `Restaurant workspace is ready (demo data).`,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          read: true,
        },
      ];
    }
    const stage4Defaults = buildStage4(tenantId);
    db.auditLogs ??= stage4Defaults.auditLogs;
    db.integrations ??= stage4Defaults.integrations;
    if (stage4Defaults.tenantSettings) {
      db.tenantSettings ??= stage4Defaults.tenantSettings;
    }
  }

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
