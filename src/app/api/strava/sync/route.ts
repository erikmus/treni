import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { 
  StravaClient, 
  mapStravaActivityType, 
  stravaStreamsToGpxData,
  stravaLapsToSplitsData,
  type StravaActivity 
} from "@/lib/strava/client";
import type { TablesInsert, Json } from "@/types/database";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get sync options from request body
  const body = await request.json().catch(() => ({}));
  const daysToSync = body.days || 30; // Default to last 30 days

  // Get the user's Strava tokens
  const { data: profile } = await supabase
    .from("profiles")
    .select("strava_access_token, strava_refresh_token, strava_token_expires_at")
    .eq("id", user.id)
    .single();

  if (!profile?.strava_access_token || !profile?.strava_refresh_token) {
    return NextResponse.json(
      { error: "Strava not connected" },
      { status: 400 }
    );
  }

  // Create Strava client with token refresh callback
  const client = new StravaClient(
    profile.strava_access_token,
    profile.strava_refresh_token,
    new Date(profile.strava_token_expires_at!).getTime() / 1000,
    async (tokens) => {
      // Update tokens in database when refreshed
      await supabase
        .from("profiles")
        .update({
          strava_access_token: tokens.access_token,
          strava_refresh_token: tokens.refresh_token,
          strava_token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }
  );

  try {
    // Calculate the date range
    const after = Math.floor(Date.now() / 1000) - (daysToSync * 24 * 60 * 60);
    
    // Fetch activities from Strava
    const activities = await client.getActivities({
      after,
      per_page: 100, // Max allowed by Strava
    });

    const results = {
      synced: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each activity
    for (const activity of activities) {
      try {
        const result = await syncActivity(supabase, user.id, client, activity);
        if (result.synced) {
          results.synced++;
        } else {
          results.skipped++;
        }
      } catch (error) {
        console.error(`Error syncing activity ${activity.id}:`, error);
        results.errors.push(`Failed to sync "${activity.name}": ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${results.synced} activities, skipped ${results.skipped} (already imported)`,
      ...results,
    });
  } catch (error) {
    console.error("Strava sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}

async function syncActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  client: StravaClient,
  activity: StravaActivity
): Promise<{ synced: boolean }> {
  const externalId = `strava_${activity.id}`;

  // Check if activity already exists
  const { data: existing } = await supabase
    .from("activities")
    .select("id")
    .eq("user_id", userId)
    .eq("external_id", externalId)
    .single();

  if (existing) {
    return { synced: false };
  }

  // Fetch detailed activity data (streams and laps)
  let gpxData: Json = null;
  let splitsData: Json = null;

  try {
    const [streams, laps] = await Promise.all([
      client.getActivityStreams(activity.id),
      client.getActivityLaps(activity.id),
    ]);

    gpxData = stravaStreamsToGpxData(streams, activity.start_date) as Json;
    splitsData = stravaLapsToSplitsData(laps) as Json;
  } catch (error) {
    // Log but don't fail - some activities might not have streams
    console.warn(`Could not fetch streams for activity ${activity.id}:`, error);
  }

  // Calculate pace (sec/km)
  const avgPaceSecPerKm = activity.distance > 0 && activity.moving_time > 0
    ? Math.round((activity.moving_time / activity.distance) * 1000)
    : null;

  // Best pace from max speed (m/s -> sec/km)
  const bestPaceSecPerKm = activity.max_speed > 0
    ? Math.round(1000 / activity.max_speed)
    : null;

  // Calculate end time
  const startedAt = new Date(activity.start_date);
  const finishedAt = new Date(startedAt.getTime() + activity.elapsed_time * 1000);

  const activityData: TablesInsert<"activities"> = {
    user_id: userId,
    source: "strava",
    external_id: externalId,
    activity_type: mapStravaActivityType(activity.type),
    title: activity.name,
    description: activity.description,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    duration_seconds: activity.elapsed_time,
    moving_time_seconds: activity.moving_time,
    distance_meters: activity.distance,
    avg_pace_sec_per_km: avgPaceSecPerKm,
    best_pace_sec_per_km: bestPaceSecPerKm,
    avg_heart_rate: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
    max_heart_rate: activity.max_heartrate ? Math.round(activity.max_heartrate) : null,
    elevation_gain_meters: activity.total_elevation_gain,
    avg_cadence: activity.average_cadence ? Math.round(activity.average_cadence) : null,
    calories: activity.calories ? Math.round(activity.calories) : null,
    gpx_data: gpxData,
    splits_data: splitsData,
  };

  const { error: insertError } = await supabase
    .from("activities")
    .insert(activityData);

  if (insertError) {
    throw insertError;
  }

  return { synced: true };
}

