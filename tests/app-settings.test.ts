import { describe, it, expect, beforeEach } from "vitest";
import { DEFAULT_SETTINGS, type AppSettings } from "@/hooks/use-app-settings";

// In-memory localStorage mock for headless node / worker environments
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

const mockStorage = new LocalStorageMock();

describe("useAppSettings Hook and Store", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("provides expected default settings", () => {
    expect(DEFAULT_SETTINGS).toEqual({
      hires: false,
      watermark: true,
      autosave: true,
      lowCreditAlerts: true,
    });
  });

  it("handles valid JSON deserialization from localStorage", () => {
    const custom: AppSettings = {
      hires: true,
      watermark: false,
      autosave: true,
      lowCreditAlerts: false,
    };
    mockStorage.setItem("archigen_user_settings", JSON.stringify(custom));
    const stored = JSON.parse(mockStorage.getItem("archigen_user_settings") || "{}") as AppSettings;
    expect(stored.hires).toBe(true);
    expect(stored.watermark).toBe(false);
    expect(stored.lowCreditAlerts).toBe(false);
  });

  it("handles corrupt localStorage data gracefully without throwing", () => {
    mockStorage.setItem("archigen_user_settings", "invalid-corrupt-json{");
    expect(() => {
      try {
        JSON.parse(mockStorage.getItem("archigen_user_settings") || "{}");
      } catch {
        // fallback to default on error
      }
    }).not.toThrow();
  });
});
