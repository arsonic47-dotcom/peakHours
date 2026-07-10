"use client";

import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/lib/store/uiStore";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Timer,
  BookOpen,
  Calendar,
  Mountain,
  Trophy,
  Lightbulb,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Medal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/timer", label: "Focus Timer", icon: Timer },
  { href: "/journal", label: "Journey Journal", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/rankings", label: "Rankings", icon: Medal },
  { href: "/records", label: "Records", icon: Trophy },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/review", label: "Year Review", icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col bg-surface border-r border-border transition-all duration-300",
          sidebarOpen
            ? "translate-x-0 w-64"
            : "max-lg:-translate-x-full lg:translate-x-0 lg:w-16"
        )}
      >
      <div className={cn("flex items-center h-16 px-4 border-b border-border", sidebarOpen ? "justify-between" : "justify-center")}>
        {sidebarOpen && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-primary-600" />
            <span className="font-bold text-lg text-text-primary">PeakHours</span>
          </Link>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                  : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
              )}
            >
              <item.icon size={20} className={cn("shrink-0", isActive && "text-primary-600 dark:text-primary-400")} />
              {sidebarOpen && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            pathname === "/settings"
              ? "bg-primary-50 text-primary-700"
              : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
          )}
        >
          <Settings size={20} className="shrink-0" />
          {sidebarOpen && <span>Settings</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-tertiary hover:text-error transition-all duration-200"
        >
          <LogOut size={20} className="shrink-0" />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
