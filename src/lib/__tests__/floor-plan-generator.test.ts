import { describe, it, expect } from "vitest";
import { generateSmartFloorPlan } from "@/lib/ai/floor-plan-generator";

describe("generateSmartFloorPlan", () => {
  it("generates a 1 BHK layout with essential spaces", () => {
    const plan = generateSmartFloorPlan("1 BHK 25x30 north facing");
    expect(plan.rooms.length).toBeGreaterThanOrEqual(4);
    const roomTypes = plan.rooms.map((r) => r.type);
    expect(roomTypes).toContain("living");
    expect(roomTypes).toContain("master_bedroom");
    expect(roomTypes).toContain("kitchen");
  });

  it("generates a 2 BHK layout by default", () => {
    const plan = generateSmartFloorPlan("Modern house layout 30x40");
    const roomTypes = plan.rooms.map((r) => r.type);
    expect(roomTypes).toContain("living");
    expect(roomTypes).toContain("master_bedroom");
    expect(roomTypes).toContain("bedroom");
    expect(roomTypes).toContain("kitchen");
  });

  it("includes pooja room in 3 BHK when requested", () => {
    const plan = generateSmartFloorPlan("3 BHK 30x50 with pooja room");
    const hasPooja = plan.rooms.some((r) => r.type === "pooja" || r.name.toLowerCase().includes("pooja"));
    expect(hasPooja).toBe(true);
  });

  it("generates luxury 4 BHK with 10 zones", () => {
    const plan = generateSmartFloorPlan("4 BHK luxury villa 40x60");
    expect(plan.rooms.length).toBe(10);
    const names = plan.rooms.map((r) => r.name);
    expect(names).toContain("Chef Kitchen");
    expect(names).toContain("Formal Living");
  });

  it("bounds rooms within plot dimensions", () => {
    const plan = generateSmartFloorPlan("2 BHK 30x40");
    plan.rooms.forEach((r) => {
      expect(r.x + r.w).toBeLessThanOrEqual(30);
      expect(r.y + r.h).toBeLessThanOrEqual(40);
    });
  });
});
