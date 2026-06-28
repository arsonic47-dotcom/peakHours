import Link from "next/link";
import { Mountain, Timer, BookOpen, Trophy, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Mountain className="h-7 w-7 text-primary-600" />
          <span className="font-bold text-xl text-text-primary">PeakHours</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            Start Free
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 px-4 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-300 mb-8">
            <Sparkles size={14} />
            Your study journey, gamified
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-text-primary leading-tight max-w-4xl mx-auto mb-6">
            Turn Your Study Hours Into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-sky-500">
              an Adventure
            </span>
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            Track your focus time, climb a beautiful 3D mountain, unlock achievements,
            and build discipline — one hour at a time.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-8 py-4 text-lg font-semibold text-white hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              Start Your Climb
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-border px-8 py-4 text-lg font-semibold text-text-primary hover:bg-surface-secondary transition-all active:scale-[0.98]"
            >
              Sign In
            </Link>
          </div>
        </section>

        <section className="border-t border-border bg-surface-secondary py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl bg-surface border border-border p-8 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <Timer className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Focus Timer</h3>
                <p className="text-text-secondary leading-relaxed">
                  Pomodoro, 50/10, 90/20, or custom. Each session brings you closer to the summit.
                </p>
              </div>
              <div className="rounded-2xl bg-surface border border-border p-8 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <Mountain className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">3D Mountain</h3>
                <p className="text-text-secondary leading-relaxed">
                  Watch your progress as you climb from base camp to the summit in a living world.
                </p>
              </div>
              <div className="rounded-2xl bg-surface border border-border p-8 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Levels & Rewards</h3>
                <p className="text-text-secondary leading-relaxed">
                  Earn XP, level up, unlock cosmetics, and collect achievements on your journey.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
