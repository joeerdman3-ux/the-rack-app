"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogForm } from "./LogForm";
import { AccessoryLogForm, type AccessoryExerciseOption } from "./AccessoryLogForm";
import { LogSetsForm } from "./LogSetsForm";
import { RestTimer } from "@/components/RestTimer";
import type { Unit } from "@/lib/lifting/plates";
import type { logSet } from "./actions";
import type { logAccessorySet, createExercise } from "./accessoryActions";

export function LoggingSection({
  unit,
  exercises,
  logSetAction,
  logAccessoryAction,
  createExerciseAction,
  mainRestSeconds,
  accessoryRestSeconds,
}: {
  unit: Unit;
  exercises: AccessoryExerciseOption[];
  logSetAction: typeof logSet;
  logAccessoryAction: typeof logAccessorySet;
  createExerciseAction: typeof createExercise;
  mainRestSeconds: number;
  accessoryRestSeconds: number;
}) {
  // A "Log this set" link from Today's Session carries ?exerciseId= for
  // accessory-routed exercises — open straight into the Accessory tab.
  const searchParams = useSearchParams();
  // ?logExerciseId= (Exercise Library's "Log this" link) opens straight
  // into the Log Sets tab pre-selected — deliberately a separate param
  // from ?exerciseId=, which already means "open Accessory tab
  // pre-filled" for Today's Session's links, so the two routes can't
  // collide.
  const [mode, setMode] = useState<"main" | "accessory" | "logSets">(
    searchParams.get("logExerciseId")
      ? "logSets"
      : searchParams.get("exerciseId")
        ? "accessory"
        : "main",
  );

  // Lives here (not inside any individual tab's form) so the countdown
  // keeps running and stays visible even if the user switches tabs
  // mid-rest — e.g. resting after a main-lift set while logging an
  // accessory set on another tab. sessionKey changes on every new log so
  // <RestTimer> fully remounts and restarts, rather than needing its own
  // reset-on-prop-change logic.
  const [timerSession, setTimerSession] = useState<{ seconds: number; sessionKey: number } | null>(
    null,
  );
  function startTimer(seconds: number) {
    setTimerSession({ seconds, sessionKey: Date.now() });
  }

  return (
    <div>
      {timerSession && (
        <RestTimer
          key={timerSession.sessionKey}
          initialSeconds={timerSession.seconds}
          onDismiss={() => setTimerSession(null)}
        />
      )}

      <div className="mb-4 flex w-fit rounded-md border border-neutral-700 text-sm">
        <button
          type="button"
          onClick={() => setMode("main")}
          className={`rounded-l-md px-3 py-1.5 ${mode === "main" ? "bg-orange-600 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
        >
          Main Lift
        </button>
        <button
          type="button"
          onClick={() => setMode("accessory")}
          className={`px-3 py-1.5 ${mode === "accessory" ? "bg-orange-600 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
        >
          Accessory
        </button>
        <button
          type="button"
          onClick={() => setMode("logSets")}
          className={`rounded-r-md px-3 py-1.5 ${mode === "logSets" ? "bg-orange-600 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
        >
          Log Sets
        </button>
      </div>

      {mode === "main" ? (
        <LogForm unit={unit} action={logSetAction} onLogged={() => startTimer(mainRestSeconds)} />
      ) : mode === "accessory" ? (
        <AccessoryLogForm
          unit={unit}
          exercises={exercises}
          action={logAccessoryAction}
          onLogged={() => startTimer(accessoryRestSeconds)}
        />
      ) : (
        <LogSetsForm
          unit={unit}
          exercises={exercises}
          action={logAccessoryAction}
          createExerciseAction={createExerciseAction}
          onLogged={() => startTimer(accessoryRestSeconds)}
        />
      )}
    </div>
  );
}
