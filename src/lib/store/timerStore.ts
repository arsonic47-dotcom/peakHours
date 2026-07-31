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
  lastCompletedPhase: "work" | "break" | null;
  intervalId: ReturnType<typeof setInterval> | null;
  endAt: number | null;

  setMode: (mode: TimerMode) => void;
  setCustomConfig: (work: number, breakMinutes: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  clearTimer: () => void;
  tick: () => void;
}

function computeRemaining(endAt: number): number {
  return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
}

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: "pomodoro",
  config: MODE_CONFIGS.pomodoro,
  timeLeft: MODE_CONFIGS.pomodoro.work * 60,
  isRunning: false,
  isBreak: false,
  completedMinutes: 0,
  completed: false,
  lastCompletedPhase: null,
  intervalId: null,
  endAt: null,

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
    set({ mode, config, timeLeft: config.work * 60, isRunning: false, isBreak: false, completed: false, lastCompletedPhase: null, endAt: null });
  },

  setCustomConfig: (work, breakMinutes) => {
    get().clearTimer();
    const config = { work, break: breakMinutes };
    MODE_CONFIGS.custom = config;
    set({ config, timeLeft: work * 60, isRunning: false, isBreak: false, completed: false, lastCompletedPhase: null, endAt: null });
  },

  tick: () => {
    const current = get();
    if (!current.isRunning || current.endAt === null) return;

    const remaining = computeRemaining(current.endAt);

    if (remaining <= 0) {
      current.clearTimer();
      if (current.isBreak) {
        set({
          isRunning: false,
          endAt: null,
          timeLeft: current.config.work * 60,
          isBreak: false,
          completed: true,
          completedMinutes: current.completedMinutes,
          lastCompletedPhase: "break",
        });
      } else {
        set({
          isRunning: false,
          endAt: null,
          isBreak: true,
          timeLeft: current.config.break * 60,
          completed: true,
          completedMinutes: current.completedMinutes + current.config.work,
          lastCompletedPhase: "work",
        });
      }
      return;
    }

    if (remaining !== current.timeLeft) {
      set({ timeLeft: remaining });
    }
  },

  start: () => {
    get().clearTimer();
    const state = get();
    const endAt = Date.now() + state.timeLeft * 1000;

    const id = setInterval(() => {
      get().tick();
    }, 1000);

    set({ isRunning: true, completed: false, intervalId: id, endAt });
  },

  pause: () => {
    const current = get();
    const timeLeft = current.endAt !== null ? computeRemaining(current.endAt) : current.timeLeft;
    get().clearTimer();
    set({ isRunning: false, timeLeft, endAt: null });
  },

  resume: () => {
    get().start();
  },

  stop: () => {
    get().clearTimer();
    const config = get().config;
    set({ isRunning: false, timeLeft: config.work * 60, isBreak: false, completed: false, lastCompletedPhase: null, endAt: null });
  },

  reset: () => {
    get().clearTimer();
    const config = get().config;
    set({ isRunning: false, timeLeft: config.work * 60, isBreak: false, completedMinutes: 0, completed: false, lastCompletedPhase: null, endAt: null });
  },
}));

export function formatTimerTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
