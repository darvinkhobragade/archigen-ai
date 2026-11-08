/**
 * Shared generation and architectural domain types.
 * Keeping these independent of server function files ensures clean client/server separation.
 */

export type RoomType =
  | "living"
  | "master_bedroom"
  | "bedroom"
  | "kitchen"
  | "dining"
  | "bathroom"
  | "balcony"
  | "pooja"
  | "foyer"
  | "utility"
  | "parking"
  | "staircase"
  | "sitout";

export type PlanRoom = {
  id: string;
  name: string;
  type?: RoomType | undefined;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type GenerateInput = {
  tool: "architecture" | "interior" | "redesign";
  prompt: string;
  settings: Record<string, string | number>;
  cost: number;
  stylePreset?: string | undefined;
  aspectRatio?: string | undefined;
  lightingMood?: string | undefined;
  cameraAngle?: string | undefined;
  seed?: number | undefined;
  projectId?: string | null | undefined;
  sourceImage?: string | null | undefined;
};

export type GenerateResult = {
  id: string;
  imagePath: string;
  url: string;
  creditsLeft: number;
  seed: number;
  projectId?: string | null | undefined;
};
