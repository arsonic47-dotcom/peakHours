"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTimerStore, formatTimerTime } from "@/lib/store/timerStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useUIStore } from "@/lib/store/uiStore";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Timer,
  Brain,
  Coffee,
  Clock,
  Sparkles,
  Save,
  X,
  PictureInPicture2,
} from "lucide-react";
import { useQuote } from "@/lib/hooks/useQuote";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useFloatingTimer } from "@/lib/hooks/useFloatingTimer";
import { motion } from "framer-motion";

const MODES = [
  { id: "pomodoro" as const, label: "Pomodoro", work: 25, break: 5 },
  { id: "fifty-ten" as const, label: "50/10", work: 50, break: 10 },
  { id: "ninety-twenty" as const, label: "90/20", work: 90, break: 20 },
  { id: "custom" as const, label: "Custom", work: 25, break: 5 },
];

export function TimerPage() {
  const {
    mode, config, timeLeft, isRunning, isBreak, completedMinutes, completed,
    setMode, setCustomConfig, start, pause, resume, stop, reset, clearTimer,
  } = useTimerStore();
  const { sessions, addSession } = useSessionStore();
  const { showToast } = useUIStore();
  const supabase = createClient();

  const [showComplete, setShowComplete] = useState(false);
  const [showConfirmPartial, setShowConfirmPartial] = useState(false);
  const [pendingPartialMinutes, setPendingPartialMinutes] = useState(0);
  const [pendingAction, setPendingAction] = useState<"stop" | "reset" | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customWork, setCustomWork] = useState("25");
  const [customBreak, setCustomBreak] = useState("5");
  const { quote } = useQuote();
  const { requestPermission, notify, initAudio } = useNotifications();

  const autoSaveSession = useCallback(async (minutes: number) => {
    if (minutes <= 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const session = {
      id: crypto.randomUUID(),
      user_id: user.id,
      duration_minutes: Math.round(minutes),
      started_at: new Date(Date.now() - minutes * 60000).toISOString(),
      ended_at: new Date().toISOString(),
      mode,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("study_sessions").insert(session);
    if (!error) {
      addSession(session);
      showToast(`Session saved: ${Math.round(minutes)} minutes`, "success");
    }
  }, [supabase, addSession, showToast, mode]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    const unsub = useTimerStore.subscribe((state) => {
      if (state.completed && state.lastCompletedPhase === "work") {
        setShowComplete(true);
        autoSaveSession(state.config.work);
        notify("Focus Complete", `${state.config.work} minute session saved`, "/sounds/complete.mp3");
      } else if (state.completed && state.lastCompletedPhase === "break") {
        setShowComplete(true);
        notify("Break Over", "Time to focus!", "/sounds/break.mp3");
      }
    });
    return () => unsub();
  }, [autoSaveSession, notify]);

  const pct = isBreak
    ? ((config.break * 60 - timeLeft) / (config.break * 60)) * 100
    : ((config.work * 60 - timeLeft) / (config.work * 60)) * 100;

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const handlePartialStop = () => {
    const elapsed = (config.work * 60 - timeLeft) / 60;
    if (!isBreak && elapsed > 0.5) {
      setPendingPartialMinutes(Math.round(elapsed));
      setPendingAction("stop");
      setShowConfirmPartial(true);
    } else {
      stop();
    }
  };

  const handlePartialReset = () => {
    const elapsed = (config.work * 60 - timeLeft) / 60;
    if (!isBreak && elapsed > 0.5) {
      setPendingPartialMinutes(Math.round(elapsed));
      setPendingAction("reset");
      setShowConfirmPartial(true);
    } else {
      reset();
    }
  };

  const confirmPartialSave = async () => {
    await autoSaveSession(pendingPartialMinutes);
    setShowConfirmPartial(false);
    setPendingPartialMinutes(0);
    if (pendingAction === "stop") stop();
    else reset();
  };

  const discardPartialSave = () => {
    setShowConfirmPartial(false);
    setPendingPartialMinutes(0);
    if (pendingAction === "stop") stop();
    else reset();
  };

  const floatingTimer = useFloatingTimer();
  const handlePartialStopRef = useRef(handlePartialStop);
  handlePartialStopRef.current = handlePartialStop;

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.source !== floatingTimer.pipWindow.current) return;
      if (e.data === "pip-pause") {
        const s = useTimerStore.getState();
        if (s.isRunning) s.pause();
        else {
          requestPermission();
          initAudio();
          s.resume();
        }
      } else if (e.data === "pip-stop") {
        handlePartialStopRef.current();
      } else if (e.data === "pip-focus") {
        window.focus();
        floatingTimer.close();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [floatingTimer.close, floatingTimer.pipWindow, requestPermission, initAudio]);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Focus Timer</h1>
        <p className="text-text-secondary mt-1">Stay focused. Track your sessions. Build momentum.</p>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-2 mb-8 bg-surface-secondary rounded-2xl p-1.5 border border-border">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                setShowCustomForm(false);
              }}
              className={cn(
                "rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200",
                mode === m.id
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "custom" && (
          <div className="mb-6 p-4 rounded-xl bg-surface-secondary border border-border">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-1">Work (min)</label>
                <input
                  type="number"
                  value={customWork}
                  onChange={(e) => setCustomWork(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-400"
                  min={1}
                  max={180}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-1">Break (min)</label>
                <input
                  type="number"
                  value={customBreak}
                  onChange={(e) => setCustomBreak(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-400"
                  min={1}
                  max={60}
                />
              </div>
              <Button
                size="sm"
                className="mt-5"
                onClick={() => {
                  setCustomConfig(parseInt(customWork) || 25, parseInt(customBreak) || 5);
                  showToast("Custom timer updated", "info");
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        )}

        <div className="relative flex items-center justify-center mb-8">
          <svg width="280" height="280" className="transform -rotate-90">
            <circle cx="140" cy="140" r="120" fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke={isBreak ? "var(--success)" : "var(--primary)"}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-bold text-text-primary tracking-tight">
              {formatTimerTime(timeLeft)}
            </span>
            <span className="text-sm text-text-secondary mt-2">
              {isBreak ? "Break Time" : "Focus Time"}
            </span>
            {isBreak && (
              <Badge variant="success" className="mt-2">
                <Coffee size={12} className="mr-1" />
                Break
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          {!isRunning ? (
            <Button size="xl" onClick={() => { requestPermission(); initAudio(); start(); }} className="gap-2 min-w-[140px]">
              <Play size={20} />
              {timeLeft === config.work * 60 && !isBreak ? "Start" : "Resume"}
            </Button>
          ) : (
            <Button size="xl" variant="secondary" onClick={pause} className="gap-2 min-w-[140px]">
              <Pause size={20} />
              Pause
            </Button>
          )}
          {isRunning && (
            <Button size="xl" variant="ghost" onClick={handlePartialStop} className="gap-2">
              <Square size={18} />
              Stop
            </Button>
          )}
          <Button size="xl" variant="ghost" onClick={handlePartialReset} className="gap-2">
            <RotateCcw size={18} />
            Reset
          </Button>
        </div>

        <div className="flex items-center justify-center -mt-4 mb-8">
          <button
            disabled={!isRunning && !isBreak && timeLeft === config.work * 60}
            onClick={() => {
              if (!floatingTimer.isSupported) {
                showToast("Picture-in-Picture is not supported in this browser", "info");
                return;
              }
              if (floatingTimer.isOpen) floatingTimer.close();
              else floatingTimer.open();
            }}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors rounded-lg px-3 py-1.5",
              !floatingTimer.isSupported || (!isRunning && !isBreak && timeLeft === config.work * 60)
                ? "opacity-40 cursor-not-allowed"
                : floatingTimer.isOpen
                  ? "bg-primary-600 text-white"
                  : "text-text-tertiary hover:text-text-primary hover:bg-surface-secondary"
            )}
          >
            <PictureInPicture2 size={14} />
            {floatingTimer.isOpen ? "Floating Timer" : "Pop Out Timer"}
          </button>
        </div>

        <Card className="p-5">
          <CardTitle className="flex items-center gap-2 text-base mb-3">
            <Clock size={16} className="text-primary-600" />
            Session History
          </CardTitle>
          <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
            {sessions.length === 0 ? (
              <p className="text-sm text-text-tertiary py-4 text-center">No sessions yet. Start your first one!</p>
            ) : (
              sessions.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-secondary"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {session.duration_minutes} min
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {new Date(session.started_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="neutral">{session.mode.replace("-", "/")}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Modal open={showComplete} onClose={() => setShowComplete(false)} title="Session Complete!" size="sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-success/10 mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-success" />
          </div>
          <div className="flex gap-3 items-start bg-surface-secondary/60 border border-border rounded-xl px-4 py-3 mb-6 mx-auto max-w-sm">
            <Sparkles className="h-5 w-5 text-primary-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-text-secondary leading-relaxed italic">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-xs text-text-tertiary mt-1">&mdash; {quote.author}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => { setShowComplete(false); start(); }}>
              Start Next
            </Button>
            <Button variant="ghost" onClick={() => setShowComplete(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showConfirmPartial} onClose={() => setShowConfirmPartial(false)} title="Save Session?" size="sm">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto mb-4 flex items-center justify-center">
            <Timer className="h-7 w-7 text-amber-600" />
          </div>
          <p className="text-text-primary font-medium mb-1">
            Save {pendingPartialMinutes} minutes of focus?
          </p>
          <p className="text-sm text-text-tertiary mb-6">
            This session hasn&rsquo;t been saved yet.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={confirmPartialSave} className="gap-2">
              <Save size={16} />
              Save
            </Button>
            <Button variant="ghost" onClick={discardPartialSave} className="gap-2">
              <X size={16} />
              Discard
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
