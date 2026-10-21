import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAppSelector } from "@/app/hooks";
import { FullPageSpinner } from "@/components/common/states";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tablewise POS — Restaurant point of sale" },
      { name: "description", content: "Sign in to run POS, kitchen display, tables and orders across your restaurants." },
      { property: "og:title", content: "Tablewise POS" },
      { property: "og:description", content: "Multi-restaurant point of sale with a live kitchen display." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { hydrated, userId } = useAppSelector((s) => s.session);
  useEffect(() => {
    if (!hydrated) return;
    navigate({ to: userId ? "/workspace/select" : "/login", replace: true });
  }, [hydrated, userId, navigate]);
  return <FullPageSpinner />;
}
