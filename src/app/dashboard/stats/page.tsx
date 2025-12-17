import { redirect } from "next/navigation";
import Link from "next/link";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  ChartLine,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
  Flame,
  Target,
  Calendar,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { PersonalRecords } from "@/components/stats/personal-records";

function formatPace(secondsPerKm: number | null): string {
  if (!secondsPerKm) return "-";
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}u ${mins}m`;
  }
  return `${mins}m`;
}

function formatRaceTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user stats
  const { data: latestStats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch activities for calculations
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
  const { data: recentActivities } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", user.id)
    .eq("activity_type", "run")
    .gte("started_at", thirtyDaysAgo)
    .order("started_at", { ascending: false });

  // Fetch workouts for completion stats
  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id)
    .order("scheduled_date", { ascending: false });

  // Calculate weekly stats
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const lastWeekStart = subDays(thisWeekStart, 7);
  const lastWeekEnd = subDays(thisWeekStart, 1);

  const thisWeekActivities = recentActivities?.filter(a => {
    const date = new Date(a.started_at);
    return date >= thisWeekStart && date <= thisWeekEnd;
  }) || [];

  const lastWeekActivities = recentActivities?.filter(a => {
    const date = new Date(a.started_at);
    return date >= lastWeekStart && date <= lastWeekEnd;
  }) || [];

  // Calculate totals
  const thisWeekDistance = thisWeekActivities.reduce((sum, a) => sum + (Number(a.distance_meters) || 0), 0) / 1000;
  const lastWeekDistance = lastWeekActivities.reduce((sum, a) => sum + (Number(a.distance_meters) || 0), 0) / 1000;
  const distanceChange = lastWeekDistance > 0 
    ? Math.round(((thisWeekDistance - lastWeekDistance) / lastWeekDistance) * 100) 
    : 0;

  const thisWeekDuration = thisWeekActivities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) / 60;
  const lastWeekDuration = lastWeekActivities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) / 60;
  const durationChange = lastWeekDuration > 0 
    ? Math.round(((thisWeekDuration - lastWeekDuration) / lastWeekDuration) * 100) 
    : 0;

  // Completed workouts this week
  const completedThisWeek = workouts?.filter(w => {
    const date = new Date(w.scheduled_date);
    return w.status === "completed" && date >= thisWeekStart && date <= thisWeekEnd;
  }).length || 0;

  // Training streak calculation
  const daysWithActivity = new Set(
    recentActivities?.map(a => format(new Date(a.started_at), "yyyy-MM-dd")) || []
  );

  let streak = 0;
  let checkDate = new Date();
  while (daysWithActivity.has(format(checkDate, "yyyy-MM-dd")) || streak === 0) {
    if (daysWithActivity.has(format(checkDate, "yyyy-MM-dd"))) {
      streak++;
    } else if (streak > 0) {
      break;
    }
    checkDate = subDays(checkDate, 1);
    if (streak === 0 && !daysWithActivity.has(format(new Date(), "yyyy-MM-dd"))) {
      break;
    }
  }

  // Weekly activity heatmap data
  const weekDays = eachDayOfInterval({ start: thisWeekStart, end: thisWeekEnd });
  const activityByDay = weekDays.map(day => {
    const dayActivities = thisWeekActivities.filter(a => 
      isSameDay(new Date(a.started_at), day)
    );
    const distance = dayActivities.reduce((sum, a) => sum + (Number(a.distance_meters) || 0), 0) / 1000;
    return {
      date: day,
      distance,
      hasActivity: dayActivities.length > 0,
    };
  });

  const hasData = (recentActivities?.length || 0) > 0 || (workouts?.length || 0) > 0 || latestStats;

  if (!hasData) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Statistieken</h1>
            <p className="text-muted-foreground mt-1">
              Analyseer je voortgang en prestaties
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="text-center px-4">
            <div className="rounded-full bg-primary/10 w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <ChartLine className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Nog geen data</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start met trainen om je statistieken en voortgang te zien.
              Je kunt ook activiteiten handmatig toevoegen of je Garmin koppelen.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/dashboard/plan/new">
                  Schema maken
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/activities/new">
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
          <h1 className="text-3xl font-bold">Statistieken</h1>
          <p className="text-muted-foreground mt-1">
            Je trainingsvoortgang en prestaties
          </p>
        </div>
      </div>

      {/* This Week Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <MapPin className="h-4 w-4" />
            Deze week
          </div>
          <p className="text-2xl font-bold">{thisWeekDistance.toFixed(1)} km</p>
          <div className="flex items-center gap-1 mt-1">
            {distanceChange >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className={cn(
              "text-xs",
              distanceChange >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {distanceChange >= 0 ? "+" : ""}{distanceChange}% vs vorige week
            </span>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            Trainingstijd
          </div>
          <p className="text-2xl font-bold">{formatTime(thisWeekDuration)}</p>
          <div className="flex items-center gap-1 mt-1">
            {durationChange >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className={cn(
              "text-xs",
              durationChange >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {durationChange >= 0 ? "+" : ""}{durationChange}% vs vorige week
            </span>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            Trainingen
          </div>
          <p className="text-2xl font-bold">{completedThisWeek}</p>
          <p className="text-xs text-muted-foreground mt-1">
            deze week voltooid
          </p>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Flame className="h-4 w-4 text-orange-500" />
            Streak
          </div>
          <p className="text-2xl font-bold">{streak} dag{streak !== 1 ? "en" : ""}</p>
          <p className="text-xs text-muted-foreground mt-1">
            opeenvolgend actief
          </p>
        </div>
      </div>

      {/* Weekly Activity Heatmap */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Deze week</h2>
        <div className="grid grid-cols-7 gap-2">
          {activityByDay.map((day, i) => (
            <div key={i} className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                {format(day.date, "EEE", { locale: nl })}
              </p>
              <div className={cn(
                "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors",
                day.hasActivity 
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" 
                  : "bg-muted text-muted-foreground"
              )}>
                {day.distance > 0 ? `${day.distance.toFixed(1)}` : "-"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(day.date, "d", { locale: nl })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Bests & Predictions */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Personal Records */}
        <PersonalRecords userId={user.id} />

        {/* Race Time Predictions */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Geschatte wedstrijdtijden
          </h2>
          {latestStats ? (
            <div className="space-y-3">
              {latestStats.estimated_5k_time_seconds && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">5K</span>
                  <span className="font-semibold">{formatRaceTime(latestStats.estimated_5k_time_seconds)}</span>
                </div>
              )}
              {latestStats.estimated_10k_time_seconds && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">10K</span>
                  <span className="font-semibold">{formatRaceTime(latestStats.estimated_10k_time_seconds)}</span>
                </div>
              )}
              {latestStats.estimated_half_marathon_seconds && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Halve Marathon</span>
                  <span className="font-semibold">{formatRaceTime(latestStats.estimated_half_marathon_seconds)}</span>
                </div>
              )}
              {latestStats.estimated_marathon_seconds && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Marathon</span>
                  <span className="font-semibold">{formatRaceTime(latestStats.estimated_marathon_seconds)}</span>
                </div>
              )}
              {latestStats.estimated_vo2max && (
                <div className="mt-4 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      VO2max
                    </span>
                    <span className="font-semibold">{Number(latestStats.estimated_vo2max).toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Train meer om nauwkeurige voorspellingen te krijgen. 
              Koppel je Garmin voor automatische berekeningen.
            </p>
          )}
        </div>
      </div>

      {/* Training Load Overview */}
      {latestStats && (latestStats.fitness_score || latestStats.fatigue_score) && (
        <div className="bg-card rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Training Load</h2>
          <div className="grid grid-cols-3 gap-4">
            {latestStats.fitness_score && (
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">{latestStats.fitness_score}</div>
                <p className="text-sm text-muted-foreground">Fitness</p>
              </div>
            )}
            {latestStats.fatigue_score && (
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{latestStats.fatigue_score}</div>
                <p className="text-sm text-muted-foreground">Vermoeidheid</p>
              </div>
            )}
            {latestStats.fitness_score && latestStats.fatigue_score && (
              <div className="text-center">
                <div className={cn(
                  "text-3xl font-bold",
                  latestStats.fitness_score - latestStats.fatigue_score > 0 
                    ? "text-emerald-600" 
                    : "text-red-600"
                )}>
                  {latestStats.fitness_score - latestStats.fatigue_score}
                </div>
                <p className="text-sm text-muted-foreground">Vorm</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monthly Summary */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 p-6">
        <h2 className="font-semibold mb-4">Afgelopen 30 dagen</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-2xl font-bold">
              {((recentActivities?.reduce((sum, a) => sum + (Number(a.distance_meters) || 0), 0) || 0) / 1000).toFixed(1)} km
            </p>
            <p className="text-sm text-muted-foreground">Totale afstand</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {recentActivities?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground">Activiteiten</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {formatTime((recentActivities?.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) || 0) / 60)}
            </p>
            <p className="text-sm text-muted-foreground">Trainingstijd</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {recentActivities && recentActivities.length > 0 
                ? formatPace(recentActivities.reduce((sum, a) => sum + (a.avg_pace_sec_per_km || 0), 0) / recentActivities.length)
                : "-"
              }
            </p>
            <p className="text-sm text-muted-foreground">Gem. tempo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

