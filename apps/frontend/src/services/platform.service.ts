import { ACTIVATIONS, DEMO_PASSWORD, TENANTS, USERS } from "@/mocks/platform";
import { ApiError, latency, tenantDb } from "@/mocks/db";
import { readJson, storageKey, writeJson } from "@/lib/persistence";
import type { Activation, ActivationStatus, Branch, Tenant, User } from "@/types/domain";

// Auth, tenants and branches. Future: POST /auth/login, GET /me, GET /tenants, GET /tenants/:id/branches

export async function login(email: string, password: string): Promise<User> {
  await latency(300, 600);
  const user = USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || password !== DEMO_PASSWORD) throw new ApiError(401, "Invalid email or password.");
  return user;
}

export async function getUser(userId: string): Promise<User> {
  await latency(50, 120);
  const user = USERS.find((u) => u.id === userId);
  if (!user) throw new ApiError(401, "Session expired.");
  return user;
}

export async function requestPasswordReset(email: string): Promise<{ ok: true }> {
  await latency(400, 700);
  void email;
  return { ok: true };
}

export async function listTenantsForUser(userId: string): Promise<Tenant[]> {
  await latency(80, 200);
  const user = USERS.find((u) => u.id === userId);
  if (!user) throw new ApiError(401, "Session expired.");
  return TENANTS.filter((t) => user.memberships.some((m) => m.tenantId === t.id));
}

export async function listBranches(tenantId: string, userId: string): Promise<Branch[]> {
  await latency(60, 150);
  const user = USERS.find((u) => u.id === userId);
  const m = user?.memberships.find((x) => x.tenantId === tenantId);
  if (!m) throw new ApiError(403, "No access to this restaurant.");
  return tenantDb(tenantId).branches.filter((b) => (m.branchIds === "all" || m.branchIds.includes(b.id)));
}

// ---- External subscription activation (integration abstraction) ----
// The real implementation will call the separate subscription application.
// Frontend only reads status; it never sells or manages subscriptions.

export interface ActivationProvider {
  check(tenantId: string): Promise<Activation>;
}

const overrideKey = storageKey("activation-simulation");

export const mockActivationProvider: ActivationProvider = {
  async check(tenantId) {
    await latency(100, 250);
    const base = ACTIVATIONS[tenantId];
    if (!base) throw new ApiError(404, "Unknown restaurant.");
    const overrides = readJson<Record<string, ActivationStatus>>(overrideKey) ?? {};
    const status = overrides[tenantId] ?? base.status;
    const message =
      status === base.status
        ? base.message
        : status === "active"
          ? "Access active (simulated)."
          : status === "grace"
            ? "Access is in a grace period (simulated)."
            : "Access is not active (simulated).";
    return { ...base, status, message, checkedAt: new Date().toISOString() };
  },
};

/** Demo-only: lets testers flip a tenant's simulated activation status. */
export function simulateActivation(tenantId: string, status: ActivationStatus) {
  const overrides = readJson<Record<string, ActivationStatus>>(overrideKey) ?? {};
  overrides[tenantId] = status;
  writeJson(overrideKey, overrides);
}

export const getTenantBySlug = (slug: string) => TENANTS.find((t) => t.slug === slug) ?? null;
