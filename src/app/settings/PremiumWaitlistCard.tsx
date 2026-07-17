"use client";

import { useState } from "react";
import type { joinPremiumWaitlist } from "./actions";

const FEATURES = [
  {
    title: "Trend tracking",
    detail: "see how your sticking points evolve over time, not just your current snapshot",
  },
  {
    title: "Cross-lift correlation",
    detail: "understand how a weakness in one lift is likely affecting another",
  },
  {
    title: "Expanded prescriptions",
    detail: "more accessory options and alternate variations, not just two picks",
  },
  {
    title: "Advanced analytics",
    detail: "volume, fatigue, and recovery scoring",
  },
];

export function PremiumWaitlistCard({
  alreadyJoined,
  action,
}: {
  alreadyJoined: boolean;
  action: typeof joinPremiumWaitlist;
}) {
  const [joined, setJoined] = useState(alreadyJoined);

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      <h2 className="mb-2 text-lg font-semibold text-white">Go Premium</h2>
      <p className="mb-3 text-sm text-neutral-400">
        Premium is coming soon — here&apos;s what&apos;s included:
      </p>
      <ul className="mb-4 list-disc space-y-1.5 pl-5 text-sm text-neutral-300">
        {FEATURES.map((f) => (
          <li key={f.title}>
            <span className="font-medium text-white">{f.title}</span> — {f.detail}
          </li>
        ))}
      </ul>

      {joined ? (
        <p className="text-sm font-semibold text-orange-400">
          You&apos;re on the list — we&apos;ll email you when Premium launches.
        </p>
      ) : (
        <form
          action={async () => {
            const result = await action();
            if (result.success) setJoined(true);
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-orange-600 px-3 py-2 font-semibold text-white hover:bg-orange-500"
          >
            Join the Premium waitlist
          </button>
        </form>
      )}
    </div>
  );
}
