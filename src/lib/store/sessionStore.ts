import { create } from "zustand";
import type { StudySession, TimerMode } from "@/types";

interface SessionState {
  sessions: StudySession[];
  loading: boolean;
  setSessions: (sessions: StudySession[]) => void;
  addSession: (session: StudySession) => void;
  removeSession: (id: string) => void;
  setLoading: (loading: boolean) => void;
  getTotalHours: () => number;
  getTodayHours: () => number;
  getWeekHours: () => number;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  loading: false,
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((state) => ({ sessions: [session, ...state.sessions] })),
  removeSession: (id) => set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
  setLoading: (loading) => set({ loading }),
  getTotalHours: () => {
    const { sessions } = get();
    return sessions.reduce((acc, s) => acc + s.duration_minutes, 0) / 60;
  },
  getTodayHours: () => {
    const { sessions } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessions
      .filter((s) => new Date(s.started_at) >= today)
      .reduce((acc, s) => acc + s.duration_minutes, 0) / 60;
  },
  getWeekHours: () => {
    const { sessions } = get();
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return sessions
      .filter((s) => new Date(s.started_at) >= startOfWeek)
      .reduce((acc, s) => acc + s.duration_minutes, 0) / 60;
  },
}));
