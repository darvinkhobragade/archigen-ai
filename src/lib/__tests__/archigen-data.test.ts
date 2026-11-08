import { describe, it, expect } from "vitest";
import { tools, plans, creditCosts, CONCEPTUAL_NOTE } from "@/lib/archigen-data";

describe("tools", () => {
  it("every tool has a positive credit cost", () => {
    tools.forEach((t) => expect(t.credits).toBeGreaterThan(0));
  });

  it("tool slugs match route paths", () => {
    tools.forEach((t) => expect(t.to).toBe(`/${t.slug}`));
  });

  it("every tool has a non-empty name and blurb", () => {
    tools.forEach((t) => {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.blurb.length).toBeGreaterThan(0);
    });
  });

  it("tool icon names are valid lucide identifiers", () => {
    const validIcons = ["Building2", "Sofa", "Wand2", "Ruler"];
    tools.forEach((t) => expect(validIcons).toContain(t.icon));
  });
});

describe("plans", () => {
  it("exactly one plan is featured", () => {
    const featured = plans.filter((p) => p.featured);
    expect(featured.length).toBe(1);
  });

  it("every plan has a name, price, and cta", () => {
    plans.forEach((p) => {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.price.length).toBeGreaterThan(0);
      expect(p.cta.length).toBeGreaterThan(0);
    });
  });

  it("every plan has at least one feature bullet", () => {
    plans.forEach((p) => expect(p.features.length).toBeGreaterThan(0));
  });
});

describe("creditCosts", () => {
  it("all credit costs are positive integers", () => {
    creditCosts.forEach((c) => {
      expect(typeof c.cost).toBe("number");
      expect(c.cost).toBeGreaterThan(0);
      expect(Number.isInteger(c.cost)).toBe(true);
    });
  });

  it("all credit cost labels are non-empty strings", () => {
    creditCosts.forEach((c) => expect(c.label.length).toBeGreaterThan(0));
  });
});

describe("CONCEPTUAL_NOTE", () => {
  it("is a non-empty string", () => {
    expect(typeof CONCEPTUAL_NOTE).toBe("string");
    expect(CONCEPTUAL_NOTE.length).toBeGreaterThan(0);
  });
});
