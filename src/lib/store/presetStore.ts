import { create } from "zustand";
import type { TimerPreset } from "@/types";

const STORAGE_KEY = "peakhours-timer-presets";

interface PresetState {
  presets: TimerPreset[];
  addPreset: (preset: Omit<TimerPreset, "id">) => void;
  deletePreset: (id: string) => void;
  loadPresets: () => void;
}

function saveToStorage(presets: TimerPreset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {}
}

function loadFromStorage(): TimerPreset[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export const usePresetStore = create<PresetState>((set) => ({
  presets: loadFromStorage(),

  addPreset: (preset) => {
    const newPreset: TimerPreset = {
      ...preset,
      id: crypto.randomUUID(),
    };
    set((state) => {
      const updated = [...state.presets, newPreset].slice(-8); // Keep max 8 presets
      saveToStorage(updated);
      return { presets: updated };
    });
  },

  deletePreset: (id) => {
    set((state) => {
      const updated = state.presets.filter((p) => p.id !== id);
      saveToStorage(updated);
      return { presets: updated };
    });
  },

  loadPresets: () => {
    set({ presets: loadFromStorage() });
  },
}));
