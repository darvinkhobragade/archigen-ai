import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { images } from "@/lib/archigen-data";

export type ProjectType = "Architecture" | "Interior" | "Redesign" | "Floor Plan";

export type ProjectRow = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  cover_url: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export const projectTypes: ProjectType[] = ["Architecture", "Interior", "Redesign", "Floor Plan"];

export function coverFor(project: Pick<ProjectRow, "type" | "cover_url">) {
  if (project.cover_url) return project.cover_url;
  switch (project.type) {
    case "Interior":
      return images.sampleInterior;
    case "Floor Plan":
      return images.samplePlan;
    case "Redesign":
      return images.sampleExterior;
    default:
      return images.heroVilla;
  }
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async (): Promise<ProjectRow[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, type, description, cover_url, is_favorite, created_at, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };
}

export function useCreateProject() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { title: string; type: string; description?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You must be signed in.");

      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: userId,
          title: input.title,
          type: input.type,
          description: input.description ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Project created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProject() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: { id: string } & Partial<
      Pick<ProjectRow, "title" | "type" | "description" | "is_favorite">
    >) => {
      const { error } = await supabase.from("projects").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProject() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Project deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
