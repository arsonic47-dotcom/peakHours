"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTimerStore, formatTimerTime } from "@/lib/store/timerStore";

const MODE_MAP: Record<string, string> = {
  pomodoro: "Pomodoro",
  "fifty-ten": "50/10",
  "ninety-twenty": "90/20",
  custom: "Custom",
};

const PIP_HTML = `<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  background:#0B1738;
  color:#FFFEFE;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  height:100vh;
  padding:12px 12px 8px;
  text-align:center;
  user-select:none;
}
.emoji{font-size:22px;margin-bottom:1px;line-height:1}
.timer{
  font-size:40px;font-weight:700;color:#FFFEFE;
  line-height:1.1;letter-spacing:1px;margin-bottom:2px;
  font-variant-numeric:tabular-nums;
}
.phase{font-size:11px;color:#4B6FE0;margin-bottom:4px;font-weight:600;letter-spacing:0.5px}
.badge{
  display:inline-block;background:#4B6FE0;color:#FFFEFE;
  font-size:9px;padding:2px 10px;border-radius:20px;font-weight:600;margin-bottom:10px;
}
.controls{display:flex;gap:6px}
.btn{
  background:transparent;border:1.5px solid #4B6FE0;color:#4B6FE0;
  padding:5px 14px;border-radius:20px;font-size:11px;font-weight:600;
  cursor:pointer;transition:all .15s;font-family:inherit;
  display:inline-flex;align-items:center;gap:4px;
}
.btn:hover{background:#4B6FE0;color:#FFFEFE}
.btn-pause{padding:5px 18px}
.back{color:#4B6FE0;font-size:10px;cursor:pointer;margin-top:6px;opacity:.7;border:none;background:none;font-family:inherit}
.back:hover{opacity:1}
</style>
</head>
<body>
<div class="emoji" id="pe-emoji">🎯</div>
<div class="timer" id="pe-timer">25:00</div>
<div class="phase" id="pe-phase">Focus Time</div>
<div class="badge" id="pe-badge">Pomodoro</div>
<div class="controls">
<button class="btn btn-pause" id="pe-pause">⏸ Pause</button>
<button class="btn" id="pe-stop">⏹ Stop</button>
</div>
<button class="back" id="pe-back">↗ Back to Timer</button>
</body>
</html>`;

export function useFloatingTimer() {
  const pipRef = useRef<Window | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSupported =
    typeof window !== "undefined" && "documentPictureInPicture" in window;

  const render = useCallback(() => {
    const pip = pipRef.current;
    if (!pip || pip.closed) return;
    const doc = pip.document;
    const state = useTimerStore.getState();

    const emoji = doc.getElementById("pe-emoji");
    const timer = doc.getElementById("pe-timer");
    const phase = doc.getElementById("pe-phase");
    const badge = doc.getElementById("pe-badge");
    const pause = doc.getElementById("pe-pause");

    if (timer) timer.textContent = formatTimerTime(state.timeLeft);
    if (phase) phase.textContent = state.isBreak ? "Break Time" : "Focus Time";
    if (emoji) emoji.textContent = state.isBreak ? "☕" : "🎯";
    if (badge) badge.textContent = MODE_MAP[state.mode] || state.mode;
    if (pause) pause.textContent = state.isRunning ? "⏸ Pause" : "▶ Resume";
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    render();
    intervalRef.current = setInterval(render, 500);
  }, [render]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const open = useCallback(async () => {
    if (!isSupported) return;
    if (pipRef.current && !pipRef.current.closed) {
      pipRef.current.focus();
      return;
    }

    try {
      const pip = await (
        window as unknown as {
          documentPictureInPicture: {
            requestWindow: (o: {
              width: number;
              height: number;
            }) => Promise<Window>;
          };
        }
      ).documentPictureInPicture.requestWindow({ width: 280, height: 210 });

      pipRef.current = pip;
      setIsOpen(true);

      pip.document.write(PIP_HTML);
      pip.document.close();

      const attach = (id: string, msg: string) => {
        pip.document.getElementById(id)?.addEventListener("click", () => {
          pip.postMessage(msg, window.location.origin);
        });
      };
      attach("pe-pause", "pip-pause");
      attach("pe-stop", "pip-stop");
      attach("pe-back", "pip-focus");

      startPolling();

      pip.addEventListener("pagehide", () => {
        pipRef.current = null;
        setIsOpen(false);
        stopPolling();
      });
    } catch {
      pipRef.current = null;
      setIsOpen(false);
    }
  }, [isSupported, startPolling, stopPolling]);

  const close = useCallback(() => {
    if (pipRef.current && !pipRef.current.closed) {
      pipRef.current.close();
    }
    pipRef.current = null;
    setIsOpen(false);
    stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    return () => close();
  }, [close]);

  return { open, close, isOpen, isSupported, pipWindow: pipRef };
}
