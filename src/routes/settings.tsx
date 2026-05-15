import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/ui-kit";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Settings — Intellipath" }] }),
  component: () => <AppLayout><Settings /></AppLayout>,
});

function Settings() {
  const { theme, toggle } = useTheme();
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account, preferences and notifications." />

      <div className="space-y-6">
        <Section title="Account">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name"><Input defaultValue="Ada Eze" /></Field>
            <Field label="Email"><Input defaultValue="ada.eze@example.com" /></Field>
          </div>
        </Section>

        <Section title="Appearance">
          <Row label="Dark mode" hint="Use a darker color scheme.">
            <Switch checked={theme === "dark"} onCheckedChange={toggle} />
          </Row>
        </Section>

        <Section title="Notifications">
          <Row label="Email notifications" hint="Get updates by email.">
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
          </Row>
          <Row label="Push notifications" hint="Browser push alerts.">
            <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
          </Row>
        </Section>

        <div className="flex justify-end">
          <Button className="bg-gradient-primary" onClick={() => toast.success("Settings saved")}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      <h3 className="mb-4 font-display text-lg font-semibold">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div><p className="text-sm font-medium">{label}</p>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
      {children}
    </div>
  );
}
