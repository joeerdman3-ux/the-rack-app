"use client";

import { useState } from "react";
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
  const [using, setUsing] = useState(false);

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
    <form action={action} className="flex items-center gap-2">
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
        className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-500"
      >
        Create Program
      </button>
      <button
        type="button"
        onClick={() => setUsing(false)}
        className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
      >
        Cancel
      </button>
    </form>
  );
}
