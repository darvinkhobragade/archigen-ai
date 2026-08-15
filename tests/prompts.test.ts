import { describe, it, expect } from "vitest";
import {
  buildImagePrompt,
  STYLE_PRESETS,
  LIGHTING_PRESETS,
  CAMERA_PRESETS,
  ASPECT_RATIOS,
  ARCHITECTURAL_NEGATIVE_GUARDRAILS,
} from "@/lib/ai/prompts";

describe("AI Architectural Prompt Synthesizer & Guardrails", () => {
  it("builds architectural exterior prompt with all parameters and negative guardrails", () => {
    const prompt = buildImagePrompt(
      "architecture",
      "Modern cantilevered concrete villa in forest",
      { building_type: "Residential Villa", facade_material: "Concrete and Teak" },
      "photorealistic",
      "16:9",
      "golden_hour",
      "eye_level",
    );

    expect(prompt).toContain("Architectural exterior master photography");
    expect(prompt).toContain("Modern cantilevered concrete villa in forest");
    expect(prompt).toContain(STYLE_PRESETS["photorealistic"]);
    expect(prompt).toContain(LIGHTING_PRESETS["golden_hour"]);
    expect(prompt).toContain(CAMERA_PRESETS["eye_level"]);
    expect(prompt).toContain(ASPECT_RATIOS["16:9"].modifier);
    expect(prompt).toContain(ARCHITECTURAL_NEGATIVE_GUARDRAILS);
  });

  it("builds interior design prompt with correct spatial staging tokens", () => {
    const prompt = buildImagePrompt(
      "interior",
      "Minimalist Japanese tea room living space",
      { room_type: "Living Room", flooring_material: "Light Oak" },
      "japandi",
      "1:1",
      "soft_overcast",
      "interior_wide",
    );

    expect(prompt).toContain("Interior design editorial photography");
    expect(prompt).toContain("Minimalist Japanese tea room living space");
    expect(prompt).toContain(STYLE_PRESETS["japandi"]);
    expect(prompt).toContain("crystal clear depth");
    expect(prompt).toContain(ARCHITECTURAL_NEGATIVE_GUARDRAILS);
  });

  it("builds room redesign prompt enforcing original perimeter lock", () => {
    const prompt = buildImagePrompt(
      "redesign",
      "Warm contemporary makeover",
      { preserve_windows: "true" },
      "luxury_penthouse",
      "4:3",
      "natural_daylight",
      "eye_level",
    );

    expect(prompt).toContain("Architectural room restyle and interior transformation");
    expect(prompt).toContain("Maintain exact room boundaries, window positions, ceiling height");
    expect(prompt).toContain(STYLE_PRESETS["luxury_penthouse"]);
    expect(prompt).toContain(ARCHITECTURAL_NEGATIVE_GUARDRAILS);
  });

  it("includes 8K UHD sharpness qualifier in all synthesized prompts", () => {
    const prompt = buildImagePrompt("architecture", "Villa", {}, "photorealistic");
    expect(prompt).toContain("ultra sharp 8K UHD resolution");
  });
});
