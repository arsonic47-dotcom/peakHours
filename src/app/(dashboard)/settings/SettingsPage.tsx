"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUIStore } from "@/lib/store/uiStore";
import { useRouter } from "next/navigation";
import { User, Mountain, Bell, Palette, LogOut } from "lucide-react";

export function SettingsPage() {
  const { theme, toggleTheme, showToast } = useUIStore();
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [targetHours, setTargetHours] = useState("2500");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setName(data.display_name);
        setTargetHours(data.target_hours.toString());
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Please sign in again", "error");
      setLoading(false);
      return;
    }

    const parsedTargetHours = parseInt(targetHours);
    if (isNaN(parsedTargetHours) || parsedTargetHours <= 0) {
      showToast("Target hours must be a positive number", "error");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name,
        target_hours: parsedTargetHours,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      showToast(error.message || "Failed to save settings", "error");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/login");
    }
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your profile and preferences.</p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <CardTitle className="flex items-center gap-2 mb-4">
            <User size={18} className="text-primary-600" />
            Profile
          </CardTitle>
          <div className="space-y-4">
            <Input
              id="name"
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div>
              <Input
                id="target"
                label="Target Hours"
                type="number"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
              />
              <p className="text-xs text-text-tertiary mt-1">Your total journey goal. Reach this to complete your climb.</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <CardTitle className="flex items-center gap-2 mb-4">
            <Palette size={18} className="text-primary-600" />
            Appearance
          </CardTitle>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Dark Mode</p>
              <p className="text-sm text-text-tertiary">Switch between light and dark themes</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                theme === "dark" ? "bg-primary-600" : "bg-surface-tertiary"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  theme === "dark" ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <Button onClick={handleSave} loading={loading}>
            {saved ? "Saved!" : "Save Changes"}
          </Button>
          <Button variant="danger" onClick={handleSignOut} className="gap-2">
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
