import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches notifications and settings routes for tenant workspace", () => {
    const router = createRouter({ routeTree });

    const notificationMatches = router.matchRoutes("/app/saffron-ember/notifications");
    expect(notificationMatches.at(-1)?.routeId).toBe("/app/$tenantSlug/notifications");

    const settingsMatches = router.matchRoutes("/app/saffron-ember/settings");
    expect(settingsMatches.at(-1)?.routeId).toBe("/app/$tenantSlug/settings");

    const reportsMatches = router.matchRoutes("/app/saffron-ember/reports");
    expect(reportsMatches.at(-1)?.routeId).toBe("/app/$tenantSlug/reports");

    const auditMatches = router.matchRoutes("/app/saffron-ember/audit-logs");
    expect(auditMatches.at(-1)?.routeId).toBe("/app/$tenantSlug/audit-logs");

    const teamMatches = router.matchRoutes("/app/saffron-ember/team");
    console.log("teamMatches:", teamMatches.map((m) => m.routeId));

    const rolesMatches = router.matchRoutes("/app/saffron-ember/team/roles");
    console.log("rolesMatches:", rolesMatches.map((m) => m.routeId));

    const rootTeamMatches = router.matchRoutes("/team");
    console.log("rootTeamMatches:", rootTeamMatches.map((m) => m.routeId));
  });
});
