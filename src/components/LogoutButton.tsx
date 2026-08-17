"use client";

import type { signOut } from "@/app/auth/actions";
import { VERIFY_EMAIL_DISMISS_KEY } from "@/components/VerifyEmailBanner";

// Wraps the plain server-action logout form only to clear
// VerifyEmailBanner's sessionStorage dismissal flag first — so a user who
// logs out and back in in the same tab still sees the reminder again
// (sessionStorage alone only resets on tab close, not on logout).
export function LogoutButton({ action }: { action: typeof signOut }) {
  return (
    <form action={action}>
      <button
        type="submit"
        onClick={() => sessionStorage.removeItem(VERIFY_EMAIL_DISMISS_KEY)}
        className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
      >
        Log out
      </button>
    </form>
  );
}
