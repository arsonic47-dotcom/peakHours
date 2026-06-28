"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Mountain, Target, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const SUGGESTED_GOALS = [
  { hours: 100, label: "Casual", desc: "Light study journey" },
  { hours: 500, label: "Committed", desc: "Build a solid habit" },
  { hours: 1000, label: "Dedicated", desc: "Deep mastery path" },
  { hours: 2500, label: "Summit", desc: "The full challenge" },
];

export function OnboardingForm() {
  const [name, setName] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [customHours, setCustomHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    if (searchParams.get("from") !== "signup") {
      router.replace("/dashboard");
      return;
    }
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
      if (data && !cancelled) {
        setName(data.display_name);
      }
    };
    loadProfile();
    return () => { cancelled = true; };
  }, []);

  const targetHours = selectedGoal !== null ? selectedGoal : (parseInt(customHours) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHours || targetHours < 1) {
      setError("Please select or enter a target goal.");
      return;
    }
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      router.push("/login");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: name,
        target_hours: targetHours,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4">
            <Mountain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Welcome to PeakHours</h1>
          <p className="text-text-secondary mt-2">Let&apos;s set up your journey to the summit.</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="name"
              label="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User size={16} />}
              required
            />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">
                Choose Your Goal
              </label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {SUGGESTED_GOALS.map((g) => (
                  <button
                    key={g.hours}
                    type="button"
                    onClick={() => {
                      setSelectedGoal(g.hours);
                      setCustomHours("");
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl border-2 p-4 transition-all text-center",
                      selectedGoal === g.hours
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-border bg-surface hover:bg-surface-secondary"
                    )}
                  >
                    <Target size={20} className={selectedGoal === g.hours ? "text-primary-600" : "text-text-tertiary"} />
                    <span className={cn("text-lg font-bold", selectedGoal === g.hours ? "text-primary-700" : "text-text-primary")}>
                      {g.hours}
                    </span>
                    <span className="text-xs font-medium text-text-secondary">{g.label}</span>
                    <span className="text-[10px] text-text-tertiary">{g.desc}</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <Input
                  id="custom"
                  label="Or set a custom goal"
                  type="number"
                  placeholder="Enter hours..."
                  value={customHours}
                  onChange={(e) => {
                    setCustomHours(e.target.value);
                    setSelectedGoal(null);
                  }}
                  icon={<Target size={16} />}
                  min={1}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-error">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              <Sparkles size={16} />
              Start My Journey
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
