import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MockNotice } from "@/components/common/states";

export const Route = createFileRoute("/invite")({
  head: () => ({
    meta: [
      { title: "Accept invitation — Tablewise POS" },
      { name: "description", content: "Join your restaurant team on Tablewise POS." },
      { property: "og:title", content: "Accept invitation — Tablewise POS" },
      { property: "og:description", content: "Join your restaurant team on Tablewise POS." },
    ],
  }),
  component: InvitePage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  password: z.string().min(8, "At least 8 characters"),
});

function InvitePage() {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { name: "", password: "" } });
  const e = form.formState.errors;
  return (
    <AuthLayout title="You're invited" subtitle="Saffron & Ember invited you to join as Cashier at the Gulshan branch.">
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit((v) => {
          toast.success(`Welcome aboard, ${v.name}! (demo — sign in with a demo account)`);
          navigate({ to: "/login" });
        })}
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" {...form.register("name")} />
          {e.name && <p className="text-xs text-destructive">{e.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Create password</Label>
          <Input id="password" type="password" {...form.register("password")} />
          {e.password && <p className="text-xs text-destructive">{e.password.message}</p>}
        </div>
        <Button type="submit" className="w-full">Accept invitation</Button>
        <MockNotice>This invitation is simulated; no account is created.</MockNotice>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="text-muted-foreground underline-offset-4 hover:underline">I already have an account</Link>
      </p>
    </AuthLayout>
  );
}
