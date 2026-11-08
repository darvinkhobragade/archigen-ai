import { describe, it, expect } from "vitest";
import { QK } from "@/lib/query-keys";

describe("QK (query key factory)", () => {
  it("profile returns the correct key shape", () => {
    expect(QK.profile()).toEqual(["profile"]);
  });

  it("projects returns the correct key shape", () => {
    expect(QK.projects()).toEqual(["projects"]);
  });

  it("projectGenerations with ID returns scoped key", () => {
    expect(QK.projectGenerations("abc-123")).toEqual(["project-generations", "abc-123"]);
  });

  it("projectGenerations without ID returns root key", () => {
    expect(QK.projectGenerations()).toEqual(["project-generations"]);
  });

  it("allGenerations returns the correct key shape", () => {
    expect(QK.allGenerations()).toEqual(["all-generations"]);
  });

  it("totalGenerationsCount returns the correct key shape", () => {
    expect(QK.totalGenerationsCount()).toEqual(["total-generations-count"]);
  });

  it("creditHistory uses default limit 50", () => {
    expect(QK.creditHistory()).toEqual(["credit-history", 50]);
  });

  it("creditHistory respects custom limit", () => {
    expect(QK.creditHistory(20)).toEqual(["credit-history", 20]);
  });

  it("floorPlans with projectId returns scoped key", () => {
    expect(QK.floorPlans("proj-999")).toEqual(["floor-plans", "proj-999"]);
  });

  it("floorPlans without projectId returns root key", () => {
    expect(QK.floorPlans()).toEqual(["floor-plans"]);
  });
});
