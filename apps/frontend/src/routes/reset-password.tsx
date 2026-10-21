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

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Tablewise POS" },
      { name: "description", content: "Choose a new password for your account." },
      { property: "og:title", content: "Set a new password — Tablewise POS" },
      { property: "og:description", content: "Choose a new password for your account." },
    ],
  }),
  component: ResetPage,
});

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

function ResetPage() {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });
  const e = form.formState.errors;
  return (
    <AuthLayout title="Set a new password">
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit(() => {
          toast.success("Password updated (demo). Sign in with the demo password.");
          navigate({ to: "/login" });
        })}
      >
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" {...form.register("password")} />
          {e.password && <p className="text-xs text-destructive">{e.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" {...form.register("confirm")} />
          {e.confirm && <p className="text-xs text-destructive">{e.confirm.message}</p>}
        </div>
        <Button type="submit" className="w-full">Update password</Button>
        <MockNotice>Passwords are not stored. Demo accounts keep their demo password.</MockNotice>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="text-muted-foreground underline-offset-4 hover:underline">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
