import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deauthorizeStrava } from "@/lib/strava/client";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the user's Strava access token
  const { data: profile } = await supabase
    .from("profiles")
    .select("strava_access_token")
    .eq("id", user.id)
    .single();

  // Try to deauthorize on Strava's side
  if (profile?.strava_access_token) {
    try {
      await deauthorizeStrava(profile.strava_access_token);
    } catch (error) {
      // Log but don't fail if deauthorization fails
      console.error("Strava deauthorization failed:", error);
    }
  }

  // Clear the Strava fields from the profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      strava_athlete_id: null,
      strava_access_token: null,
      strava_refresh_token: null,
      strava_token_expires_at: null,
      strava_scope: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Failed to clear Strava tokens:", updateError);
    return NextResponse.json(
      { error: "Failed to disconnect Strava" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

