import { create } from "zustand";

interface UIState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  dailyCheckinOpen: boolean;
  levelUpModal: { open: boolean; level?: number; title?: string };
  toast: { message: string; type: "success" | "error" | "info" } | null;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  setDailyCheckinOpen: (open: boolean) => void;
  showLevelUp: (level: number, title: string) => void;
  hideLevelUp: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  hideToast: () => void;
}

function applyTheme(theme: "light" | "dark") {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  try {
    localStorage.setItem("peakhours-theme", theme);
    document.cookie = `peakhours-theme=${theme};path=/;max-age=31536000;SameSite=Lax`;
  } catch {}
}

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem("peakhours-theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {}
  return "dark";
}

export const useUIStore = create<UIState>((set) => ({
  theme: getInitialTheme(),
  sidebarOpen: true,
  dailyCheckinOpen: false,
  levelUpModal: { open: false },
  toast: null,
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "light" ? "dark" : "light";
      applyTheme(next);
      return { theme: next };
    }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setDailyCheckinOpen: (open) => set({ dailyCheckinOpen: open }),
  showLevelUp: (level, title) => set({ levelUpModal: { open: true, level, title } }),
  hideLevelUp: () => set({ levelUpModal: { open: false } }),
  showToast: (message, type) => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
}));
