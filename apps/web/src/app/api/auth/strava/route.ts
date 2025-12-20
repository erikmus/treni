import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStravaAuthUrl } from "@/lib/strava/client";

/**
 * Initiates Strava OAuth flow for login/signup
 * 
 * Query params:
 * - mode: "login" | "signup" | "connect" (default: "login")
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "login";

  // Get the origin from headers
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  // Use the auth callback for login/signup, API callback for connecting
  const callbackPath = mode === "connect" 
    ? "/auth/strava/callback" 
    : "/auth/strava/callback";
  
  const redirectUri = `${origin}${callbackPath}`;
  
  // Create state parameter with mode
  const state = Buffer.from(JSON.stringify({ 
    mode,
    timestamp: Date.now() 
  })).toString("base64");

  const authUrl = getStravaAuthUrl(redirectUri, state);

  return NextResponse.redirect(authUrl);
}

