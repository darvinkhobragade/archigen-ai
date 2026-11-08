import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  askAssistant,
  enhancePromptServer,
  generateDesign,
  generateFloorPlan,
  render2DColorFloorPlan,
  render3DFloorPlan,
  type GenerateInput,
  type PlanRoom,
} from "@/lib/archigen.functions";
import { QK } from "@/lib/query-keys";

/** Invalidates all generation-related caches after a successful generation */
function useInvalidateAfterGeneration() {
  const queryClient = useQueryClient();
  return () => {
    // Force fresh profile fetch (fixes multi-tab credit race condition)
    queryClient.invalidateQueries({ queryKey: QK.profile() });
    queryClient.refetchQueries({ queryKey: QK.profile() });
    queryClient.invalidateQueries({ queryKey: QK.creditHistory() });
    queryClient.invalidateQueries({ queryKey: QK.projects() });
    queryClient.invalidateQueries({ queryKey: QK.projectGenerations() });
    queryClient.invalidateQueries({ queryKey: QK.allGenerations() });
    queryClient.invalidateQueries({ queryKey: QK.totalGenerationsCount() });
  };
}

export function useGenerateDesign() {
  const run = useServerFn(generateDesign);
  const invalidate = useInvalidateAfterGeneration();
  return useMutation({
    mutationFn: (input: GenerateInput) => run({ data: input }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useEnhancePrompt() {
  const run = useServerFn(enhancePromptServer);
  return useMutation({
    mutationFn: (input: { brief: string; tool: string }) => run({ data: input }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGenerateFloorPlan() {
  const queryClient = useQueryClient();
  const run = useServerFn(generateFloorPlan);
  const invalidate = useInvalidateAfterGeneration();
  return useMutation({
    mutationFn: (input: {
      brief: string;
      bhk: number;
      plot: string;
      builtUpArea?: string | number | undefined;
      facing?: string | undefined;
      projectId?: string | null | undefined;
    }) => run({ data: input }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: QK.floorPlans() });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRender2DColorFloorPlan() {
  const queryClient = useQueryClient();
  const run = useServerFn(render2DColorFloorPlan);
  const invalidate = useInvalidateAfterGeneration();
  return useMutation({
    mutationFn: (input: {
      rooms: PlanRoom[];
      bhk: number;
      plot: string;
      stylePreset?: string | undefined;
      projectId?: string | null | undefined;
    }) => run({ data: input }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: QK.floorPlans() });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRender3DFloorPlan() {
  const queryClient = useQueryClient();
  const run = useServerFn(render3DFloorPlan);
  const invalidate = useInvalidateAfterGeneration();
  return useMutation({
    mutationFn: (input: {
      rooms: PlanRoom[];
      bhk: number;
      plot: string;
      stylePreset?: string | undefined;
      projectId?: string | null | undefined;
    }) => run({ data: input }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: QK.floorPlans() });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAskAssistant() {
  const queryClient = useQueryClient();
  const run = useServerFn(askAssistant);
  return useMutation({
    mutationFn: (messages: { role: "user" | "assistant"; content: string }[]) =>
      run({ data: { messages } }),
    onSuccess: () => {
      // Force a fresh fetch (not just staleness invalidation) to fix multi-tab credit sync
      queryClient.invalidateQueries({ queryKey: QK.profile() });
      queryClient.refetchQueries({ queryKey: QK.profile() });
      queryClient.invalidateQueries({ queryKey: QK.creditHistory() });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}
