"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/lib/store/uiStore";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import { Sparkles, Sun, Smile, Meh, Frown, ArrowRight } from "lucide-react";

const MOODS = [
  { value: 4, icon: Sun, label: "Excellent", color: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200" },
  { value: 3, icon: Smile, label: "Good", color: "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200" },
  { value: 2, icon: Meh, label: "Okay", color: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200" },
  { value: 1, icon: Frown, label: "Low", color: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" },
];

export function DailyCheckinModal() {
  const { dailyCheckinOpen, setDailyCheckinOpen, showToast } = useUIStore();
  const [mood, setMood] = useState<number | null>(null);
  const [goal, setGoal] = useState("");
  const [step, setStep] = useState<"mood" | "goal" | "done">("mood");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = async () => {
    if (!mood) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast("Please sign in again", "error");
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      const { error } = await supabase.from("daily_checkins").upsert(
        { user_id: user.id, date: today, mood, goal: goal || null },
        { onConflict: "user_id,date" }
      );

      if (error) {
        showToast(error.message || "Failed to save check-in", "error");
      } else {
        setStep("done");
        showToast("Check-in saved!", "success");
      }
    } catch (err) {
      showToast("Something went wrong. Please try again.", "error");
    }
    setLoading(false);
  };

  const handleClose = () => {
    setDailyCheckinOpen(false);
  };

  useEffect(() => {
    if (!dailyCheckinOpen) {
      resetTimeoutRef.current = setTimeout(() => {
        setMood(null);
        setGoal("");
        setStep("mood");
      }, 300);
    }
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, [dailyCheckinOpen]);

  return (
    <Modal open={dailyCheckinOpen} onClose={handleClose} size="sm">
      {step === "mood" && (
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 mx-auto mb-4 flex items-center justify-center">
            <Sun className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">How are you feeling today?</h2>
          <p className="text-text-secondary text-sm mb-6">Your mood helps us understand your journey.</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {MOODS.map((m) => {
              const Icon = m.icon;
              const selected = mood === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all",
                    selected
                      ? m.color + " border-current scale-105"
                      : "border-border bg-surface hover:bg-surface-secondary"
                  )}
                >
                  <Icon size={28} className={selected ? "" : "text-text-tertiary"} />
                  <span className={cn("text-sm font-medium", selected ? "" : "text-text-secondary")}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!mood}
            onClick={() => setStep("goal")}
          >
            Next
            <ArrowRight size={16} />
          </Button>
        </div>
      )}

      {step === "goal" && (
        <div className="py-2">
          <h2 className="text-xl font-bold text-text-primary mb-2">What will you accomplish today?</h2>
          <p className="text-text-secondary text-sm mb-6">Setting a goal makes it real.</p>

          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Complete 2 hours of math, finish the chapter on React..."
            className="w-full h-28 rounded-xl border border-border bg-surface p-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none mb-6"
            autoFocus
          />

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep("mood")}>
              Back
            </Button>
            <Button className="flex-1" onClick={handleSubmit} loading={loading}>
              Start Your Day
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-success/10 mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">You&apos;re all set!</h2>
          <p className="text-text-secondary text-sm mb-6">Let&apos;s make today count.</p>
          <Button className="w-full" size="lg" onClick={handleClose}>
            Let&apos;s Go
          </Button>
        </div>
      )}
    </Modal>
  );
}
