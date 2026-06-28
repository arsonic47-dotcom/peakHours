import { create } from "zustand";

export type TimerMode = "pomodoro" | "fifty-ten" | "ninety-twenty" | "custom";

interface TimerConfig {
  work: number;
  break: number;
}

const MODE_CONFIGS: Record<string, TimerConfig> = {
  pomodoro: { work: 25, break: 5 },
  "fifty-ten": { work: 50, break: 10 },
  "ninety-twenty": { work: 90, break: 20 },
  custom: { work: 25, break: 5 },
};

interface TimerState {
  mode: TimerMode;
  config: TimerConfig;
  timeLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  completedMinutes: number;
  completed: boolean;
  intervalId: ReturnType<typeof setInterval> | null;

  setMode: (mode: TimerMode) => void;
  setCustomConfig: (work: number, breakMinutes: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  clearTimer: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: "pomodoro",
  config: MODE_CONFIGS.pomodoro,
  timeLeft: MODE_CONFIGS.pomodoro.work * 60,
  isRunning: false,
  isBreak: false,
  completedMinutes: 0,
  completed: false,
  intervalId: null,

  clearTimer: () => {
    const { intervalId } = get();
    if (intervalId !== null) {
      clearInterval(intervalId);
      set({ intervalId: null });
    }
  },

  setMode: (mode) => {
    get().clearTimer();
    const config = MODE_CONFIGS[mode];
    set({ mode, config, timeLeft: config.work * 60, isRunning: false, isBreak: false, completedMinutes: 0, completed: false });
  },

  setCustomConfig: (work, breakMinutes) => {
    get().clearTimer();
    const config = { work, break: breakMinutes };
    MODE_CONFIGS.custom = config;
    set({ config, timeLeft: work * 60, isRunning: false, isBreak: false, completedMinutes: 0, completed: false });
  },

  start: () => {
    get().clearTimer();
    const state = get();

    const id = setInterval(() => {
      const current = get();

      if (current.timeLeft <= 1) {
        current.clearTimer();
        if (current.isBreak) {
          set({
            isRunning: false,
            timeLeft: current.config.work * 60,
            isBreak: false,
            completed: true,
            completedMinutes: current.completedMinutes,
          });
        } else {
          set({
            isRunning: false,
            isBreak: true,
            timeLeft: current.config.break * 60,
            completed: true,
            completedMinutes: current.completedMinutes + current.config.work,
          });
        }
        return;
      }

      set({ timeLeft: current.timeLeft - 1 });
    }, 1000);

    set({ isRunning: true, completed: false, intervalId: id });
  },

  pause: () => {
    get().clearTimer();
    set({ isRunning: false });
  },

  resume: () => {
    get().start();
  },

  stop: () => {
    get().clearTimer();
    const config = get().config;
    set({ isRunning: false, timeLeft: config.work * 60, isBreak: false, completed: false });
  },

  reset: () => {
    get().clearTimer();
    const config = get().config;
    set({ isRunning: false, timeLeft: config.work * 60, isBreak: false, completedMinutes: 0, completed: false });
  },
}));

export function formatTimerTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
