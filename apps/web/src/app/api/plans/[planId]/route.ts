import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ planId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { planId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First check if the plan exists and belongs to the user
    const { data: plan, error: fetchError } = await supabase
      .from("training_plans")
      .select("id")
      .eq("id", planId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Delete all workouts associated with this plan first (cascade)
    const { error: workoutsError } = await supabase
      .from("workouts")
      .delete()
      .eq("plan_id", planId)
      .eq("user_id", user.id);

    if (workoutsError) {
      console.error("Error deleting workouts:", workoutsError);
      return NextResponse.json({ error: "Failed to delete workouts" }, { status: 500 });
    }

    // Then delete the plan
    const { error: planError } = await supabase
      .from("training_plans")
      .delete()
      .eq("id", planId)
      .eq("user_id", user.id);

    if (planError) {
      console.error("Error deleting plan:", planError);
      return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/plans/[planId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

