"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { applyTemplateChecked } from "./actions";

// Guarantees "Creating..." is visible for at least this long, even when the
// round trip resolves almost instantly (e.g. on a fast connection) — without
// this, a sub-frame pending state is functionally invisible, which is
// exactly the ambiguity ("did my tap register?") this button exists to
// prevent.
const MIN_PENDING_MS = 400;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function UseTemplateForm({
  templateId,
  templateName,
  action,
}: {
  templateId: string;
  templateName: string;
  action: typeof applyTemplateChecked;
}) {
  const router = useRouter();
  const [using, setUsing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!using) {
    return (
      <button
        type="button"
        onClick={() => setUsing(true)}
        className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-500"
      >
        Use this template
      </button>
    );
  }

  return (
    <form
      action={(formData: FormData) => {
        startTransition(async () => {
          const [result] = await Promise.all([action(formData), wait(MIN_PENDING_MS)]);
          if (result.success) {
            router.push(`/programs/${result.programId}`);
          }
        });
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="template_id" value={templateId} />
      <input
        type="text"
        name="name"
        defaultValue={templateName}
        required
        className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Creating..." : "Create Program"}
      </button>
      <button
        type="button"
        onClick={() => setUsing(false)}
        disabled={isPending}
        className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Cancel
      </button>
    </form>
  );
}
