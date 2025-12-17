"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { CalendarDays, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Workout } from "@/types/database"

interface WeekOverviewProps {
  workouts: Workout[]
  hasPlan: boolean
}

const dayNames = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"]

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
}

export function WeekOverview({ workouts, hasPlan }: WeekOverviewProps) {
  const t = useTranslations("workouts.types")
  const tDashboard = useTranslations("dashboard")

  // Get dates for current week (Monday to Sunday)
  const getWeekDates = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      return date
    })
  }

  const weekDates = getWeekDates()
  const today = new Date().toISOString().split("T")[0]

  // Map workouts to dates
  const workoutsByDate = workouts.reduce((acc, workout) => {
    acc[workout.scheduled_date] = workout
    return acc
  }, {} as Record<string, Workout>)

  if (!hasPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {tDashboard("upcomingWorkouts")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Start een trainingsschema om je weekoverzicht te zien
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard/plan/new">
                Schema maken
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          {tDashboard("upcomingWorkouts")}
        </CardTitle>
        <CardDescription>
          Week van {weekDates[0].toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split("T")[0]
            const workout = workoutsByDate[dateStr]
            const isToday = dateStr === today
            const isPast = dateStr < today
            const isCompleted = workout?.status === "completed"

            return (
              <div
                key={dateStr}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors",
                  isToday && "bg-primary/5 border border-primary/20",
                  isPast && !isToday && "opacity-60"
                )}
              >
                {/* Day indicator */}
                <div className={cn(
                  "flex flex-col items-center justify-center w-10 h-10 rounded-lg text-xs font-medium",
                  isToday ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <span>{dayNames[index]}</span>
                  <span className="text-[10px]">{date.getDate()}</span>
                </div>

                {/* Workout info */}
                <div className="flex-1 min-w-0">
                  {workout ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {workoutTypeIcons[workout.workout_type] || "🏃"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {t(workout.workout_type as keyof typeof t)}
                        </p>
                        {workout.target_duration_minutes && (
                          <p className="text-xs text-muted-foreground">
                            {workout.target_duration_minutes} min
                            {workout.target_distance_km && ` • ${Number(workout.target_distance_km).toFixed(1)} km`}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Rust</p>
                  )}
                </div>

                {/* Status indicator */}
                {isCompleted && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10">
                    <Check className="h-4 w-4 text-emerald-500" />
                  </div>
                )}

                {/* Arrow for today */}
                {isToday && workout && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )
          })}
        </div>

        {/* View full plan link */}
        <div className="mt-4 pt-4 border-t">
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/dashboard/plan">
              {tDashboard("viewPlan")}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

