import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useAppSettings } from "@/hooks/use-app-settings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/archigen/generator";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ArchiGen AI" },
      {
        name: "description",
        content: "Manage your ArchiGen AI profile, defaults and notification preferences.",
      },
      { property: "og:title", content: "Settings — ArchiGen AI" },
      { property: "og:description", content: "Profile, generation defaults and notifications." },
    ],
  }),
  component: SettingsPage,
});

type SettingRow = {
  id: "hires" | "watermark" | "autosave";
  label: string;
  hint: string;
};

const generationDefaults: SettingRow[] = [
  {
    id: "hires",
    label: "High-resolution output",
    hint: "Uses 1 extra credit per render.",
  },
  {
    id: "watermark",
    label: "Add conceptual watermark",
    hint: "Recommended for shared links.",
  },
  {
    id: "autosave",
    label: "Auto-save every generation",
    hint: "Saves results into the active project.",
  },
];

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { settings, updateSetting } = useAppSettings();

  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setFullName(profile.full_name ?? "");
  }, [profile]);

  async function saveProfile() {
    if (!profile) return;
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.error("Full name cannot be empty", {
        description: "Please enter your first and last name.",
      });
      return;
    }
    if (trimmed.length < 2) {
      toast.error("Full name is too short", {
        description: "Full name must be at least 2 characters long.",
      });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: trimmed })
      .eq("id", profile.id);
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile saved");
  }

  const isNameEmpty = !fullName.trim();
  const isUnchanged = fullName.trim() === (profile?.full_name ?? "").trim();

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Profile, defaults and notifications."
      />

      <div className="grid max-w-2xl gap-6">
        <section className="surface-panel p-6">
          <h2 className="text-base font-semibold">Profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className={isNameEmpty ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {isNameEmpty && (
                <p className="text-[11px] text-destructive font-medium">
                  Name cannot be empty
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email ?? ""}
                readOnly
                disabled
                className="bg-muted/40"
              />
            </div>
          </div>
          <Button
            className="mt-5"
            onClick={saveProfile}
            disabled={saving || !profile || isNameEmpty || isUnchanged}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </section>

        <section className="surface-panel p-6">
          <h2 className="text-base font-semibold">Generation defaults</h2>
          <Separator className="my-4" />
          <div className="divide-y divide-border/60">
            {generationDefaults.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-6 py-3">
                <div>
                  <Label htmlFor={`setting-${row.id}`} className="text-sm font-medium cursor-pointer">
                    {row.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{row.hint}</p>
                </div>
                <Switch
                  id={`setting-${row.id}`}
                  checked={settings[row.id]}
                  onCheckedChange={(checked) => {
                    updateSetting(row.id, checked);
                    toast.success(`${row.label} ${checked ? "enabled" : "disabled"}`);
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="surface-panel p-6">
          <h2 className="text-base font-semibold">Notifications</h2>
          <Separator className="my-4" />
          <div className="flex items-center justify-between gap-6 py-3">
            <div>
              <Label htmlFor="setting-lowcredit" className="text-sm font-medium cursor-pointer">
                Low credit alerts
              </Label>
              <p className="text-xs text-muted-foreground">
                Email me when the balance drops below 20 credits.
              </p>
            </div>
            <Switch
              id="setting-lowcredit"
              checked={settings.lowCreditAlerts}
              onCheckedChange={(checked) => {
                updateSetting("lowCreditAlerts", checked);
                toast.success(`Low credit alerts ${checked ? "enabled" : "disabled"}`);
              }}
            />
          </div>
        </section>
      </div>
    </>
  );
}
