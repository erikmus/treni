"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Clock, MapPin, Heart, ChevronRight, Check, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Workout } from "@/types/database";

interface WorkoutCardProps {
  workout: Workout;
  showDate?: boolean;
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

export function WorkoutCard({ workout, showDate = false }: WorkoutCardProps) {
  const t = useTranslations("workouts.types");
  const tStatus = useTranslations("workouts.status");
  
  const colors = workoutTypeColors[workout.workout_type] || workoutTypeColors.easy_run;
  const icon = workoutTypeIcons[workout.workout_type] || "🏃";
  const isCompleted = workout.status === "completed";

  const formatPace = (pace: number | null): string => {
    if (!pace) return "";
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")} /km`;
  };

  return (
    <div
      className={cn(
        "group relative rounded-lg border p-4 transition-all hover:shadow-md",
        isCompleted && "opacity-70"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-lg text-2xl",
          colors.bg
        )}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Badge variant="outline" className={cn(colors.bg, colors.text, colors.border, "mb-2")}>
                {t(workout.workout_type as keyof typeof t)}
              </Badge>
              <h3 className={cn("font-semibold", isCompleted && "line-through")}>
                {workout.title}
              </h3>
            </div>
            {isCompleted && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            {workout.target_duration_minutes && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{workout.target_duration_minutes} min</span>
              </div>
            )}
            {workout.target_distance_km && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{Number(workout.target_distance_km).toFixed(1)} km</span>
              </div>
            )}
            {workout.target_heart_rate_zone && (
              <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                <span>Zone {workout.target_heart_rate_zone}</span>
              </div>
            )}
          </div>

          {/* Description preview */}
          {workout.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {workout.description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={`/dashboard/workouts/${workout.id}`}>
            Details bekijken
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/api/workouts/${workout.id}/fit`} download>
            <Download className="h-4 w-4" />
            <span className="sr-only">Download .FIT</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}

