import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getCustomRoles,
  getCustomRolesSync,
  saveCustomRole,
  updateCustomRolePermissions,
  deleteCustomRole,
} from "./people.service";

describe("Custom Roles Management (Frontend Service)", () => {
  const tenantSlug = "saffron-ember";

  beforeEach(() => {
    localStorage.clear();
  });

  it("should return empty array when no custom roles exist", () => {
    const roles = getCustomRolesSync(tenantSlug);
    expect(roles).toEqual([]);
  });

  it("should create and retrieve a custom role using local fallback", async () => {
    const roleName = `Sommelier-${Date.now()}`;
    const created = await saveCustomRole(tenantSlug, {
      name: roleName,
      description: "Wine steward",
      color: "rose",
      baseRole: "waiter",
      permissions: ["pos.use", "tables.view"],
    });

    expect(created.name).toBe(roleName);
    expect(created.baseRole).toBe("waiter");
    expect(created.isCustom).toBe(true);

    const list = getCustomRolesSync(tenantSlug);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.some((r) => r.name === roleName)).toBe(true);
  });

  it("should update permissions for an existing custom role", async () => {
    const roleName = `Shift-Lead-${Date.now()}`;
    const created = await saveCustomRole(tenantSlug, {
      name: roleName,
      description: "Supervises cashiers",
      color: "sky",
      baseRole: "cashier",
      permissions: ["pos.use"],
    });

    await updateCustomRolePermissions(tenantSlug, created.id, ["pos.use", "cash.manage", "reports.view"]);

    const list = getCustomRolesSync(tenantSlug);
    const updated = list.find((r) => r.id === created.id);
    expect(updated?.permissions).toEqual(["pos.use", "cash.manage", "reports.view"]);
  });

  it("should delete a custom role", async () => {
    const roleName = `Temp-Helper-${Date.now()}`;
    const created = await saveCustomRole(tenantSlug, {
      name: roleName,
      color: "amber",
      baseRole: "waiter",
      permissions: [],
    });

    const countBefore = getCustomRolesSync(tenantSlug).length;
    expect(countBefore).toBeGreaterThanOrEqual(1);

    await deleteCustomRole(tenantSlug, created.id);

    const countAfter = getCustomRolesSync(tenantSlug).length;
    expect(countAfter).toBe(countBefore - 1);
  });
});
