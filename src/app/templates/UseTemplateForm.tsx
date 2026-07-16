"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { applyTemplateChecked } from "./actions";

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
  const [creating, setCreating] = useState(false);

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
      action={async (formData) => {
        setCreating(true);
        const result = await action(formData);
        if (result.success) {
          router.push(`/programs/${result.programId}`);
        } else {
          setCreating(false);
        }
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
        disabled={creating}
        className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {creating ? "Creating..." : "Create Program"}
      </button>
      <button
        type="button"
        onClick={() => setUsing(false)}
        disabled={creating}
        className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Cancel
      </button>
    </form>
  );
}
