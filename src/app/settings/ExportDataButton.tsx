"use client";

import { useState } from "react";
import type { exportTrainingData } from "./actions";

// Server actions return data, not files — the actual browser download is
// triggered here via a Blob + a temporary <a download>, the standard
// client-side approach, no email/external service involved.
export function ExportDataButton({ action }: { action: typeof exportTrainingData }) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(false);

  async function handleExport() {
    setExporting(true);
    setError(false);
    const result = await action();
    setExporting(false);

    if (!result.success) {
      setError(true);
      return;
    }

    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `the-rack-training-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className="w-full rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {exporting ? "Preparing export..." : "Export my data (CSV)"}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-300">Couldn&apos;t generate the export. Try again.</p>
      )}
    </div>
  );
}
