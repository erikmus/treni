import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Clock,
  MapPin,
  Heart,
  Download,
  Play,
  Check,
  Calendar,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { WorkoutStructure, type WorkoutStructureData } from "@/components/workout/workout-structure";
import { cn } from "@/lib/utils";

interface WorkoutPageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

const workoutTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  easy_run: { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-200" },
  long_run: { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-200" },
  tempo_run: { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-200" },
  interval: { bg: "bg-red-500/10", text: "text-red-700", border: "border-red-200" },
  fartlek: { bg: "bg-purple-500/10", text: "text-purple-700", border: "border-purple-200" },
  recovery: { bg: "bg-teal-500/10", text: "text-teal-700", border: "border-teal-200" },
  hill_training: { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-200" },
  race_pace: { bg: "bg-rose-500/10", text: "text-rose-700", border: "border-rose-200" },
  cross_training: { bg: "bg-indigo-500/10", text: "text-indigo-700", border: "border-indigo-200" },
  rest: { bg: "bg-gray-500/10", text: "text-gray-700", border: "border-gray-200" },
};

const workoutTypeLabels: Record<string, string> = {
  easy_run: "Rustige duurloop",
  long_run: "Lange duurloop",
  tempo_run: "Tempo",
  interval: "Interval",
  fartlek: "Fartlek",
  recovery: "Herstel",
  hill_training: "Heuveltraining",
  race_pace: "Wedstrijdtempo",
  cross_training: "Cross-training",
  rest: "Rust",
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

// Goal type to distance in km
const goalDistances: Record<string, number> = {
  "5k": 5,
  "10k": 10,
  "15k": 15,
  "half_marathon": 21.0975,
  "marathon": 42.195,
  "fitness": 5, // Default for fitness goals
  "custom": 10, // Default for custom goals
};

// Calculate race pace in seconds per km based on training plan
function calculateRacePaceSeconds(trainingPlan: { goal_type: string; target_time_minutes: number | null } | null): number | undefined {
  if (!trainingPlan?.target_time_minutes || !trainingPlan?.goal_type) {
    return undefined;
  }
  
  const distanceKm = goalDistances[trainingPlan.goal_type];
  if (!distanceKm) return undefined;
  
  // target_time_minutes / distance_km = minutes per km
  // Convert to seconds per km
  const paceMinutesPerKm = trainingPlan.target_time_minutes / distanceKm;
  return Math.round(paceMinutesPerKm * 60);
}

export default async function WorkoutDetailPage({ params }: WorkoutPageProps) {
  const { workoutId } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch workout
  const { data: workout, error } = await supabase
    .from("workouts")
    .select("*, training_plans(*)")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single();

  if (error || !workout) {
    notFound();
  }

  const colors = workoutTypeColors[workout.workout_type] || workoutTypeColors.easy_run;
  const icon = workoutTypeIcons[workout.workout_type] || "🏃";
  const typeLabel = workoutTypeLabels[workout.workout_type] || workout.workout_type;
  const isCompleted = workout.status === "completed";
  const workoutDate = new Date(workout.scheduled_date);

  const formatPace = (pace: number | null): string => {
    if (!pace) return "";
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")} /km`;
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "flex items-center justify-center w-16 h-16 rounded-xl text-3xl",
            colors.bg
          )}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={cn(colors.bg, colors.text, colors.border)}>
                {typeLabel}
              </Badge>
              {isCompleted && (
                <Badge className="bg-emerald-500">
                  <Check className="mr-1 h-3 w-3" />
                  Voltooid
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold">{workout.title}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {format(workoutDate, "EEEE d MMMM yyyy", { locale: nl })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/api/workouts/${workoutId}/fit`} download>
              <Download className="mr-2 h-4 w-4" />
              .FIT
            </Link>
          </Button>
          {!isCompleted && (
            <Button>
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          {workout.description && (
            <div className="bg-card rounded-xl border p-6">
              <h2 className="font-semibold mb-3">Beschrijving</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {workout.description}
              </p>
            </div>
          )}

          {/* Workout Structure */}
          {workout.workout_structure && (
            <div className="bg-card rounded-xl border p-6">
              <h2 className="font-semibold mb-4">Trainingsopbouw</h2>
              <WorkoutStructure 
                structure={workout.workout_structure as unknown as WorkoutStructureData} 
                racePaceSeconds={calculateRacePaceSeconds(workout.training_plans)}
              />
            </div>
          )}

          {/* Coach Notes */}
          {workout.coach_notes && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <span>💡</span> Coach tips
              </h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {workout.coach_notes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Doelen</h2>
            <div className="space-y-4">
              {workout.target_duration_minutes && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duur</p>
                    <p className="font-semibold">{workout.target_duration_minutes} minuten</p>
                  </div>
                </div>
              )}
              {workout.target_distance_km && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Afstand</p>
                    <p className="font-semibold">{Number(workout.target_distance_km).toFixed(1)} km</p>
                  </div>
                </div>
              )}
              {workout.target_pace_min_per_km && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                    <Target className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo</p>
                    <p className="font-semibold">{formatPace(Number(workout.target_pace_min_per_km))}</p>
                  </div>
                </div>
              )}
              {workout.target_heart_rate_zone && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                    <Heart className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hartslag zone</p>
                    <p className="font-semibold">Zone {workout.target_heart_rate_zone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Plan Info */}
          {workout.training_plans && (
            <div className="bg-card rounded-xl border p-6">
              <h2 className="font-semibold mb-3">Onderdeel van</h2>
              <Link
                href={`/dashboard/plan/${workout.training_plans.id}`}
                className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <p className="font-medium">{workout.training_plans.name}</p>
                <p className="text-sm text-muted-foreground">
                  Week {workout.week_number} van {workout.training_plans.weeks_duration}
                </p>
              </Link>
            </div>
          )}

          {/* Export Actions */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Exporteren</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/api/workouts/${workoutId}/fit`} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download .FIT bestand
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Upload naar Garmin Connect of sync direct met je horloge
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

