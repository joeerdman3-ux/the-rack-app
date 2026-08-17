"use client";

import { useState } from "react";
import { useSessionStorageState } from "@/lib/useLocalStorageState";
import type { resendConfirmationEmail } from "@/app/auth/actions";

// Dismissible per browser session (not silenced forever) — reappears on
// the next real login even within the same tab, since LogoutButton clears
// this same key as part of signing out. sessionStorage alone would only
// reset on tab close, which isn't quite "next login."
export const VERIFY_EMAIL_DISMISS_KEY = "verify-email-banner-dismissed";

export function VerifyEmailBanner({
  show,
  resendAction,
}: {
  show: boolean;
  resendAction: typeof resendConfirmationEmail;
}) {
  const [dismissedFlag, setDismissedFlag] = useSessionStorageState(VERIFY_EMAIL_DISMISS_KEY, "");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!show || dismissedFlag === "1") return null;

  async function handleResend() {
    setStatus("sending");
    setErrorMessage(null);
    const result = await resendAction();
    if (result.success) {
      setStatus("sent");
    } else {
      setStatus("error");
      setErrorMessage(result.error);
    }
  }

  function handleDismiss() {
    setDismissedFlag("1");
  }

  return (
    <div className="mb-4 rounded-md border border-amber-900 bg-amber-950 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-amber-300">
          Please verify your email — we sent a confirmation link when you signed up. Check your
          inbox (and spam folder) so you can always get back into your account.
          {status === "idle" || status === "sending" ? (
            <>
              {" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={status === "sending"}
                className="font-semibold underline hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "sending" ? "Sending..." : "Resend confirmation email"}
              </button>
            </>
          ) : status === "sent" ? (
            " Sent — check your inbox again in a moment."
          ) : (
            ` Couldn't resend: ${errorMessage}`
          )}
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-amber-400 hover:text-amber-200"
        >
          ×
        </button>
      </div>
    </div>
  );
}
