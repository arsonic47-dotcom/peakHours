"use client";

import { useCallback, useRef } from "react";

const PERM_KEY = "peakhours-notification-permission";

export function useNotifications() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") return;
    if (Notification.permission === "denied") return;

    const result = await Notification.requestPermission();
    if (result === "granted") {
      localStorage.setItem(PERM_KEY, "granted");
    }
  }, []);

  const notify = useCallback(
    (title: string, body: string, soundUrl?: string) => {
      if (typeof window === "undefined") return;

      if (soundUrl) {
        try {
          if (!audioRef.current) audioRef.current = new Audio();
          audioRef.current.src = soundUrl;
          audioRef.current.volume = 0.3;
          audioRef.current.play().catch(() => {});
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
    []
  );

  return { requestPermission, notify };
}
