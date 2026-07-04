import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the confirmation link Supabase emails after signup.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/error?message=${encodeURIComponent(
      "That confirmation link is invalid or has expired.",
    )}`,
  );
}
