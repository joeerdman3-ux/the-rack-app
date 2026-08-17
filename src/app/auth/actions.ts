"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Confirmation links expire (Supabase's "Email OTP expiration" setting,
// a few hours by default) — this lets VerifyEmailBanner offer a fresh one
// rather than leaving a user stuck on a dead link from days-old email.
// Reads the email off the current session rather than trusting client
// input, same as every other server action in this app.
export async function resendConfirmationEmail(): Promise<
  { success: true } | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { success: false, error: "You must be signed in to resend a confirmation email." };

  const origin = (await headers()).get("origin");

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: user.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
