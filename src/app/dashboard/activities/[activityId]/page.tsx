import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  ArrowLeft,
  Calendar,
  Clock, 
  MapPin, 
  Heart,
  TrendingUp,
  Flame,
  Mountain,
  Footprints,
  Timer,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ActivityVisualization } from "@/components/activities/activity-visualization";
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

function formatPace(secondsPerKm: number | null): string {
  if (!secondsPerKm) return "-";
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

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
  const distanceKm = activity.distance_meters ? Number(activity.distance_meters) / 1000 : 0;

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
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
        {/* Distance */}
        <div className="bg-card rounded-lg border px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            Afstand
          </div>
          <p className="text-lg font-semibold leading-tight">{distanceKm.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">km</span></p>
        </div>

        {/* Duration */}
        <div className="bg-card rounded-lg border px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Tijd
          </div>
          <p className="text-lg font-semibold leading-tight">{formatDuration(activity.duration_seconds)}</p>
        </div>

        {/* Pace */}
        <div className="bg-card rounded-lg border px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="h-3 w-3" />
            Gem. tempo
          </div>
          <p className="text-lg font-semibold leading-tight">{formatPace(activity.avg_pace_sec_per_km)} <span className="text-xs font-normal text-muted-foreground">/km</span></p>
        </div>

        {/* Heart Rate */}
        {activity.avg_heart_rate && (
          <div className="bg-card rounded-lg border px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Heart className="h-3 w-3 text-red-500" />
              Gem. hartslag
            </div>
            <p className="text-lg font-semibold leading-tight">{activity.avg_heart_rate} <span className="text-xs font-normal text-muted-foreground">bpm</span></p>
          </div>
        )}

        {/* Max Heart Rate */}
        {activity.max_heart_rate && (
          <div className="bg-card rounded-lg border px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Heart className="h-3 w-3 text-red-600" />
              Max hartslag
            </div>
            <p className="text-lg font-semibold leading-tight">{activity.max_heart_rate} <span className="text-xs font-normal text-muted-foreground">bpm</span></p>
          </div>
        )}

        {/* Elevation */}
        {activity.elevation_gain_meters && (
          <div className="bg-card rounded-lg border px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mountain className="h-3 w-3" />
              Hoogteverschil
            </div>
            <p className="text-lg font-semibold leading-tight">{Math.round(Number(activity.elevation_gain_meters))} <span className="text-xs font-normal text-muted-foreground">m</span></p>
          </div>
        )}

        {/* Cadence */}
        {activity.avg_cadence && (
          <div className="bg-card rounded-lg border px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Footprints className="h-3 w-3" />
              Gem. cadans
            </div>
            <p className="text-lg font-semibold leading-tight">{activity.avg_cadence} <span className="text-xs font-normal text-muted-foreground">spm</span></p>
          </div>
        )}

        {/* Calories */}
        {activity.calories && (
          <div className="bg-card rounded-lg border px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flame className="h-3 w-3 text-orange-500" />
              Calorieën
            </div>
            <p className="text-lg font-semibold leading-tight">{activity.calories} <span className="text-xs font-normal text-muted-foreground">kcal</span></p>
          </div>
        )}

        {/* Best Pace */}
        {activity.best_pace_sec_per_km && (
          <div className="bg-card rounded-lg border px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Beste tempo
            </div>
            <p className="text-lg font-semibold leading-tight">{formatPace(activity.best_pace_sec_per_km)} <span className="text-xs font-normal text-muted-foreground">/km</span></p>
          </div>
        )}
      </div>

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

