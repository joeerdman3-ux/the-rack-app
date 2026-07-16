"use client";

import { useState } from "react";
import type { deleteProgram } from "./actions";

export function DeleteProgramButton({
  programId,
  action,
}: {
  programId: string;
  action: typeof deleteProgram;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-neutral-700 px-2 py-1.5 text-xs text-neutral-500 hover:border-red-800 hover:text-red-300"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="whitespace-nowrap text-neutral-400">Delete?</span>
      <form action={action.bind(null, programId)}>
        <button
          type="submit"
          className="rounded-md border border-red-800 px-2 py-1.5 text-red-300 hover:bg-red-950"
        >
          Delete
        </button>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-md border border-neutral-700 px-2 py-1.5 text-neutral-300 hover:bg-neutral-800"
      >
        Cancel
      </button>
    </div>
  );
}
