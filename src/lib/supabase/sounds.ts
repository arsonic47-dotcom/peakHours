import { createClient } from "@/lib/supabase/client";

export type SoundKind = "complete" | "break";

export const SOUND_BUCKET = "sound-files";
export const MAX_SOUND_SIZE = 10 * 1024 * 1024;

export const DEFAULT_SOUNDS: Record<SoundKind, string> = {
  complete: "/sounds/complete.mp3",
  break: "/sounds/break.mp3",
};

export interface SoundFile {
  id: string;
  user_id: string;
  storage_path: string;
  file_name: string;
  size_bytes: number;
  created_at: string;
}

let cachedCompletePath: string | null = null;
let cachedBreakPath: string | null = null;

export function setSoundPaths(
  completePath: string | null | undefined,
  breakPath: string | null | undefined
) {
  cachedCompletePath = completePath ?? null;
  cachedBreakPath = breakPath ?? null;
}

export function getSoundUrl(kind: SoundKind): string {
  const path = kind === "complete" ? cachedCompletePath : cachedBreakPath;
  if (path) return getPublicUrl(path);
  return DEFAULT_SOUNDS[kind];
}

export function getPublicUrl(storagePath: string): string {
  const { data } = createClient()
    .storage.from(SOUND_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

export interface SoundPreferences {
  complete_sound_path: string | null;
  break_sound_path: string | null;
}

export async function getSoundPreferences(): Promise<SoundPreferences> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { complete_sound_path: null, break_sound_path: null };
  const { data } = await supabase
    .from("profiles")
    .select("complete_sound_path, break_sound_path")
    .eq("id", user.id)
    .single();
  return {
    complete_sound_path: data?.complete_sound_path ?? null,
    break_sound_path: data?.break_sound_path ?? null,
  };
}

export async function setSoundPreference(
  kind: SoundKind,
  storagePath: string | null
): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const column = kind === "complete" ? "complete_sound_path" : "break_sound_path";
  const { error } = await supabase
    .from("profiles")
    .update({ [column]: storagePath, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return false;

  if (kind === "complete") setSoundPaths(storagePath, cachedBreakPath);
  else setSoundPaths(cachedCompletePath, storagePath);
  return true;
}

export async function listSounds(userId: string): Promise<SoundFile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sound_files")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return error || !data ? [] : (data as SoundFile[]);
}

export function isValidSoundFile(file: File): string | null {
  if (!file.type.startsWith("audio/")) return "Please choose an audio file";
  if (file.size > MAX_SOUND_SIZE) return "File must be 10 MB or smaller";
  return null;
}

function getExtension(fileName: string): string {
  const parts = fileName.split(".");
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : "";
  return ext.length > 0 && ext.length <= 10 ? ext : "mp3";
}

export async function uploadSound(
  userId: string,
  file: File
): Promise<{ sound: SoundFile | null; error: string | null }> {
  const validationError = isValidSoundFile(file);
  if (validationError) return { sound: null, error: validationError };

  const supabase = createClient();
  const storagePath = `${userId}/${crypto.randomUUID()}.${getExtension(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(SOUND_BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type });
  if (uploadError) return { sound: null, error: uploadError.message || "Upload failed" };

  const { data, error } = await supabase
    .from("sound_files")
    .insert({
      user_id: userId,
      storage_path: storagePath,
      file_name: file.name,
      size_bytes: file.size,
    })
    .select()
    .single();

  if (error || !data) return { sound: null, error: error?.message || "Failed to save sound" };
  return { sound: data as SoundFile, error: null };
}

export async function deleteSound(file: SoundFile): Promise<boolean> {
  const supabase = createClient();
  const { error: storageError } = await supabase.storage
    .from(SOUND_BUCKET)
    .remove([file.storage_path]);
  if (storageError) return false;

  const { error } = await supabase.from("sound_files").delete().eq("id", file.id);
  if (error) return false;

  const prefs = await getSoundPreferences();
  if (prefs.complete_sound_path === file.storage_path) {
    await setSoundPreference("complete", null);
  }
  if (prefs.break_sound_path === file.storage_path) {
    await setSoundPreference("break", null);
  }
  return true;
}
