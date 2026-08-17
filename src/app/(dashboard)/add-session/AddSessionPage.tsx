"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useUIStore } from "@/lib/store/uiStore";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import { Plus, Clock, CalendarClock } from "lucide-react";
import type { TimerMode } from "@/types";

type InputMode = "duration" | "range";

const MODES: { value: TimerMode; label: string }[] = [
  { value: "pomodoro", label: "Pomodoro" },
  { value: "fifty-ten", label: "50/10" },
  { value: "ninety-twenty", label: "90/20" },
  { value: "custom", label: "Custom" },
];

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function toMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

const selectClass =
  "h-11 rounded-xl border border-border bg-surface px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-400";

export function AddSessionPage() {
  const { addSession } = useSessionStore();
  const { showToast } = useUIStore();
  const supabase = createClient();

  const [inputMode, setInputMode] = useState<InputMode>("duration");
  const [date, setDate] = useState(todayString());
  const [duration, setDuration] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const computedDuration =
    inputMode === "range" ? toMinutes(startTime, endTime) : parseInt(duration) || 0;

  const handleSave = useCallback(async () => {
    if (computedDuration < 1) {
      showToast("Duration must be at least 1 minute", "error");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Please sign in again", "error");
      return;
    }

    setSaving(true);

    const endedAt = inputMode === "range"
      ? new Date(`${date}T${endTime}:00`)
      : new Date();

    const startedAt = inputMode === "range"
      ? new Date(`${date}T${startTime}:00`)
      : new Date(endedAt.getTime() - computedDuration * 60000);

    const session = {
      id: crypto.randomUUID(),
      user_id: user.id,
      duration_minutes: computedDuration,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      mode,
      note: note.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("study_sessions").insert(session);

    setSaving(false);

    if (error) {
      showToast(error.message || "Failed to save session", "error");
      return;
    }

    addSession(session);
    showToast(`Added ${computedDuration} min session`, "success");

    // Clear input-dependent fields; keep date and mode
    setDuration("");
    setNote("");
    setStartTime("09:00");
    setEndTime("10:00");
  }, [date, duration, startTime, endTime, mode, note, inputMode, computedDuration, supabase, addSession, showToast]);

  return (
    <div className="max-w-xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Add Time</h1>
        <p className="text-text-secondary mt-1">Log study time you tracked off the timer.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
            <Plus className="h-5 w-5 text-primary-600" />
          </div>
          <CardTitle className="text-lg">New Session</CardTitle>
        </div>

        <div className="flex items-center gap-1 mb-6 bg-surface-secondary rounded-xl p-1 border border-border">
          <button
            onClick={() => setInputMode("duration")}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              inputMode === "duration"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Clock size={14} className="inline mr-1.5 -mt-0.5" />
            Duration
          </button>
          <button
            onClick={() => setInputMode("range")}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              inputMode === "range"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <CalendarClock size={14} className="inline mr-1.5 -mt-0.5" />
            Time Range
          </button>
        </div>

        <div className="space-y-4">
          <Input
            id="date"
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {inputMode === "duration" ? (
            <Input
              id="duration"
              label="Duration (min)"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 45"
            />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="start"
                label="Start time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                id="end"
                label="End time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          )}

          {inputMode === "range" && computedDuration >= 1 && (
            <p className="text-xs text-text-tertiary -mt-2">
              {computedDuration} minute{computedDuration !== 1 ? "s" : ""} calculated
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Mode</label>
            <div className="flex gap-2 flex-wrap">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium border transition-all",
                    mode === m.value
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-surface border-border text-text-secondary hover:text-text-primary hover:border-primary-200"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Note <span className="text-text-tertiary font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you study?"
              rows={2}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
          </div>

          <Button
            onClick={handleSave}
            loading={saving}
            disabled={inputMode === "duration" ? !duration : computedDuration < 1}
            className="w-full gap-2"
          >
            <Plus size={18} />
            Add Session
          </Button>
        </div>
      </Card>
    </div>
  );
}
