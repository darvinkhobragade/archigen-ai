import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { PlanRoom } from "@/lib/archigen.functions";

export type SavedPlan = {
  id: string;
  prompt: string | null;
  rooms: PlanRoom[];
  settings: { bhk?: number; plot?: string };
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
        .select("id, prompt, plan_data, settings, created_at")
        .eq("tool", "floor-plan")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        prompt: row.prompt,
        rooms: (Array.isArray(row.plan_data) ? row.plan_data : []) as unknown as PlanRoom[],
        settings: (row.settings ?? {}) as { bhk?: number; plot?: string },
        created_at: row.created_at,
      }));
    },
    staleTime: 15_000,
  });
}

export function useSaveFloorPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string | null; name: string; rooms: PlanRoom[] }) => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("You need to be signed in to save plans.");

      if (input.id) {
        const { error } = await supabase
          .from("generations")
          .update({ prompt: input.name, plan_data: input.rooms as never })
          .eq("id", input.id);
        if (error) throw error;
        return input.id;
      }

      const { data, error } = await supabase
        .from("generations")
        .insert({
          user_id: user.id,
          tool: "floor-plan",
          prompt: input.name,
          plan_data: input.rooms as never,
          credits_spent: 0,
          status: "complete",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floor-plans"] });
      toast.success("Floor plan saved");
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
