import { useId, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Label + control wrapper; the render prop receives the generated input id. */
export function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Parses a decimal input; returns NaN for blanks. */
export const num = (v: string) => (v.trim() === "" ? NaN : Number(v));
