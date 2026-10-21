import type { ReactNode } from "react";
import { UtensilsCrossed } from "lucide-react";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <main className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex size-8 items-center justify-center rounded-md bg-foreground text-background">
              <UtensilsCrossed className="size-4" aria-hidden />
            </span>
            Tablewise POS
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
      <aside className="relative hidden overflow-hidden border-l bg-sidebar lg:block" aria-hidden>
        <div className="absolute inset-0 grid grid-cols-6 gap-3 p-10 opacity-80">
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              className={
                i % 7 === 0
                  ? "rounded-full border-2 border-primary/50 bg-primary-soft"
                  : i % 5 === 0
                    ? "rounded-lg border bg-card"
                    : "rounded-lg border border-dashed"
              }
            />
          ))}
        </div>
        <div className="absolute inset-x-10 bottom-10 rounded-xl border bg-card p-6 shadow-sm">
          <p className="font-display text-xl font-bold">Every table, ticket and till — per restaurant.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Multi-restaurant, multi-branch point of sale with a live kitchen display.
          </p>
        </div>
      </aside>
    </div>
  );
}
