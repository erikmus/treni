import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ activityId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { activityId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the activity (only if it belongs to the user)
    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", activityId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting activity:", error);
      return NextResponse.json({ error: "Failed to delete activity" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/activities/[activityId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { activityId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title } = body;

    if (typeof title !== "string") {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }

    // Update the activity title
    const { data, error } = await supabase
      .from("activities")
      .update({ 
        title: title.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", activityId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating activity:", error);
      return NextResponse.json({ error: "Failed to update activity" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, activity: data });
  } catch (error) {
    console.error("Error in PATCH /api/activities/[activityId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
