import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ActivityVisualization } from "@/components/activities/activity-visualization";
import { ActivityStats } from "@/components/activities/activity-stats";
import { DeleteActivityButton } from "@/components/activities/delete-activity-button";
import { SplitsTable } from "@/components/activities/splits-table";
import { EditableActivityTitle } from "@/components/activities/editable-activity-title";

const activityTypeLabels: Record<string, string> = {
  run: "Hardlopen",
  walk: "Wandelen",
  cross_training: "Cross-training",
  cycling: "Fietsen",
  swimming: "Zwemmen",
  other: "Overig",
};

const activityTypeIcons: Record<string, string> = {
  run: "🏃",
  walk: "🚶",
  cross_training: "🏋️",
  cycling: "🚴",
  swimming: "🏊",
  other: "💪",
};

interface ActivityDetailPageProps {
  params: Promise<{ activityId: string }>;
}

export default async function ActivityDetailPage({ params }: ActivityDetailPageProps) {
  const { activityId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: activity, error } = await supabase
    .from("activities")
    .select("*")
    .eq("id", activityId)
    .eq("user_id", user.id)
    .single();

  if (error || !activity) {
    notFound();
  }

  const icon = activityTypeIcons[activity.activity_type] || "💪";
  const typeLabel = activityTypeLabels[activity.activity_type] || activity.activity_type;
  const startedAt = new Date(activity.started_at);

  // Extract trackpoints for charts
  const gpxData = activity.gpx_data as { track?: Array<{
    lat: number;
    lon: number;
    ele?: number;
    time?: string;
    hr?: number;
    cad?: number;
  }> } | null;
  
  const trackpoints = gpxData?.track || [];
  
  // Extract splits data
  const splitsData = activity.splits_data as { splits?: Array<{
    lapNumber: number;
    startTime: string;
    durationSeconds: number;
    distanceMeters: number;
    paceSecPerKm: number | null;
    avgHeartRate?: number;
    maxHeartRate?: number;
    cadence?: number;
    calories: number;
  }> } | null;
  
  const splits = splitsData?.splits || [];

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/dashboard/activities">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{icon}</span>
              <div>
                <EditableActivityTitle 
                  activityId={activity.id}
                  initialTitle={activity.title}
                  fallbackTitle={typeLabel}
                />
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(startedAt, "EEEE d MMMM yyyy", { locale: nl })}</span>
                  <span>•</span>
                  <span>{format(startedAt, "HH:mm", { locale: nl })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{typeLabel}</Badge>
          <DeleteActivityButton activityId={activity.id} />
        </div>
      </div>

      {/* Main Stats Grid */}
      <ActivityStats
        distanceMeters={activity.distance_meters ? Number(activity.distance_meters) : null}
        durationSeconds={activity.duration_seconds}
        avgPaceSecPerKm={activity.avg_pace_sec_per_km}
        bestPaceSecPerKm={activity.best_pace_sec_per_km}
        avgHeartRate={activity.avg_heart_rate}
        maxHeartRate={activity.max_heart_rate}
        elevationGainMeters={activity.elevation_gain_meters ? Number(activity.elevation_gain_meters) : null}
        avgCadence={activity.avg_cadence}
        calories={activity.calories}
      />

      {/* Route Map & Charts with synchronized hover */}
      {trackpoints.length > 0 && (
        <ActivityVisualization trackpoints={trackpoints} />
      )}

      {/* Splits Table */}
      {splits.length > 0 && (
        <SplitsTable splits={splits} />
      )}

      {/* Activity Notes */}
      {activity.description && (
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-3">Notities</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{activity.description}</p>
        </div>
      )}
    </div>
  );
}

