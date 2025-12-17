import { redirect } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  Activity,
  Clock, 
  MapPin, 
  Heart,
  Plus,
  ChevronRight,
  Watch,
  Zap,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { UploadTCXDialog } from "@/components/activities";

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

const feelingLabels: Record<string, { label: string; color: string; emoji: string }> = {
  great: { label: "Geweldig", color: "text-emerald-600", emoji: "🔥" },
  good: { label: "Goed", color: "text-green-600", emoji: "😊" },
  okay: { label: "Oké", color: "text-yellow-600", emoji: "😐" },
  tired: { label: "Moe", color: "text-orange-600", emoji: "😓" },
  exhausted: { label: "Uitgeput", color: "text-red-600", emoji: "😵" },
};

function formatPace(secondsPerKm: number | null): string {
  if (!secondsPerKm) return "-";
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")} /km`;
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

export default async function ActivitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all activities for this user
  const { data: activities } = await supabase
    .from("activities")
    .select("*, workouts(title)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  // Calculate totals
  const totalActivities = activities?.length || 0;
  const totalDistanceM = activities?.reduce((sum, a) => sum + (Number(a.distance_meters) || 0), 0) || 0;
  const totalDurationS = activities?.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) || 0;
  const runActivities = activities?.filter(a => a.activity_type === "run") || [];
  const avgPace = runActivities.length > 0 
    ? runActivities.reduce((sum, a) => sum + (a.avg_pace_sec_per_km || 0), 0) / runActivities.length
    : 0;

  // Check if user has Garmin connected
  const { data: profile } = await supabase
    .from("profiles")
    .select("garmin_user_id")
    .eq("id", user.id)
    .single();
  
  const hasGarminConnected = !!profile?.garmin_user_id;

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Activiteiten</h1>
            <p className="text-muted-foreground mt-1">
              Je voltooide trainingen en activiteiten
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="text-center px-4">
            <div className="rounded-full bg-primary/10 w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Activity className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Nog geen activiteiten</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {hasGarminConnected 
                ? "Je hebt nog geen activiteiten gesynchroniseerd van Garmin."
                : "Koppel je Garmin horloge om je trainingen automatisch te synchroniseren, of voeg handmatig een activiteit toe."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!hasGarminConnected && (
                <Button variant="outline" asChild>
                  <Link href="/dashboard/settings/integrations">
                    <Watch className="mr-2 h-4 w-4" />
                    Garmin koppelen
                  </Link>
                </Button>
              )}
              <UploadTCXDialog
                trigger={
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    TCX uploaden
                  </Button>
                }
              />
              <Button asChild>
                <Link href="/dashboard/activities/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Activiteit toevoegen
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activiteiten</h1>
          <p className="text-muted-foreground mt-1">
            {totalActivities} activiteit{totalActivities !== 1 ? "en" : ""} • {(totalDistanceM / 1000).toFixed(1)} km totaal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UploadTCXDialog
            trigger={
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                TCX uploaden
              </Button>
            }
          />
          <Button asChild>
            <Link href="/dashboard/activities/new">
              <Plus className="mr-2 h-4 w-4" />
              Toevoegen
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            Totaal activiteiten
          </div>
          <p className="text-2xl font-bold">{totalActivities}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <MapPin className="h-4 w-4" />
            Totale afstand
          </div>
          <p className="text-2xl font-bold">{(totalDistanceM / 1000).toFixed(1)} km</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            Totale tijd
          </div>
          <p className="text-2xl font-bold">{Math.round(totalDurationS / 3600)}u {Math.round((totalDurationS % 3600) / 60)}m</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Zap className="h-4 w-4" />
            Gem. tempo
          </div>
          <p className="text-2xl font-bold">{avgPace > 0 ? formatPace(avgPace) : "-"}</p>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recente activiteiten</h2>
        <div className="bg-card rounded-xl border divide-y">
          {activities.map((activity) => {
            const icon = activityTypeIcons[activity.activity_type] || "💪";
            const typeLabel = activityTypeLabels[activity.activity_type] || activity.activity_type;
            const feeling = activity.feeling ? feelingLabels[activity.feeling] : null;
            const startedAt = new Date(activity.started_at);
            
            return (
              <Link 
                key={activity.id}
                href={`/dashboard/activities/${activity.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group first:rounded-t-xl last:rounded-b-xl cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl text-xl bg-primary/10">
                    {icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {activity.title || typeLabel}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {typeLabel}
                      </Badge>
                      {feeling && (
                        <span title={feeling.label}>{feeling.emoji}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>
                        {format(startedAt, "d MMM yyyy", { locale: nl })}
                      </span>
                      <span className="text-xs">
                        {formatDistanceToNow(startedAt, { addSuffix: true, locale: nl })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {/* Activity Stats */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    {activity.distance_meters && (
                      <div className="text-center">
                        <p className="font-semibold">{(Number(activity.distance_meters) / 1000).toFixed(2)} km</p>
                        <p className="text-xs text-muted-foreground">Afstand</p>
                      </div>
                    )}
                    {activity.duration_seconds && (
                      <div className="text-center">
                        <p className="font-semibold">{formatDuration(activity.duration_seconds)}</p>
                        <p className="text-xs text-muted-foreground">Duur</p>
                      </div>
                    )}
                    {activity.avg_pace_sec_per_km && (
                      <div className="text-center">
                        <p className="font-semibold">{formatPace(activity.avg_pace_sec_per_km)}</p>
                        <p className="text-xs text-muted-foreground">Tempo</p>
                      </div>
                    )}
                    {activity.avg_heart_rate && (
                      <div className="text-center">
                        <p className="font-semibold flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5 text-red-500" />
                          {activity.avg_heart_rate}
                        </p>
                        <p className="text-xs text-muted-foreground">Gem. HR</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile stats summary */}
                  <div className="md:hidden flex items-center gap-2 text-sm text-muted-foreground">
                    {activity.distance_meters && (
                      <span>{(Number(activity.distance_meters) / 1000).toFixed(1)} km</span>
                    )}
                    {activity.duration_seconds && (
                      <span>• {formatDuration(activity.duration_seconds)}</span>
                    )}
                  </div>
                  
                  {activity.workouts?.title && (
                    <Badge variant="secondary" className="hidden lg:flex">
                      Gekoppeld aan workout
                    </Badge>
                  )}
                  
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Garmin Connection CTA */}
      {!hasGarminConnected && (
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20">
                <Watch className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Koppel je Garmin horloge</h3>
                <p className="text-sm text-muted-foreground">
                  Synchroniseer automatisch je trainingen en krijg gedetailleerde statistieken.
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings/integrations">
                Koppelen
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

