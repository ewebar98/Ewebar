import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/ui-kit";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateProfile } from "@/services/api";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Settings | WeBAR" }] }),
  component: () => <AppLayout><Settings /></AppLayout>,
});

function Settings() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state seeded from real auth user
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account, preferences and notifications." />

      <div className="space-y-6">
        <Section title="Account">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </Field>
            <Field label="Email">
              <Input
                value={email}
                readOnly
                className="bg-muted cursor-not-allowed"
                title="Email cannot be changed"
              />
            </Field>
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
          <Button className="bg-gradient-primary gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save changes"}
          </Button>
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
