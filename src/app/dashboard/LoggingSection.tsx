"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogForm } from "./LogForm";
import { AccessoryLogForm, type AccessoryExerciseOption } from "./AccessoryLogForm";
import { LogSetsForm } from "./LogSetsForm";
import type { Unit } from "@/lib/lifting/plates";
import type { logSet } from "./actions";
import type { logAccessorySet, createExercise } from "./accessoryActions";

export function LoggingSection({
  unit,
  exercises,
  logSetAction,
  logAccessoryAction,
  createExerciseAction,
}: {
  unit: Unit;
  exercises: AccessoryExerciseOption[];
  logSetAction: typeof logSet;
  logAccessoryAction: typeof logAccessorySet;
  createExerciseAction: typeof createExercise;
}) {
  // A "Log this set" link from Today's Session carries ?exerciseId= for
  // accessory-routed exercises — open straight into the Accessory tab.
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"main" | "accessory" | "logSets">(
    searchParams.get("exerciseId") ? "accessory" : "main",
  );

  return (
    <div>
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
        <LogForm unit={unit} action={logSetAction} />
      ) : mode === "accessory" ? (
        <AccessoryLogForm unit={unit} exercises={exercises} action={logAccessoryAction} />
      ) : (
        <LogSetsForm
          unit={unit}
          exercises={exercises}
          action={logAccessoryAction}
          createExerciseAction={createExerciseAction}
        />
      )}
    </div>
  );
}
