"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/lib/store/uiStore";
import { Button } from "@/components/ui/Button";
import {
  getPublicUrl,
  getSoundPreferences,
  getSoundUrl,
  listSounds,
  setSoundPaths,
  setSoundPreference,
  uploadSound,
  deleteSound,
  type SoundFile,
  type SoundKind,
} from "@/lib/supabase/sounds";
import { Play, Trash2, Upload, Music } from "lucide-react";

const selectClass =
  "w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-400";

const iconButtonClass =
  "p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary transition-colors";

export function SoundSettings({ variant = "full" }: { variant?: "full" | "compact" }) {
  const { showToast } = useUIStore();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<SoundFile[]>([]);
  const [completePath, setCompletePath] = useState("");
  const [breakPath, setBreakPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const [sounds, prefs] = await Promise.all([listSounds(user.id), getSoundPreferences()]);
    setFiles(sounds);
    setCompletePath(prefs.complete_sound_path ?? "");
    setBreakPath(prefs.break_sound_path ?? "");
    setSoundPaths(prefs.complete_sound_path, prefs.break_sound_path);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Please sign in to upload sounds", "error");
      return;
    }

    setUploading(true);
    const { sound, error } = await uploadSound(user.id, file);
    setUploading(false);

    if (error || !sound) {
      showToast(error || "Upload failed", "error");
      return;
    }

    setFiles((prev) => [sound, ...prev]);
    showToast("Sound uploaded!", "success");
  };

  const handleSelect = async (kind: SoundKind, value: string) => {
    const path = value === "" ? null : value;
    const ok = await setSoundPreference(kind, path);
    if (!ok) {
      showToast("Failed to save sound selection", "error");
      return;
    }
    if (kind === "complete") setCompletePath(value);
    else setBreakPath(value);
    showToast(
      kind === "complete" ? "Complete sound updated" : "Break sound updated",
      "success"
    );
  };

  const handleDelete = async (file: SoundFile) => {
    const ok = await deleteSound(file);
    if (!ok) {
      showToast("Failed to delete sound", "error");
      return;
    }
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    if (completePath === file.storage_path) setCompletePath("");
    if (breakPath === file.storage_path) setBreakPath("");
    showToast("Sound deleted", "info");
  };

  const playPreview = (url: string) => {
    try {
      const a = new Audio(url);
      a.volume = 0.8;
      void a.play();
    } catch {}
  };

  const renderPicker = (kind: SoundKind, label: string, value: string, onChange: (v: string) => void) => (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">{label}</label>
      <div className="flex gap-2">
        <select
          className={selectClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
        >
          <option value="">Default</option>
          {files.map((f) => (
            <option key={f.id} value={f.storage_path}>
              {f.file_name}
            </option>
          ))}
        </select>
        <Button
          size="icon"
          variant="secondary"
          title="Play"
          onClick={() => playPreview(getSoundUrl(kind))}
          disabled={loading}
        >
          <Play size={16} />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderPicker("complete", "Complete sound", completePath, (v) =>
          handleSelect("complete", v)
        )}
        {renderPicker("break", "Break sound", breakPath, (v) => handleSelect("break", v))}
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          loading={uploading}
          className="gap-2"
        >
          <Upload size={16} />
          {uploading ? "Uploading..." : "Upload sound"}
        </Button>
        <p className="text-xs text-text-tertiary mt-2">
          {variant === "full"
            ? "MP3, WAV, OGG, M4A, WEBM\u2026 up to 10 MB. Saved to your account."
            : "Saved to your account."}
        </p>
      </div>

      {variant === "full" && files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
            Your uploaded sounds
          </p>
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-secondary border border-border"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Music size={14} className="text-primary-600 shrink-0" />
                <p className="text-sm font-medium text-text-primary truncate">{f.file_name}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  className={iconButtonClass}
                  title="Play"
                  onClick={() => playPreview(getPublicUrl(f.storage_path))}
                >
                  <Play size={14} />
                </button>
                <button
                  className={iconButtonClass}
                  title="Delete"
                  onClick={() => handleDelete(f)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
