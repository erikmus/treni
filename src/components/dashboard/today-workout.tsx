"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Play,
  Plus,
  Dumbbell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Workout } from "@/types/database"

interface TodayWorkoutProps {
  workout: Workout | null
  hasPlan: boolean
}

const workoutTypeColors: Record<string, string> = {
  easy_run: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  long_run: "bg-blue-500/10 text-blue-700 border-blue-200",
  tempo_run: "bg-orange-500/10 text-orange-700 border-orange-200",
  interval: "bg-red-500/10 text-red-700 border-red-200",
  fartlek: "bg-purple-500/10 text-purple-700 border-purple-200",
  recovery: "bg-teal-500/10 text-teal-700 border-teal-200",
  hill_training: "bg-amber-500/10 text-amber-700 border-amber-200",
  race_pace: "bg-rose-500/10 text-rose-700 border-rose-200",
  cross_training: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
  rest: "bg-gray-500/10 text-gray-700 border-gray-200",
}

export function TodayWorkout({ workout, hasPlan }: TodayWorkoutProps) {
  const t = useTranslations("workouts.types")
  const tDashboard = useTranslations("dashboard")

  if (!hasPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {tDashboard("todayWorkout")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Dumbbell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">{tDashboard("noPlan")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Maak je eerste trainingsschema om te beginnen
            </p>
            <Button asChild>
              <Link href="/dashboard/plan/new">
                <Plus className="mr-2 h-4 w-4" />
                {tDashboard("createPlan")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!workout) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {tDashboard("todayWorkout")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-emerald-500/10 p-4 mb-4">
              <span className="text-3xl">🧘</span>
            </div>
            <h3 className="font-semibold mb-2">Rustdag</h3>
            <p className="text-sm text-muted-foreground">
              {tDashboard("noWorkoutToday")}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          {tDashboard("todayWorkout")}
        </CardTitle>
        <CardDescription>
          {new Date().toLocaleDateString("nl-NL", { 
            weekday: "long", 
            day: "numeric", 
            month: "long" 
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Workout type badge */}
          <Badge 
            variant="outline" 
            className={workoutTypeColors[workout.workout_type] || ""}
          >
            {t(workout.workout_type as keyof typeof t)}
          </Badge>

          {/* Workout title */}
          <h3 className="text-lg font-semibold">{workout.title}</h3>

          {/* Workout details */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
          </div>

          {/* Description */}
          {workout.description && (
            <p className="text-sm text-muted-foreground">
              {workout.description}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1">
              <Play className="mr-2 h-4 w-4" />
              Start training
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/workouts/${workout.id}`}>
                Details
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

