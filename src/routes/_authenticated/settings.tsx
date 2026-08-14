import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";

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

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setFullName(profile.full_name ?? "");
  }, [profile]);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile saved");
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Profile, defaults and notifications."
      />

      <div className="grid max-w-3xl gap-6">
        <section className="surface-panel p-6">
          <h2 className="text-base font-semibold">Profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profile?.email ?? ""} readOnly disabled />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="studio">Studio / college</Label>
              <Input id="studio" placeholder="Optional" />
            </div>
          </div>
          <Button className="mt-5" onClick={saveProfile} disabled={saving || !profile}>
            Save changes
          </Button>
        </section>

        <section className="surface-panel p-6">
          <h2 className="text-base font-semibold">Generation defaults</h2>
          <Separator className="my-4" />
          {[
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
          ].map((row, i) => (
            <div key={row.id} className="flex items-center justify-between gap-6 py-3">
              <div>
                <p className="text-sm font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.hint}</p>
              </div>
              <Switch defaultChecked={i !== 0} />
            </div>
          ))}
        </section>

        <section className="surface-panel p-6">
          <h2 className="text-base font-semibold">Notifications</h2>
          <Separator className="my-4" />
          <div className="flex items-center justify-between gap-6 py-3">
            <div>
              <p className="text-sm font-medium">Low credit alerts</p>
              <p className="text-xs text-muted-foreground">
                Email me when the balance drops below 20 credits.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </section>
      </div>
    </>
  );
}
