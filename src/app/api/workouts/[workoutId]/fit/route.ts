import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createWorkoutFit } from "@/lib/fit/create-workout-fit";

interface RouteParams {
  params: Promise<{
    workoutId: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { workoutId } = await params;
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch workout
    const { data: workout, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", workoutId)
      .eq("user_id", user.id)
      .single();

    if (error || !workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    // Generate FIT file
    const fitBuffer = createWorkoutFit({
      title: workout.title,
      workout_type: workout.workout_type,
      workout_structure: workout.workout_structure as {
        segments: Array<{
          type: string;
          name: string;
          duration_type?: string;
          duration_value?: number;
          target_type?: string;
          target_pace_low?: number;
          target_pace_high?: number;
          target_zone?: number;
          repeat_count?: number;
          segments?: Array<unknown>;
          notes?: string;
        }>;
        estimated_duration_minutes: number;
        estimated_distance_km: number;
      } | null,
      target_duration_minutes: workout.target_duration_minutes,
      target_distance_km: workout.target_distance_km ? Number(workout.target_distance_km) : null,
    });

    // Create filename from workout title
    const filename = `${workout.title.replace(/[^a-zA-Z0-9]/g, "_")}.fit`;

    // Return FIT file as download
    return new NextResponse(fitBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fitBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("FIT generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate FIT file" },
      { status: 500 }
    );
  }
}

