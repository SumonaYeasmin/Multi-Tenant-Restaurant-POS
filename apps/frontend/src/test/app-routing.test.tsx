import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
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
  });
});
