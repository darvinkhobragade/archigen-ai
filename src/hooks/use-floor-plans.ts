import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { PlanRoom } from "@/lib/archigen.functions";

export type SavedPlan = {
  id: string;
  prompt: string | null;
  rooms: PlanRoom[];
  settings: {
    bhk?: number;
    plot?: string;
    render2d_url?: string | null;
    render3d_url?: string | null;
    style3D?: string;
    materialPalette?: string;
  };
  image_path?: string | null;
  created_at: string;
};

export function useFloorPlans() {
  return useQuery({
    queryKey: ["floor-plans"],
    queryFn: async (): Promise<SavedPlan[]> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("generations")
        .select("id, prompt, plan_data, settings, image_path, created_at")
        .eq("tool", "floor-plan")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        prompt: row.prompt,
        rooms: (Array.isArray(row.plan_data) ? row.plan_data : []) as unknown as PlanRoom[],
        settings: (row.settings ?? {}) as {
          bhk?: number;
          plot?: string;
          render2d_url?: string | null;
          render3d_url?: string | null;
          style3D?: string;
          materialPalette?: string;
        },
        image_path: row.image_path,
        created_at: row.created_at,
      }));
    },
    staleTime: 15_000,
  });
}

export function useSaveFloorPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string | null | undefined;
      projectId?: string | null | undefined;
      name: string;
      rooms: PlanRoom[];
      settings?: {
        bhk?: number | undefined;
        plot?: string | undefined;
        render2d_url?: string | null | undefined;
        render3d_url?: string | null | undefined;
        style3D?: string | undefined;
        materialPalette?: string | undefined;
      } | undefined;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("You need to be signed in to save plans.");

      let targetProjectId = input.projectId;
      if (!targetProjectId) {
        // Find existing floor plan project or auto-create one
        const { data: existingProjects } = await supabase
          .from("projects")
          .select("id")
          .eq("type", "Floor Plan")
          .order("updated_at", { ascending: false })
          .limit(1);

        if (existingProjects && existingProjects.length > 0) {
          targetProjectId = existingProjects[0]!.id;
        } else {
          const { data: newProj } = await supabase
            .from("projects")
            .insert({
              user_id: user.id,
              title: input.name || "Floor Plan Project",
              type: "Floor Plan",
              description: `Floor plan layout (${input.settings?.plot ?? "Custom"})`,
              cover_url: input.settings?.render3d_url || input.settings?.render2d_url || null,
            })
            .select("id")
            .single();
          targetProjectId = newProj?.id ?? null;
        }
      }

      if (input.id) {
        const { error } = await supabase
          .from("generations")
          .update({
            prompt: input.name,
            project_id: targetProjectId,
            plan_data: input.rooms as never,
            ...(input.settings ? { settings: input.settings as never } : {}),
          })
          .eq("id", input.id);
        if (error) throw error;

        if (targetProjectId) {
          const cover = input.settings?.render3d_url || input.settings?.render2d_url;
          const patch: { updated_at: string; cover_url?: string } = {
            updated_at: new Date().toISOString(),
          };
          if (cover) {
            patch.cover_url = cover;
          }
          await supabase.from("projects").update(patch).eq("id", targetProjectId);
        }
        return input.id;
      }

      const { data, error } = await supabase
        .from("generations")
        .insert({
          user_id: user.id,
          project_id: targetProjectId ?? null,
          tool: "floor-plan",
          prompt: input.name,
          plan_data: input.rooms as never,
          settings: (input.settings ?? {}) as never,
          credits_spent: 0,
          status: "complete",
        })
        .select("id")
        .single();
      if (error) throw error;

      if (targetProjectId) {
        const cover = input.settings?.render3d_url || input.settings?.render2d_url;
        const patch: { updated_at: string; cover_url?: string } = {
          updated_at: new Date().toISOString(),
        };
        if (cover) {
          patch.cover_url = cover;
        }
        await supabase.from("projects").update(patch).eq("id", targetProjectId);
      }

      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floor-plans"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-generations"] });
      queryClient.invalidateQueries({ queryKey: ["all-generations"] });
      queryClient.invalidateQueries({ queryKey: ["total-generations-count"] });
      toast.success("Floor plan saved to project");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteFloorPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("generations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floor-plans"] });
      toast.success("Plan deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
