import { redirect } from "next/navigation";
import Link from "next/link";
import { format, isToday, isFuture, isPast } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import { getTranslations, getLocale } from "next-intl/server";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Circle,
  ChevronRight,
  Dumbbell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const workoutTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  easy_run: { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-500/30" },
  long_run: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-500/30" },
  tempo_run: { bg: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-400", border: "border-orange-500/30" },
  interval: { bg: "bg-red-500/10", text: "text-red-700 dark:text-red-400", border: "border-red-500/30" },
  fartlek: { bg: "bg-purple-500/10", text: "text-purple-700 dark:text-purple-400", border: "border-purple-500/30" },
  recovery: { bg: "bg-teal-500/10", text: "text-teal-700 dark:text-teal-400", border: "border-teal-500/30" },
  hill_training: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-500/30" },
  race_pace: { bg: "bg-rose-500/10", text: "text-rose-700 dark:text-rose-400", border: "border-rose-500/30" },
  cross_training: { bg: "bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-500/30" },
  rest: { bg: "bg-gray-500/10", text: "text-gray-700 dark:text-gray-400", border: "border-gray-500/30" },
};

const workoutTypeIcons: Record<string, string> = {
  easy_run: "🏃",
  long_run: "🏃‍♂️",
  tempo_run: "⚡",
  interval: "🔥",
  fartlek: "🎯",
  recovery: "🧘",
  hill_training: "⛰️",
  race_pace: "🏁",
  cross_training: "🏋️",
  rest: "😴",
};

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations("workouts");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();
  const dateLocale = locale === "nl" ? nl : enUS;

  if (!user) {
    redirect("/login");
  }

  // Fetch all workouts for this user, with their training plan info
  const { data: workouts } = await supabase
    .from("workouts")
    .select("*, training_plans(name)")
    .eq("user_id", user.id)
    .order("scheduled_date", { ascending: true });

  // Group workouts by status
  const upcomingWorkouts = workouts?.filter(w => 
    w.status === "scheduled" && (isToday(new Date(w.scheduled_date)) || isFuture(new Date(w.scheduled_date)))
  ) || [];
  
  const completedWorkouts = workouts?.filter(w => w.status === "completed") || [];
  const missedWorkouts = workouts?.filter(w => 
    w.status === "scheduled" && isPast(new Date(w.scheduled_date)) && !isToday(new Date(w.scheduled_date))
  ) || [];

  const todayWorkout = upcomingWorkouts.find(w => isToday(new Date(w.scheduled_date)));

  if (!workouts || workouts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <div className="text-center px-4">
          <div className="rounded-full bg-primary/10 w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Dumbbell className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-4">{t("empty.title")}</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {t("empty.description")}
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard/plan/new">
              {t("empty.cta")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">
            {workouts.length} workout{workouts.length !== 1 ? "s" : ""} • {completedWorkouts.length} {t("status.completed").toLowerCase()}
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            {t("stats.scheduled")}
          </div>
          <p className="text-2xl font-bold">{upcomingWorkouts.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            {t("stats.completed")}
          </div>
          <p className="text-2xl font-bold text-emerald-600">{completedWorkouts.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Circle className="h-4 w-4 text-orange-500" />
            {t("stats.missed")}
          </div>
          <p className="text-2xl font-bold text-orange-600">{missedWorkouts.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            {t("stats.completionRate")}
          </div>
          <p className="text-2xl font-bold">
            {workouts.length > 0 
              ? Math.round((completedWorkouts.length / workouts.length) * 100) 
              : 0}%
          </p>
        </div>
      </div>

      {/* Today's Workout Highlight */}
      {todayWorkout && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-6">
          <div className="flex items-center gap-2 text-sm text-primary font-medium mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {t("todayScheduled")}
          </div>
          <Link 
            href={`/dashboard/workouts/${todayWorkout.id}`}
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex items-center justify-center w-14 h-14 rounded-xl text-2xl",
                workoutTypeColors[todayWorkout.workout_type]?.bg || "bg-primary/10"
              )}>
                {workoutTypeIcons[todayWorkout.workout_type] || "🏃"}
              </div>
              <div>
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                  {todayWorkout.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  {todayWorkout.target_duration_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {todayWorkout.target_duration_minutes} min
                    </span>
                  )}
                  {todayWorkout.target_distance_km && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {Number(todayWorkout.target_distance_km).toFixed(1)} km
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </div>
      )}

      {/* Upcoming Workouts */}
      {upcomingWorkouts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("upcoming")}
          </h2>
          <div className="bg-card rounded-xl border divide-y">
            {upcomingWorkouts.slice(0, 10).map((workout) => {
              const colors = workoutTypeColors[workout.workout_type] || workoutTypeColors.easy_run;
              const icon = workoutTypeIcons[workout.workout_type] || "🏃";
              const workoutTypeKey = workout.workout_type as "easy_run" | "long_run" | "tempo_run" | "interval" | "fartlek" | "recovery" | "hill_training" | "race_pace" | "cross_training" | "rest";
              const typeLabel = t.has(`types.${workoutTypeKey}`) ? t(`types.${workoutTypeKey}`) : workout.workout_type;
              const workoutDate = new Date(workout.scheduled_date);
              
              return (
                <Link 
                  key={workout.id}
                  href={`/dashboard/workouts/${workout.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group first:rounded-t-xl last:rounded-b-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-xl text-xl",
                      colors.bg
                    )}>
                      {icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {workout.title}
                        </h3>
                        <Badge variant="outline" className={cn("text-xs", colors.bg, colors.text, colors.border)}>
                          {typeLabel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>
                          {isToday(workoutDate) 
                            ? tCommon("today") 
                            : format(workoutDate, "EEEE d MMM", { locale: dateLocale })}
                        </span>
                        {workout.target_duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {workout.target_duration_minutes} min
                          </span>
                        )}
                        {workout.target_distance_km && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {Number(workout.target_distance_km).toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              );
            })}
          </div>
          {upcomingWorkouts.length > 10 && (
            <p className="text-sm text-muted-foreground text-center">
              {tCommon("andMore", { count: upcomingWorkouts.length - 10 })}
            </p>
          )}
        </div>
      )}

      {/* Completed Workouts */}
      {completedWorkouts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            {t("completedWorkouts")}
          </h2>
          <div className="bg-card rounded-xl border divide-y">
            {completedWorkouts.slice(-5).reverse().map((workout) => {
              const colors = workoutTypeColors[workout.workout_type] || workoutTypeColors.easy_run;
              const icon = workoutTypeIcons[workout.workout_type] || "🏃";
              const workoutDate = new Date(workout.scheduled_date);
              
              return (
                <Link 
                  key={workout.id}
                  href={`/dashboard/workouts/${workout.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group first:rounded-t-xl last:rounded-b-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-xl text-xl relative",
                      colors.bg
                    )}>
                      {icon}
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium group-hover:text-primary transition-colors">
                        {workout.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{format(workoutDate, "d MMM yyyy", { locale: dateLocale })}</span>
                        {workout.target_distance_km && (
                          <span>{Number(workout.target_distance_km).toFixed(1)} km</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
