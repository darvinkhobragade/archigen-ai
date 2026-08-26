import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
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
  generations_count?: number;
  latest_image_url?: string | null;
};

export type GenerationRow = {
  id: string;
  user_id: string;
  project_id: string | null;
  tool: "architecture" | "interior" | "redesign" | "floor-plan" | string;
  prompt: string | null;
  image_path: string | null;
  image_url?: string | null;
  plan_data: unknown;
  settings: Record<string, unknown>;
  status: string;
  credits_spent: number;
  is_favorite: boolean;
  created_at: string;
  project?: {
    id: string;
    title: string;
    type: string;
  } | null;
};

export const projectTypes: ProjectType[] = ["Architecture", "Interior", "Redesign", "Floor Plan"];

export function mapToolToProjectType(tool: string): ProjectType {
  switch (tool.toLowerCase()) {
    case "interior":
      return "Interior";
    case "redesign":
      return "Redesign";
    case "floor-plan":
    case "floor_plan":
      return "Floor Plan";
    case "architecture":
    default:
      return "Architecture";
  }
}

export function coverFor(project: Pick<ProjectRow, "type" | "cover_url" | "latest_image_url">) {
  if (project.cover_url && (project.cover_url.startsWith("http") || project.cover_url.startsWith("data:"))) {
    return project.cover_url;
  }
  if (project.latest_image_url) {
    return project.latest_image_url;
  }
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

/** Active Project state management with localStorage sync */
const ACTIVE_PROJECT_KEY = "archigen_active_project_id";
let activeProjectId: string | null = null;
const activeProjectListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  activeProjectId = window.localStorage.getItem(ACTIVE_PROJECT_KEY);
  window.addEventListener("storage", (e) => {
    if (e.key === ACTIVE_PROJECT_KEY) {
      activeProjectId = e.newValue;
      activeProjectListeners.forEach((fn) => fn());
    }
  });
}

function subscribeActiveProject(cb: () => void) {
  activeProjectListeners.add(cb);
  return () => activeProjectListeners.delete(cb);
}

export function useActiveProject() {
  const id = useSyncExternalStore(
    subscribeActiveProject,
    () => activeProjectId,
    () => null,
  );

  const setActiveProject = useCallback((newId: string | null) => {
    activeProjectId = newId;
    if (typeof window !== "undefined") {
      if (newId) {
        window.localStorage.setItem(ACTIVE_PROJECT_KEY, newId);
      } else {
        window.localStorage.removeItem(ACTIVE_PROJECT_KEY);
      }
    }
    activeProjectListeners.forEach((fn) => fn());
  }, []);

  return { activeProjectId: id, setActiveProject };
}

/** Helper to sign storage image paths */
async function signPaths(paths: string[]): Promise<Map<string, string>> {
  const cleanPaths = Array.from(new Set(paths.filter((p) => p && !p.startsWith("http") && !p.startsWith("data:"))));
  const map = new Map<string, string>();
  if (cleanPaths.length === 0) return map;

  try {
    const { data } = await supabase.storage.from("renders").createSignedUrls(cleanPaths, 60 * 60 * 24 * 7);
    data?.forEach((item) => {
      if (item.signedUrl && item.path) {
        map.set(item.path, item.signedUrl);
      }
    });
  } catch (err) {
    console.warn("Failed to sign storage paths", err);
  }
  return map;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async (): Promise<ProjectRow[]> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data: projectsData, error } = await supabase
        .from("projects")
        .select("id, title, type, description, cover_url, is_favorite, created_at, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      if (!projectsData || projectsData.length === 0) return [];

      // Fetch generations to calculate asset counts and fallback covers
      const { data: genData } = await supabase
        .from("generations")
        .select("id, project_id, image_path, created_at")
        .order("created_at", { ascending: false });

      const countMap = new Map<string, number>();
      const latestImageMap = new Map<string, string>();
      const pathsToSign: string[] = [];

      projectsData.forEach((p) => {
        if (p.cover_url && !p.cover_url.startsWith("http")) {
          pathsToSign.push(p.cover_url);
        }
      });

      genData?.forEach((g) => {
        if (g.project_id) {
          countMap.set(g.project_id, (countMap.get(g.project_id) ?? 0) + 1);
          if (g.image_path && !latestImageMap.has(g.project_id)) {
            latestImageMap.set(g.project_id, g.image_path);
            pathsToSign.push(g.image_path);
          }
        }
      });

      const signedMap = await signPaths(pathsToSign);

      return projectsData.map((p) => {
        let resolvedCover = p.cover_url;
        if (p.cover_url && signedMap.has(p.cover_url)) {
          resolvedCover = signedMap.get(p.cover_url) ?? p.cover_url;
        }
        const rawLatestPath = latestImageMap.get(p.id);
        const resolvedLatest = rawLatestPath ? signedMap.get(rawLatestPath) ?? null : null;

        return {
          ...p,
          cover_url: resolvedCover,
          generations_count: countMap.get(p.id) ?? 0,
          latest_image_url: resolvedLatest,
        };
      });
    },
  });
}

export function useProjectGenerations(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ["project-generations", projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<GenerationRow[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("generations")
        .select("id, user_id, project_id, tool, prompt, image_path, plan_data, settings, status, credits_spent, is_favorite, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const paths = data.map((d) => d.image_path).filter((p): p is string => Boolean(p));
      const signedMap = await signPaths(paths);

      return data.map((row) => ({
        ...row,
        settings: (row.settings ?? {}) as Record<string, unknown>,
        image_url: row.image_path ? signedMap.get(row.image_path) ?? row.image_path : null,
      }));
    },
  });
}

export function useAllGenerations() {
  return useQuery({
    queryKey: ["all-generations"],
    queryFn: async (): Promise<GenerationRow[]> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data: genData, error } = await supabase
        .from("generations")
        .select("id, user_id, project_id, tool, prompt, image_path, plan_data, settings, status, credits_spent, is_favorite, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!genData || genData.length === 0) return [];

      const { data: projData } = await supabase
        .from("projects")
        .select("id, title, type");

      const projMap = new Map<string, { id: string; title: string; type: string }>();
      projData?.forEach((p) => projMap.set(p.id, p));

      const paths = genData.map((d) => d.image_path).filter((p): p is string => Boolean(p));
      const signedMap = await signPaths(paths);

      return genData.map((row) => ({
        ...row,
        settings: (row.settings ?? {}) as Record<string, unknown>,
        image_url: row.image_path ? signedMap.get(row.image_path) ?? row.image_path : null,
        project: row.project_id ? projMap.get(row.project_id) ?? null : null,
      }));
    },
  });
}

export function useTotalGenerationsCount() {
  return useQuery({
    queryKey: ["total-generations-count"],
    queryFn: async (): Promise<number> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return 0;

      const { count, error } = await supabase
        .from("generations")
        .select("*", { count: "exact", head: true });

      if (error) return 0;
      return count ?? 0;
    },
  });
}

function useInvalidateProjects() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["project-generations"] });
    queryClient.invalidateQueries({ queryKey: ["all-generations"] });
    queryClient.invalidateQueries({ queryKey: ["total-generations-count"] });
    queryClient.invalidateQueries({ queryKey: ["floor-plans"] });
  };
}

export function useCreateProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: async (input: { title: string; type: string; description?: string; cover_url?: string }) => {
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
          cover_url: input.cover_url ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      invalidate();
      if (data?.id) {
        activeProjectId = data.id;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(ACTIVE_PROJECT_KEY, data.id);
        }
        activeProjectListeners.forEach((fn) => fn());
      }
      toast.success("Project created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: { id: string } & Partial<
      Pick<ProjectRow, "title" | "type" | "description" | "cover_url" | "is_favorite">
    >) => {
      const { error } = await supabase.from("projects").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProject() {
  const invalidate = useInvalidateProjects();
  const { activeProjectId: currentActive, setActiveProject } = useActiveProject();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      if (currentActive === id) {
        setActiveProject(null);
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("Project deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAssignGenerationToProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: async ({
      generationId,
      projectId,
      setAsCover = false,
      imageUrl,
    }: {
      generationId: string;
      projectId: string | null | undefined;
      setAsCover?: boolean | undefined;
      imageUrl?: string | null | undefined;
    }) => {
      const { error: genError } = await supabase
        .from("generations")
        .update({ project_id: projectId ?? null })
        .eq("id", generationId);

      if (genError) throw genError;

      if (projectId) {
        const projectPatch: { updated_at: string; cover_url?: string } = {
          updated_at: new Date().toISOString(),
        };
        if (setAsCover && imageUrl) {
          projectPatch.cover_url = imageUrl;
        }
        await supabase.from("projects").update(projectPatch).eq("id", projectId);
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("Generation saved to project");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteGeneration() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("generations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Generation deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleGenerationFavorite() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase.from("generations").update({ is_favorite: isFavorite }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });
}
