import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  
  if (!query || query.length < 2) {
    return NextResponse.json({ workouts: [], activities: [] });
  }

  const searchPattern = `%${query}%`;

  // Search workouts
  const { data: workouts, error: workoutsError } = await supabase
    .from("workouts")
    .select("id, title, workout_type, scheduled_date, status")
    .eq("user_id", user.id)
    .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
    .order("scheduled_date", { ascending: false })
    .limit(5);

  if (workoutsError) {
    console.error("Workouts search error:", workoutsError);
  }

  // Search activities
  const { data: activities, error: activitiesError } = await supabase
    .from("activities")
    .select("id, title, activity_type, started_at, distance_meters, duration_seconds")
    .eq("user_id", user.id)
    .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
    .order("started_at", { ascending: false })
    .limit(5);

  if (activitiesError) {
    console.error("Activities search error:", activitiesError);
  }

  return NextResponse.json({
    workouts: workouts || [],
    activities: activities || [],
  });
}
