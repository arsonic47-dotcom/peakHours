"use client";

import { useCallback, useRef } from "react";

const PERM_KEY = "peakhours-notification-permission";

export function useNotifications() {
  const unlockedRef = useRef(false);

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

  const notify = useCallback(
    (title: string, body: string, soundUrl?: string) => {
      if (typeof window === "undefined") return;

      if (soundUrl) {
        try {
          const a = new Audio(soundUrl);
          a.volume = 0.3;
          a.play().catch(() => {});
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

  return { requestPermission, notify, initAudio };
}
