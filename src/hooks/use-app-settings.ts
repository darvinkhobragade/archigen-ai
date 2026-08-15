import { useSyncExternalStore, useCallback } from "react";

export interface AppSettings {
  hires: boolean;
  watermark: boolean;
  autosave: boolean;
  lowCreditAlerts: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  hires: false,
  watermark: true,
  autosave: true,
  lowCreditAlerts: true,
};

const STORAGE_KEY = "archigen_user_settings";

let currentSettings: AppSettings = DEFAULT_SETTINGS;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function loadInitialSettings(): AppSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

if (typeof window !== "undefined") {
  currentSettings = loadInitialSettings();

  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(e.newValue) };
        notifyListeners();
      } catch {
        // ignore parse errors
      }
    }
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): AppSettings {
  return currentSettings;
}

function getServerSnapshot(): AppSettings {
  return DEFAULT_SETTINGS;
}

export function useAppSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      const next = { ...currentSettings, [key]: value };
      currentSettings = next;
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
      } catch (err) {
        console.error("Failed to save setting", err);
      }
      notifyListeners();
    },
    [],
  );

  return {
    settings,
    updateSetting,
  };
}
