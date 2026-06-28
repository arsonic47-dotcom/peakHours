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
  }, []);

  const playUrl = useCallback((url: string) => {
    const a = new Audio(url);
    a.volume = volumeRef.current;
    a.play().catch(() => {
      onEndRef.current?.();
    });
    currentAudioRef.current = a;
    a.addEventListener("ended", () => {
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

  const notify = useCallback(
    (title: string, body: string, soundUrl?: string, onEnd?: () => void) => {
      if (typeof window === "undefined") return;

      onEndRef.current = onEnd;

      if (soundUrl) {
        try {
          stopSound();
          lastSoundRef.current = soundUrl;
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

  return { requestPermission, notify, initAudio, stopSound, replaySound, volume, setVolume };
}
