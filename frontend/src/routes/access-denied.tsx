import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/access-denied")({
  head: () => ({
    meta: [
      { title: "Access denied — Tablewise POS" },
      { name: "description", content: "You don't have access to this restaurant." },
      { property: "og:title", content: "Access denied — Tablewise POS" },
      { property: "og:description", content: "You don't have access to this restaurant." },
    ],
  }),
  component: AccessDenied,
});

function AccessDenied() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <ShieldOff className="mb-4 size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Your account isn't a member of this restaurant, or your role can't open this page.
      </p>
      <Button asChild className="mt-6">
        <Link to="/workspace/select">Choose a restaurant</Link>
      </Button>
    </div>
  );
}
