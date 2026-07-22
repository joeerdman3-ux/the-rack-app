"use client";

import { useEffect, useRef, useState } from "react";

// Rendered with a `key` that changes every time a new rest session starts
// (see LoggingSection), so a fresh set log always fully remounts/resets
// this component rather than needing extra reset logic here.
export function RestTimer({
  initialSeconds,
  onDismiss,
}: {
  initialSeconds: number;
  onDismiss: () => void;
}) {
  // Tracked as a fixed end timestamp rather than decrementing a counter
  // each tick — self-corrects if the tab is backgrounded/throttled
  // instead of drifting, since remaining time is always recomputed from
  // the wall clock.
  const [endTime, setEndTime] = useState(() => Date.now() + initialSeconds * 1000);
  const [remaining, setRemaining] = useState(initialSeconds);
  const alertedRef = useRef(false);

  useEffect(() => {
    function tick() {
      const secondsLeft = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setRemaining(secondsLeft);
    }
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endTime]);

  const finished = remaining === 0;

  useEffect(() => {
    if (!finished || alertedRef.current) return;
    alertedRef.current = true;

    // Best-effort alert: no PWA/service worker in this app, and the
    // Notification API needs a permission prompt and doesn't work in
    // iOS Safari outside an installed PWA — so this sticks to vibration
    // + an in-page beep, both zero-permission and reliable while the tab
    // is open. The visual "Rest complete" state below is the fallback
    // that always works regardless of device support.
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    try {
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      oscillator.frequency.value = 880;
      oscillator.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio can be blocked without a prior user gesture in this tab —
      // vibration (if supported) and the visual state still fire above.
    }
  }, [finished]);

  function adjust(deltaSeconds: number) {
    setEndTime((prev) => Math.max(Date.now(), prev + deltaSeconds * 1000));
    alertedRef.current = false;
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div
      className={`mb-4 flex items-center justify-between rounded-md border px-4 py-2 ${
        finished ? "border-orange-500 bg-orange-950" : "border-neutral-700 bg-neutral-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-lg font-semibold tabular-nums text-white">
          {finished ? "Rest complete" : `${minutes}:${String(seconds).padStart(2, "0")}`}
        </span>
        <button
          type="button"
          onClick={() => adjust(-30)}
          className="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
        >
          -30s
        </button>
        <button
          type="button"
          onClick={() => adjust(30)}
          className="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
        >
          +30s
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs text-neutral-400 hover:text-neutral-200"
      >
        Dismiss
      </button>
    </div>
  );
}
