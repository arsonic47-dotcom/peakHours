"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTimerStore, formatTimerTime } from "@/lib/store/timerStore";

const MODE_MAP: Record<string, string> = {
  pomodoro: "Pomodoro",
  "fifty-ten": "50/10",
  "ninety-twenty": "90/20",
  custom: "Custom",
};

interface FloatingTimerActions {
  onToggleRunning?: () => void;
  onStop?: () => void;
}

const PIP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
:root{color-scheme:dark}
*{margin:0;padding:0;box-sizing:border-box}
body{
  min-height:100vh;
  overflow:hidden;
  background:#08111f;
  color:#f8fafc;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  padding:12px;
  user-select:none;
}
.shell{
  width:100%;
  height:100%;
  min-height:206px;
  display:grid;
  grid-template-rows:auto auto auto auto 1fr auto;
  align-content:center;
  gap:10px;
  padding:16px;
  border:1px solid rgba(148,163,184,.22);
  border-radius:16px;
  background:
    radial-gradient(circle at 20% 0%, rgba(59,130,246,.34), transparent 35%),
    linear-gradient(145deg, #0f172a 0%, #111827 52%, #08111f 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 18px 45px rgba(0,0,0,.28);
}
.topline{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  color:#cbd5e1;
  font-size:11px;
  font-weight:700;
  letter-spacing:.3px;
  text-transform:uppercase;
}
.status-dot{
  width:8px;
  height:8px;
  border-radius:999px;
  background:#22c55e;
  box-shadow:0 0 14px rgba(34,197,94,.7);
}
.status-dot.paused{
  background:#f59e0b;
  box-shadow:0 0 14px rgba(245,158,11,.58);
}
.timer{
  color:#ffffff;
  text-align:center;
  font-size:44px;
  font-weight:800;
  line-height:1;
  letter-spacing:.3px;
  font-variant-numeric:tabular-nums;
}
.phase-row{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  min-width:0;
}
.phase{
  color:#dbeafe;
  font-size:12px;
  font-weight:700;
}
.badge{
  max-width:112px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  color:#bfdbfe;
  background:rgba(37,99,235,.22);
  border:1px solid rgba(147,197,253,.26);
  font-size:10px;
  padding:3px 8px;
  border-radius:999px;
  font-weight:800;
}
.progress{
  height:7px;
  overflow:hidden;
  border-radius:999px;
  background:rgba(148,163,184,.18);
  box-shadow:inset 0 1px 2px rgba(0,0,0,.16);
}
.progress span{
  display:block;
  height:100%;
  width:0%;
  border-radius:inherit;
  background:linear-gradient(90deg,#60a5fa,#22c55e);
  transition:width .35s ease;
}
.controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-self:end}
.btn{
  height:36px;
  border:0;
  border-radius:10px;
  font-size:12px;
  font-weight:800;
  cursor:pointer;
  transition:transform .15s ease,filter .15s ease;
  font-family:inherit;
}
.btn:hover{filter:brightness(1.08)}
.btn:active{transform:scale(.98)}
.btn.primary{background:#2563eb;color:#fff;box-shadow:0 10px 20px rgba(37,99,235,.26)}
.btn.danger{background:rgba(248,113,113,.13);color:#fecaca;border:1px solid rgba(248,113,113,.22)}
.back{
  justify-self:center;
  color:#93c5fd;
  font-size:11px;
  cursor:pointer;
  border:none;
  background:none;
  font-family:inherit;
  font-weight:700;
}
.back:hover{color:#dbeafe}
</style>
</head>
<body>
<main class="shell" aria-label="Floating focus timer">
  <div class="topline"><span class="status-dot" id="pe-dot"></span><span id="pe-state">Paused</span></div>
  <div class="timer" id="pe-timer">25:00</div>
  <div class="phase-row">
    <span class="phase" id="pe-phase">Focus Time</span>
    <span class="badge" id="pe-badge">Pomodoro</span>
  </div>
  <div class="progress" aria-hidden="true"><span id="pe-progress"></span></div>
  <div class="controls">
    <button class="btn primary" id="pe-pause" type="button">Resume</button>
    <button class="btn danger" id="pe-stop" type="button">Stop</button>
  </div>
  <button class="back" id="pe-back" type="button">Back to timer</button>
</main>
</body>
</html>`;

export function useFloatingTimer(actions: FloatingTimerActions = {}) {
  const pipRef = useRef<Window | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const actionsRef = useRef(actions);

  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    setIsSupported("documentPictureInPicture" in window);
  }, []);

  const render = useCallback(() => {
    const pip = pipRef.current;
    if (!pip || pip.closed) return;
    const doc = pip.document;
    const state = useTimerStore.getState();

    const timer = doc.getElementById("pe-timer");
    const phase = doc.getElementById("pe-phase");
    const badge = doc.getElementById("pe-badge");
    const pause = doc.getElementById("pe-pause");
    const stateLabel = doc.getElementById("pe-state");
    const progress = doc.getElementById("pe-progress");
    const dot = doc.getElementById("pe-dot");
    const duration = (state.isBreak ? state.config.break : state.config.work) * 60;
    const elapsed = Math.max(0, duration - state.timeLeft);
    const progressPct = duration > 0 ? Math.min(100, Math.round((elapsed / duration) * 100)) : 0;

    if (timer) timer.textContent = formatTimerTime(state.timeLeft);
    if (phase) phase.textContent = state.isBreak ? "Break Time" : "Focus Time";
    if (badge) badge.textContent = MODE_MAP[state.mode] || state.mode;
    if (pause) pause.textContent = state.isRunning ? "Pause" : "Resume";
    if (stateLabel) stateLabel.textContent = state.isRunning ? "Running" : "Paused";
    if (progress) progress.style.width = `${progressPct}%`;
    if (dot) dot.classList.toggle("paused", !state.isRunning);
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    render();
    intervalRef.current = setInterval(render, 500);
  }, [render, stopPolling]);

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
      ).documentPictureInPicture.requestWindow({ width: 320, height: 240 });

      pipRef.current = pip;
      setIsOpen(true);

      pip.document.write(PIP_HTML);
      pip.document.close();

      pip.document.getElementById("pe-pause")?.addEventListener("click", () => {
        actionsRef.current.onToggleRunning?.();
        render();
      });
      pip.document.getElementById("pe-stop")?.addEventListener("click", () => {
        window.focus();
        actionsRef.current.onStop?.();
        render();
      });
      pip.document.getElementById("pe-back")?.addEventListener("click", () => {
        window.focus();
        pip.close();
      });

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
  }, [isSupported, render, startPolling, stopPolling]);

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

  return { open, close, isOpen, isSupported };
}
