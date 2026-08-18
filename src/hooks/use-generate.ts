import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
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

export function useGenerateDesign() {
  const queryClient = useQueryClient();
  const run = useServerFn(generateDesign);
  return useMutation({
    mutationFn: (input: GenerateInput) => run({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["credit-history"] });
    },
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
  return useMutation({
    mutationFn: (input: {
      brief: string;
      bhk: number;
      plot: string;
      builtUpArea?: string | number | undefined;
      facing?: string | undefined;
    }) => run({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["credit-history"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRender2DColorFloorPlan() {
  const queryClient = useQueryClient();
  const run = useServerFn(render2DColorFloorPlan);
  return useMutation({
    mutationFn: (input: {
      rooms: PlanRoom[];
      bhk: number;
      plot: string;
      stylePreset?: string | undefined;
    }) => run({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["credit-history"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRender3DFloorPlan() {
  const queryClient = useQueryClient();
  const run = useServerFn(render3DFloorPlan);
  return useMutation({
    mutationFn: (input: {
      rooms: PlanRoom[];
      bhk: number;
      plot: string;
      stylePreset?: string | undefined;
    }) => run({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["credit-history"] });
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
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["credit-history"] });
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
