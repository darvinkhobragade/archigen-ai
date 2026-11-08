import { describe, it, expect } from "vitest";
import { z } from "zod";

const architectureSchema = z.object({
  brief: z.string().trim().min(8, "Add a short design brief first (at least 8 characters)."),
  buildingType: z.string().min(1, "Please select a building type."),
  style: z.string().min(1, "Please select an architectural style."),
  plot: z.string().trim().min(2, "Please enter plot dimensions (e.g. 30 x 50 ft)."),
  floors: z.string().trim().min(1, "Please enter number of floors."),
  materials: z.string().trim().min(2, "Please specify primary building materials."),
  greenery: z.number().min(0).max(100),
});

const interiorSchema = z.object({
  room: z.string().min(1, "Please select a room type."),
  style: z.string().min(1, "Please select an interior style."),
  palette: z.string().trim().min(2, "Please enter a material/color palette (at least 2 characters)."),
  lighting: z.string().min(1, "Please select a lighting mood."),
  notes: z.string().max(1000, "Extra requirements must be under 1000 characters."),
  budget: z.number().min(0).max(100),
});

const redesignSchema = z.object({
  hasPhoto: z.boolean().refine((val) => val, {
    message: "Upload a room photo first.",
  }),
  roomType: z.string().min(1, "Please select a room type."),
  style: z.string().min(1, "Please select a target style."),
  strength: z.number().min(0).max(100),
  keep: z.string().max(500, "Elements to keep must be under 500 characters."),
});

describe("architectureSchema", () => {
  it("passes valid architecture inputs", () => {
    const valid = {
      brief: "Modern 2-storey villa on a corner plot with large balconies",
      buildingType: "residential",
      style: "contemporary",
      plot: "30 x 50 ft",
      floors: "2",
      materials: "Exposed brick, concrete",
      greenery: 50,
    };
    expect(architectureSchema.safeParse(valid).success).toBe(true);
  });

  it("fails when brief is too short", () => {
    const invalid = {
      brief: "House",
      buildingType: "residential",
      style: "contemporary",
      plot: "30 x 50 ft",
      floors: "2",
      materials: "Concrete",
      greenery: 50,
    };
    const res = architectureSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});

describe("interiorSchema", () => {
  it("passes valid interior inputs", () => {
    const valid = {
      room: "living",
      style: "warm-minimal",
      palette: "Oak, travertine",
      lighting: "evening",
      notes: "Sofa and coffee table",
      budget: 40,
    };
    expect(interiorSchema.safeParse(valid).success).toBe(true);
  });

  it("fails when palette is blank", () => {
    const invalid = {
      room: "living",
      style: "warm-minimal",
      palette: "",
      lighting: "evening",
      notes: "",
      budget: 40,
    };
    expect(interiorSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("redesignSchema", () => {
  it("fails when hasPhoto is false", () => {
    const invalid = {
      hasPhoto: false,
      roomType: "living",
      style: "scandi",
      strength: 50,
      keep: "",
    };
    expect(redesignSchema.safeParse(invalid).success).toBe(false);
  });

  it("passes when photo is uploaded", () => {
    const valid = {
      hasPhoto: true,
      roomType: "living",
      style: "scandi",
      strength: 50,
      keep: "flooring",
    };
    expect(redesignSchema.safeParse(valid).success).toBe(true);
  });
});
