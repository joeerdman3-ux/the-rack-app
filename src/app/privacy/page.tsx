import Link from "next/link";

// Public page — intentionally has no auth check (see PUBLIC_PATHS in
// src/lib/supabase/middleware.ts) so it's readable before signup/login.
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
          <Link href="/" className="text-sm text-orange-500 hover:underline">
            Back to home
          </Link>
        </div>

        <p className="mb-1 text-sm text-neutral-500">The Rack</p>
        <p className="mb-6 text-sm text-neutral-500">Last updated: July 2026</p>

        <p className="mb-6 text-sm text-neutral-300">
          The Rack (&quot;we,&quot; &quot;us,&quot; &quot;the app&quot;) is a training log and
          analytics tool for powerlifters. This page explains what information we collect,
          why we collect it, and how it&apos;s used.
        </p>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-white">What We Collect</h2>

          <h3 className="mb-1 text-sm font-semibold text-white">Account information</h3>
          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-neutral-300">
            <li>Email address (used for login/authentication)</li>
            <li>Nickname (optional, public if you opt into Leaderboards — see below)</li>
          </ul>

          <h3 className="mb-1 text-sm font-semibold text-white">Training data</h3>
          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-neutral-300">
            <li>Workout logs: lift, weight, reps, RPE, missed/made status, date</li>
            <li>Accessory exercise logs: exercise, weight, reps, RPE, notes, date</li>
            <li>
              Programs you create: weeks, sessions, prescribed exercises, sets/reps, training
              maxes
            </li>
          </ul>

          <h3 className="mb-1 text-sm font-semibold text-white">Profile information</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-300">
            <li>Bodyweight</li>
            <li>Birthdate (used only to calculate your age bracket for Strength Standards)</li>
            <li>Sex/gender (used only to select the correct Strength Standards comparison table)</li>
            <li>Unit preference (lb/kg)</li>
            <li>Gym affiliation and location (optional, if provided)</li>
            <li>Instagram handle (optional, if provided)</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-white">How We Use This Information</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-neutral-300">
            <li>
              To run the app&apos;s core features: logging your training, calculating your
              estimated 1-rep max, computing your weak-point diagnosis, and showing your
              progress over time.
            </li>
            <li>
              To compute Strength Standards: your bodyweight, sex, and age bracket are matched
              against percentile data from OpenPowerlifting (a public-domain competition results
              database) to show your percentile and tier. This calculation happens using your
              data but is never shared as raw data with any third party.
            </li>
            <li>
              To display Leaderboards: if you opt in (via the Leaderboard opt-in setting), your
              nickname and best lifts become visible to other users on the Leaderboards page,
              grouped by weight class. Leaderboard participation is off by default and fully
              optional. You can opt out at any time in Settings, which immediately removes you
              from all leaderboard views.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-white">What We Don&apos;t Do</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-300">
            <li>We do not sell your personal data to third parties.</li>
            <li>
              We do not share your training data, bodyweight, birthdate, or any profile field
              with advertisers.
            </li>
            <li>We do not display ads in the app.</li>
            <li>
              Your raw bodyweight and birthdate are never shown publicly, even if you opt into
              Leaderboards — only your nickname and lift numbers are.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Data Storage &amp; Security</h2>
          <p className="text-sm text-neutral-300">
            Your data is stored using Supabase (a hosted PostgreSQL database provider) with
            row-level security enabled, meaning your personal records (workouts, accessory logs,
            programs, profile fields) can only be accessed by your own account — not by other
            users, even at the database level.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Your Choices</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-300">
            <li>Leaderboard visibility: toggle on/off anytime in Settings.</li>
            <li>Nickname: optional — if left blank, you appear as &quot;Anonymous&quot; on Leaderboards.</li>
            <li>
              Account deletion: contact us to request full deletion of your account and all
              associated data.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Changes to This Policy</h2>
          <p className="text-sm text-neutral-300">
            As The Rack adds features, this policy will be updated to reflect any new data we
            collect or new ways we use it. Material changes will be noted with an updated
            &quot;Last updated&quot; date above.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">Contact</h2>
          <p className="text-sm text-neutral-300">
            Questions about this policy or your data? Reach out at support@therack.dev.
          </p>
        </section>
      </div>
    </div>
  );
}
