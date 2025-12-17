import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseTCX, trackpointsToGpxData, lapsToSplitsData } from "@/lib/parsers/parse-tcx";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Geen bestand geüpload" }, { status: 400 });
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".tcx")) {
      return NextResponse.json({ 
        error: "Ongeldig bestandstype. Alleen TCX bestanden worden ondersteund." 
      }, { status: 400 });
    }

    // Read file content
    const fileContent = await file.text();

    // Parse TCX file
    let parsed;
    try {
      parsed = parseTCX(fileContent);
    } catch (parseError) {
      return NextResponse.json({ 
        error: `Kon bestand niet lezen: ${parseError instanceof Error ? parseError.message : "Onbekende fout"}` 
      }, { status: 400 });
    }

    if (parsed.activities.length === 0) {
      return NextResponse.json({ 
        error: "Geen activiteiten gevonden in het bestand" 
      }, { status: 400 });
    }

    // Insert activities into database
    const insertedActivities = [];
    const errors = [];

    for (const activity of parsed.activities) {
      // Check if activity already exists (by external_id based on start time)
      const externalId = `tcx_${activity.id}`;
      
      const { data: existing } = await supabase
        .from("activities")
        .select("id")
        .eq("user_id", user.id)
        .eq("external_id", externalId)
        .single();

      if (existing) {
        errors.push(`Activiteit van ${activity.startTime.toLocaleDateString("nl-NL")} bestaat al`);
        continue;
      }

      // Convert trackpoints to GPX data
      const gpxData = trackpointsToGpxData(activity.trackpoints);
      
      // Convert laps to splits data
      const splitsData = lapsToSplitsData(activity.laps);

      // Calculate finished_at
      const finishedAt = new Date(activity.startTime.getTime() + activity.totalTimeSeconds * 1000);

      // Insert activity
      const { data: inserted, error: insertError } = await supabase
        .from("activities")
        .insert({
          user_id: user.id,
          source: "import",
          external_id: externalId,
          activity_type: activity.sport,
          title: generateTitle(activity.sport, activity.distanceMeters),
          started_at: activity.startTime.toISOString(),
          finished_at: finishedAt.toISOString(),
          duration_seconds: Math.round(activity.totalTimeSeconds),
          moving_time_seconds: Math.round(activity.totalTimeSeconds), // TCX doesn't distinguish moving time
          distance_meters: activity.distanceMeters,
          avg_pace_sec_per_km: activity.averagePaceSecPerKm,
          best_pace_sec_per_km: activity.bestPaceSecPerKm,
          avg_heart_rate: activity.averageHeartRateBpm,
          max_heart_rate: activity.maximumHeartRateBpm,
          elevation_gain_meters: activity.elevationGainMeters,
          elevation_loss_meters: activity.elevationLossMeters,
          avg_cadence: activity.averageCadence,
          calories: activity.calories > 0 ? activity.calories : null,
          gpx_data: gpxData,
          splits_data: splitsData,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        errors.push(`Fout bij opslaan van activiteit: ${insertError.message}`);
      } else if (inserted) {
        insertedActivities.push(inserted);
      }
    }

    if (insertedActivities.length === 0 && errors.length > 0) {
      return NextResponse.json({ 
        error: errors[0] 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${insertedActivities.length} activiteit${insertedActivities.length !== 1 ? "en" : ""} geïmporteerd`,
      activities: insertedActivities,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      error: "Er is een fout opgetreden bij het uploaden" 
    }, { status: 500 });
  }
}

/**
 * Generate a title for the activity based on type and distance
 */
function generateTitle(activityType: string, distanceMeters: number): string {
  const distanceKm = distanceMeters / 1000;
  
  const typeLabels: Record<string, string> = {
    run: "Hardlopen",
    walk: "Wandelen",
    cycling: "Fietsen",
    swimming: "Zwemmen",
    cross_training: "Cross-training",
    other: "Training",
  };

  const typeLabel = typeLabels[activityType] || "Training";

  if (distanceKm >= 1) {
    return `${typeLabel} - ${distanceKm.toFixed(1)} km`;
  }
  
  return typeLabel;
}

