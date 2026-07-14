import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <Link href="/dashboard" className="text-sm text-orange-500 hover:underline">
            Back to dashboard
          </Link>
        </div>

        <p className="mb-6 text-sm text-neutral-400">
          Bodyweight, birthdate, and gender are used to calculate your
          strength standards and weak-point diagnosis — they&apos;re not
          shared publicly.
        </p>

        <form action={updateProfile} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="mb-1 block text-sm text-neutral-300">
              Nickname
            </label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              maxLength={20}
              defaultValue={profile?.nickname ?? ""}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Shown on Leaderboards. Leave blank to appear as Anonymous.
            </p>
          </div>

          <div>
            <label htmlFor="unit" className="mb-1 block text-sm text-neutral-300">
              Units
            </label>
            <select
              id="unit"
              name="unit"
              defaultValue={profile?.unit ?? "lb"}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
            >
              <option value="lb">Pounds (lb)</option>
              <option value="kg">Kilograms (kg)</option>
            </select>
          </div>

          <div>
            <label htmlFor="bodyweight" className="mb-1 block text-sm text-neutral-300">
              Bodyweight
            </label>
            <input
              id="bodyweight"
              name="bodyweight"
              type="number"
              inputMode="decimal"
              step={0.5}
              min={0}
              defaultValue={profile?.bodyweight ?? ""}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label htmlFor="birthdate" className="mb-1 block text-sm text-neutral-300">
              Birthdate
            </label>
            <input
              id="birthdate"
              name="birthdate"
              type="date"
              defaultValue={profile?.birthdate ?? ""}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Used only to pick the right age bracket for Squat/Bench/Deadlift standards.
            </p>
          </div>

          <div>
            <label htmlFor="gender" className="mb-1 block text-sm text-neutral-300">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              defaultValue={profile?.gender ?? ""}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-orange-500"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <p className="mt-1 text-xs text-neutral-500">
              Used only to select the right strength-standards table.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-orange-600 px-3 py-2 font-semibold text-white hover:bg-orange-500"
          >
            Save
          </button>
        </form>

        <div className="mt-8 border-t border-neutral-800 pt-4">
          <Link href="/privacy" className="text-sm text-orange-500 hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
