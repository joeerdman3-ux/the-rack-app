"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // signUp() returns an active session immediately when the account
  // doesn't need confirming (Supabase's "Confirm email" project setting
  // off, or already-confirmed for any other reason) — @supabase/ssr's
  // server client persists that session to cookies as part of the call
  // above, same as login()'s signInWithPassword, so redirecting straight
  // to /dashboard here is a real logged-in redirect, not a guess. Only
  // falls back to the check-email screen when session is null, i.e.
  // confirmation is genuinely still pending — keeps this correct if
  // "Confirm email" is ever turned back on later, not hardcoded for
  // "always off."
  if (data.session) {
    redirect("/dashboard");
  }

  redirect("/signup/check-email");
}
