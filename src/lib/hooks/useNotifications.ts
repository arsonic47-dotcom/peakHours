"use client";

import { useCallback, useRef, useState } from "react";

const PERM_KEY = "peakhours-notification-permission";
const VOLUME_KEY = "peakhours-sound-volume";

function getSavedVolume(): number {
  if (typeof window === "undefined") return 0.3;
  try {
    const v = localStorage.getItem(VOLUME_KEY);
    if (v !== null) {
      const n = parseFloat(v);
      if (!isNaN(n) && n >= 0 && n <= 1) return n;
    }
  } catch {}
  return 0.3;
}

export function useNotifications() {
  const unlockedRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(getSavedVolume());
  const lastSoundRef = useRef<string | null>(null);
  const onEndRef = useRef<(() => void) | undefined>(undefined);
  const [volume, setVolumeState] = useState(volumeRef.current);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    volumeRef.current = clamped;
    setVolumeState(clamped);
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = clamped;
    }
    try {
      localStorage.setItem(VOLUME_KEY, clamped.toString());
    } catch {}
  }, []);

  const initAudio = useCallback(() => {
    if (unlockedRef.current) return;
    try {
      const a = new Audio("/sounds/complete.mp3");
      a.volume = 0.001;
      a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
      unlockedRef.current = true;
    } catch {}
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") return;
    if (Notification.permission === "denied") return;

    const result = await Notification.requestPermission();
    if (result === "granted") {
      localStorage.setItem(PERM_KEY, "granted");
    }
  }, []);

  const stopSound = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    onEndRef.current?.();
    onEndRef.current = undefined;
  }, []);

  const playUrl = useCallback((url: string) => {
    lastSoundRef.current = url;
    const existing = currentAudioRef.current;
    if (existing) {
      existing.currentTime = 0;
      existing.play().catch(() => {});
      return;
    }
    const a = new Audio(url);
    a.volume = volumeRef.current;
    currentAudioRef.current = a;
    a.addEventListener("ended", () => {
      if (currentAudioRef.current === a) currentAudioRef.current = null;
      onEndRef.current?.();
    });
    a.play().catch(() => {
      if (currentAudioRef.current === a) currentAudioRef.current = null;
      onEndRef.current?.();
    });
  }, []);

  const replaySound = useCallback(() => {
    const url = lastSoundRef.current;
    if (!url) return;
    try {
      stopSound();
      playUrl(url);
    } catch {}
  }, [playUrl]);

  const getSoundDuration = useCallback((url: string): Promise<number | null> => {
    return new Promise((resolve) => {
      try {
        const a = new Audio(url);
        a.preload = "auto";
        let settled = false;
        const done = (value: number | null) => {
          if (settled) return;
          settled = true;
          a.removeEventListener("loadedmetadata", onMeta);
          a.removeEventListener("durationchange", onDur);
          clearTimeout(timer);
          resolve(value);
        };
        const onMeta = () => {
          if (Number.isFinite(a.duration) && a.duration > 0) done(a.duration);
        };
        const onDur = () => {
          if (Number.isFinite(a.duration) && a.duration > 0) done(a.duration);
        };
        a.addEventListener("loadedmetadata", onMeta);
        a.addEventListener("durationchange", onDur);
        const timer = setTimeout(() => done(null), 4000);
        a.load();
      } catch {
        resolve(null);
      }
    });
  }, []);

  const scheduleBreakSound = useCallback(
    (url: string, breakEndAt: number, onEnd?: () => void) => {
      let cancelled = false;
      let startTimer: ReturnType<typeof setTimeout> | undefined;
      let endTimer: ReturnType<typeof setTimeout> | undefined;

      const cancel = () => {
        cancelled = true;
        if (startTimer !== undefined) clearTimeout(startTimer);
        if (endTimer !== undefined) clearTimeout(endTimer);
      };

      (async () => {
        const durationMs = await getSoundDuration(url);
        if (cancelled) return;

        const now = Date.now();
        const breakDurMs = breakEndAt - now;
        if (breakDurMs <= 0) return;

        const d = durationMs !== null ? Math.round(durationMs * 1000) : breakDurMs;
        const startDelay = Math.max(0, breakDurMs - d);

        const play = () => {
          if (cancelled) return;
          stopSound();
          playUrl(url);
          const a = currentAudioRef.current;
          if (a) {
            a.addEventListener("timeupdate", () => {
              if (cancelled) return;
              if (Date.now() >= breakEndAt - 50) {
                stopSound();
                onEnd?.();
              }
            });
          }
        };

        if (startDelay <= 0) play();
        else startTimer = setTimeout(play, startDelay);

        endTimer = setTimeout(() => {
          if (cancelled) return;
          stopSound();
          onEnd?.();
        }, breakDurMs);
      })();

      return cancel;
    },
    [getSoundDuration, stopSound, playUrl]
  );

  const notify = useCallback(
    (title: string, body: string, soundUrl?: string, onEnd?: () => void) => {
      if (typeof window === "undefined") return;

      onEndRef.current = onEnd;

      if (soundUrl) {
        try {
          stopSound();
          playUrl(soundUrl);
        } catch {}
      }

      if ("Notification" in window && Notification.permission === "granted") {
        try {
          const n = new Notification(title, {
            body,
            icon: "/favicon.ico",
          });
          n.onclick = () => {
            window.focus();
            n.close();
          };
        } catch {}
      }
    },
    [playUrl]
  );

  return { requestPermission, notify, initAudio, stopSound, replaySound, playUrl, getSoundDuration, scheduleBreakSound, volume, setVolume };
}
