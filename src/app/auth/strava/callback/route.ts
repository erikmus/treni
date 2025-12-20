import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeStravaCode } from "@/lib/strava/client";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateParam = searchParams.get("state");

  // Parse state to get mode
  let mode = "login";
  try {
    if (stateParam) {
      const state = JSON.parse(Buffer.from(stateParam, "base64").toString());
      mode = state.mode || "login";
    }
  } catch {
    // Default to login mode
  }

  // Handle Strava OAuth errors
  if (error) {
    console.error("Strava OAuth error:", error);
    const redirectUrl = mode === "connect" 
      ? "/dashboard/settings/integrations?error=strava_auth_denied"
      : "/login?error=strava_auth_denied";
    return NextResponse.redirect(`${origin}${redirectUrl}`);
  }

  if (!code) {
    const redirectUrl = mode === "connect" 
      ? "/dashboard/settings/integrations?error=strava_no_code"
      : "/login?error=strava_no_code";
    return NextResponse.redirect(`${origin}${redirectUrl}`);
  }

  try {
    // Exchange the code for tokens
    const tokens = await exchangeStravaCode(code);
    const stravaAthleteId = tokens.athlete.id;
    const athleteName = `${tokens.athlete.firstname} ${tokens.athlete.lastname}`.trim();
    const athleteAvatar = tokens.athlete.profile_medium || tokens.athlete.profile;

    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // Mode: connect - Link Strava to existing logged-in user
    if (mode === "connect" && currentUser) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          strava_athlete_id: stravaAthleteId,
          strava_access_token: tokens.access_token,
          strava_refresh_token: tokens.refresh_token,
          strava_token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
          strava_scope: "read,activity:read_all",
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id);

      if (updateError) {
        console.error("Failed to store Strava tokens:", updateError);
        return NextResponse.redirect(
          `${origin}/dashboard/settings/integrations?error=strava_save_failed`
        );
      }

      return NextResponse.redirect(
        `${origin}/dashboard/settings/integrations?success=strava_connected`
      );
    }

    // Mode: login/signup - Check if user exists with this Strava ID
    const adminClient = createAdminClient();
    
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id, email, locale")
      .eq("strava_athlete_id", stravaAthleteId)
      .single();

    if (existingProfile) {
      // Existing Strava user - sign them in
      // Update their Strava tokens
      await adminClient
        .from("profiles")
        .update({
          strava_access_token: tokens.access_token,
          strava_refresh_token: tokens.refresh_token,
          strava_token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingProfile.id);

      // Create a magic link to sign in the user
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: existingProfile.email!,
        options: {
          redirectTo: `${origin}/dashboard`,
        },
      });

      if (linkError || !linkData.properties?.hashed_token) {
        console.error("Failed to generate magic link:", linkError);
        return NextResponse.redirect(`${origin}/login?error=strava_login_failed`);
      }

      // Exchange the token for a session
      const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: "magiclink",
      });

      if (sessionError) {
        console.error("Failed to create session:", sessionError);
        return NextResponse.redirect(`${origin}/login?error=strava_login_failed`);
      }

      // Set locale cookie
      const locale = existingProfile.locale || "nl";
      const response = NextResponse.redirect(`${origin}/dashboard`);
      response.cookies.set("NEXT_LOCALE", locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
      return response;
    }

    // New user - create account with Strava
    const stravaEmail = `strava_${stravaAthleteId}@strava.treni.app`;
    
    // Create user with admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: stravaEmail,
      email_confirm: true, // Auto-confirm since they authenticated with Strava
      user_metadata: {
        full_name: athleteName,
        avatar_url: athleteAvatar,
        strava_athlete_id: stravaAthleteId,
      },
    });

    if (createError) {
      console.error("Failed to create user:", createError);
      return NextResponse.redirect(`${origin}/login?error=strava_signup_failed`);
    }

    // Create profile with Strava data
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        email: stravaEmail,
        full_name: athleteName,
        avatar_url: athleteAvatar,
        strava_athlete_id: stravaAthleteId,
        strava_access_token: tokens.access_token,
        strava_refresh_token: tokens.refresh_token,
        strava_token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
        strava_scope: "read,activity:read_all",
        locale: "nl", // Default to Dutch
      })
      .eq("id", newUser.user.id);

    if (profileError) {
      console.error("Failed to create profile:", profileError);
      // User is created but profile failed - try to clean up
    }

    // Sign in the new user
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: stravaEmail,
      options: {
        redirectTo: `${origin}/dashboard`,
      },
    });

    if (linkError || !linkData.properties?.hashed_token) {
      console.error("Failed to generate magic link for new user:", linkError);
      return NextResponse.redirect(`${origin}/login?error=strava_login_failed`);
    }

    // Exchange the token for a session
    const { error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });

    if (sessionError) {
      console.error("Failed to create session for new user:", sessionError);
      return NextResponse.redirect(`${origin}/login?error=strava_login_failed`);
    }

    // Redirect new users to complete their profile (optional email)
    const response = NextResponse.redirect(`${origin}/dashboard?welcome=strava`);
    response.cookies.set("NEXT_LOCALE", "nl", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;

  } catch (error) {
    console.error("Strava callback error:", error);
    const redirectUrl = mode === "connect" 
      ? "/dashboard/settings/integrations?error=strava_auth_failed"
      : "/login?error=strava_auth_failed";
    return NextResponse.redirect(`${origin}${redirectUrl}`);
  }
}
