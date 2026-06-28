"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/lib/store/sessionStore";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useUIStore } from "@/lib/store/uiStore";
import { cn } from "@/lib/utils/cn";
import { formatRelativeDate } from "@/lib/utils/format";
import { getMilestoneMessage } from "@/lib/constants/messages";
import {
  Search,
  Filter,
  Plus,
  BookOpen,
  Mountain,
  Flame,
  Clock,
  Trophy,
  Star,
  Sparkles,
  Quote,
  X,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface JournalItem {
  id: string;
  type: "auto_milestone" | "manual";
  title: string;
  content: string;
  icon: string;
  date: string;
  milestone_type?: string;
  milestone_hours?: number;
  user_note?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  mountain: Mountain,
  flame: Flame,
  clock: Clock,
  trophy: Trophy,
  star: Star,
  sparkles: Sparkles,
  book: BookOpen,
  quote: Quote,
};

function detectMilestones(sessions: any[], profile: any): JournalItem[] {
  const items: JournalItem[] = [];
  const totalMinutes = sessions.reduce((acc: number, s: any) => acc + s.duration_minutes, 0);
  const totalHours = totalMinutes / 60;
  const targetHours = profile?.target_hours || 2500;

  const sorted = [...sessions].sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

  if (sorted.length === 0) return items;

  const firstSession = sorted[0];
  items.push({
    id: "journey_start",
    type: "auto_milestone",
    title: "The journey begins.",
    content: "Your first step toward the summit. Every hour counts.",
    icon: "mountain",
    date: firstSession.started_at,
    milestone_type: "journey_start",
  });

  const milestoneHours = [100, 500, 1000, 2500].filter((h) => h <= targetHours);
  let cumulative = 0;
  for (const session of sorted) {
    cumulative += session.duration_minutes / 60;
    const matched = milestoneHours.find((h) => cumulative >= h && cumulative - session.duration_minutes / 60 < h);
    if (matched && !items.find((i) => i.milestone_hours === matched)) {
      items.push({
        id: `hours_${matched}`,
        type: "auto_milestone",
        title: `${matched} Hours`,
        content: getMilestoneMessage(matched),
        icon: matched >= 1000 ? "sparkles" : matched >= 500 ? "trophy" : "clock",
        date: session.started_at,
        milestone_type: "hours",
        milestone_hours: matched,
      });
    }
  }

  const dates = [...new Set(sorted.map((s: any) => new Date(s.started_at).toISOString().split("T")[0]))].sort();
  let streak = 1;
  let streakStart = dates[0];
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else {
      if (streak >= 7 && !items.find((it) => it.milestone_type === "streak" && it.milestone_hours === streak)) {
        items.push({
          id: `streak_${streak}_${dates[i - 1]}`,
          type: "auto_milestone",
          title: `${streak}-Day Streak`,
          content: "Consistency is becoming your superpower.",
          icon: "flame",
          date: dates[i - 1],
          milestone_type: "streak",
          milestone_hours: streak,
        });
      }
      streak = 1;
      streakStart = dates[i];
    }
  }
  if (streak >= 7 && !items.find((it) => it.milestone_type === "streak" && it.milestone_hours === streak)) {
    items.push({
      id: `streak_${streak}_${dates[dates.length - 1]}`,
      type: "auto_milestone",
      title: `${streak}-Day Streak`,
      content: "Consistency is becoming your superpower.",
      icon: "flame",
      date: dates[dates.length - 1],
      milestone_type: "streak",
      milestone_hours: streak,
    });
  }

  return items;
}

export function JournalPage({ initialDate }: { initialDate?: string }) {
  const supabase = createClient();
  const { sessions } = useSessionStore();
  const { showToast } = useUIStore();
  const [profile, setProfile] = useState<any>(null);
  const [manualEntries, setManualEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "milestone" | "manual">("all");
  const [dateFilter, setDateFilter] = useState(initialDate || "");
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (pData && !cancelled) setProfile(pData);

      const { data: jData } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (jData && !cancelled) setManualEntries(jData);
      if (!cancelled) setLoading(false);
    };
    loadData();
    return () => { cancelled = true; };
  }, []);

  const milestoneItems = useMemo(() => {
    if (!profile || sessions.length === 0) return [];
    return detectMilestones(sessions, profile);
  }, [sessions, profile]);

  const allEntries: JournalItem[] = [
    ...milestoneItems,
    ...manualEntries.map((e) => ({
      id: e.id,
      type: "manual" as const,
      title: e.title,
      content: e.content,
      icon: e.icon || "book",
      date: e.created_at,
      user_note: e.user_note,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = allEntries.filter((entry) => {
    if (filterType === "milestone" && entry.type !== "auto_milestone") return false;
    if (filterType === "manual" && entry.type !== "manual") return false;
    if (dateFilter) {
      const entryDate = entry.date.slice(0, 10);
      if (entryDate !== dateFilter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q) ||
        (entry.user_note || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateEntry = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const entry = {
      id: crypto.randomUUID(),
      user_id: user.id,
      type: "manual",
      title: newTitle.trim(),
      content: newContent.trim(),
      icon: "book",
      user_note: newNote.trim() || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("journal_entries").insert(entry);
    if (!error) {
      setManualEntries((prev) => [entry, ...prev]);
      setShowNewEntry(false);
      setNewTitle("");
      setNewContent("");
      setNewNote("");
      showToast("Journal entry created!", "success");
    }
  };

  const handleDeleteEntry = async (id: string) => {
    const { error } = await supabase.from("journal_entries").delete().eq("id", id);
    if (!error) {
      setManualEntries((prev) => prev.filter((e) => e.id !== id));
      showToast("Entry deleted", "info");
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full max-w-md rounded-xl" variant="rectangular" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" variant="rectangular" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Journey Journal</h1>
          <p className="text-text-secondary mt-1">Your preparation timeline. Every milestone, every moment.</p>
        </div>
        <Button onClick={() => setShowNewEntry(true)} className="gap-2">
          <Plus size={16} />
          New Entry
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
          <input
            type="text"
            placeholder="Search journal entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-xl border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <div className="flex gap-1.5 bg-surface-secondary rounded-xl p-1 border border-border">
          {[
            { id: "all" as const, label: "All" },
            { id: "milestone" as const, label: "Milestones" },
            { id: "manual" as const, label: "Manual" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all max-sm:py-2.5",
                filterType === f.id
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {dateFilter && (
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="primary" className="gap-1.5">
            <Calendar size={12} />
            {(() => {
              const d = new Date(dateFilter + "T00:00:00");
              return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
            })()}
            <button
              onClick={() => setDateFilter("")}
              className="ml-1 hover:text-primary-200 transition-colors"
            >
              <X size={12} />
            </button>
          </Badge>
          <span className="text-xs text-text-tertiary">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-16 w-16 text-primary-200 mx-auto mb-4" />
          <p className="text-text-secondary text-lg">No journal entries yet</p>
          <p className="text-text-tertiary text-sm mt-1">Start studying and milestones will appear automatically.</p>
          <Button className="mt-4" onClick={() => setShowNewEntry(true)}>
            Write Your First Entry
          </Button>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-300 via-primary-200 to-transparent" />
            <div className="space-y-6">
              {filtered.map((entry, idx) => {
                const IconComp = ICON_MAP[entry.icon] || BookOpen;
                const isAuto = entry.type === "auto_milestone";
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative pl-12"
                  >
                    <div className={cn(
                      "absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-2 border-surface z-10",
                      isAuto ? "bg-primary-600" : "bg-surface-secondary"
                    )}>
                      {IconComp && <IconComp size={16} className={isAuto ? "text-white" : "text-primary-600"} />}
                    </div>
                    <Card className={cn(
                      "p-4 md:p-5",
                      isAuto ? "border-primary-200 dark:border-primary-800" : ""
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            {isAuto ? (
                              <Badge variant="primary">Milestone</Badge>
                            ) : (
                              <Badge variant="neutral">Manual</Badge>
                            )}
                            {entry.milestone_hours && (
                              <Badge variant="info">{entry.milestone_hours}h</Badge>
                            )}
                            <span className="text-xs text-text-tertiary">
                              {formatRelativeDate(entry.date)}
                            </span>
                          </div>
                          <CardTitle className="text-base mb-1">{entry.title}</CardTitle>
                          <p className="text-sm text-text-secondary">{entry.content}</p>
                          {entry.user_note && (
                            <div className="mt-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                              <p className="text-xs text-text-tertiary mb-1">Your note:</p>
                              <p className="text-sm text-text-primary">{entry.user_note}</p>
                            </div>
                          )}
                        </div>
                        {!isAuto && (
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="shrink-0 p-1.5 rounded-lg text-text-tertiary hover:bg-surface-tertiary hover:text-error transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Modal open={showNewEntry} onClose={() => setShowNewEntry(false)} title="New Journal Entry" size="md">
        <div className="space-y-4">
          <Input
            id="title"
            label="Title"
            placeholder="What did you accomplish?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Your Story</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write about your study session, what you learned, how you felt..."
              className="w-full h-32 rounded-xl border border-border bg-surface p-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Note to self (optional)</label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Private note..."
              className="w-full h-20 rounded-xl border border-border bg-surface p-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowNewEntry(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleCreateEntry}>
              Save Entry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
