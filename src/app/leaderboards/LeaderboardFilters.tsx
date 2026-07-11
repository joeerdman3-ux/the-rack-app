"use client";

import { useRouter, usePathname } from "next/navigation";
import { MAIN_LIFTS, type MainLift } from "@/lib/lifting/constants";
import type { SBDLift } from "@/lib/standards/benchmarks";

const SBD_LIFTS = MAIN_LIFTS.filter((l): l is SBDLift => l !== "Overhead Press");

export function LeaderboardFilters({
  lift,
  sex,
  groupBy,
}: {
  lift: SBDLift;
  sex: "M" | "F";
  groupBy: "weightClass" | "overall";
}) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (next: Partial<{ lift: MainLift; sex: string; groupBy: string }>) => {
    const params = new URLSearchParams({ lift, sex, groupBy, ...next });
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <select
        value={lift}
        onChange={(e) => navigate({ lift: e.target.value as MainLift })}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-white outline-none focus:border-orange-500"
      >
        {SBD_LIFTS.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>

      <select
        value={sex}
        onChange={(e) => navigate({ sex: e.target.value })}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-white outline-none focus:border-orange-500"
      >
        <option value="M">Men</option>
        <option value="F">Women</option>
      </select>

      <div className="flex rounded-md border border-neutral-700 text-sm">
        <button
          type="button"
          onClick={() => navigate({ groupBy: "weightClass" })}
          className={`rounded-l-md px-3 py-1.5 ${groupBy === "weightClass" ? "bg-orange-600 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
        >
          By Weight Class
        </button>
        <button
          type="button"
          onClick={() => navigate({ groupBy: "overall" })}
          className={`rounded-r-md px-3 py-1.5 ${groupBy === "overall" ? "bg-orange-600 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
        >
          Overall
        </button>
      </div>
    </div>
  );
}
