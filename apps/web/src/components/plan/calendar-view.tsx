"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { TrainingPlan, Workout } from "@/types/database";
import { WorkoutCard } from "./workout-card";

interface CalendarViewProps {
  plan: TrainingPlan;
  workouts: Workout[];
}

const workoutTypeColors: Record<string, string> = {
  easy_run: "bg-emerald-500",
  long_run: "bg-blue-500",
  tempo_run: "bg-orange-500",
  interval: "bg-red-500",
  fartlek: "bg-purple-500",
  recovery: "bg-teal-500",
  hill_training: "bg-amber-500",
  race_pace: "bg-rose-500",
  cross_training: "bg-indigo-500",
  rest: "bg-gray-400",
};

export function CalendarView({ plan, workouts }: CalendarViewProps) {
  const t = useTranslations("workouts.types");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");

  // Group workouts by date
  const workoutsByDate = useMemo(() => {
    return workouts.reduce((acc, workout) => {
      const date = workout.scheduled_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(workout);
      return acc;
    }, {} as Record<string, Workout[]>);
  }, [workouts]);

  // Generate calendar days for month view
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentDate]);

  // Generate days for week view
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [currentDate]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate(addDays(currentDate, direction === "prev" ? -7 : 7));
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => view === "month" ? navigateMonth("prev") : navigateWeek("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[200px] text-center">
              {view === "month"
                ? format(currentDate, "MMMM yyyy", { locale: nl })
                : `Week ${format(currentDate, "w", { locale: nl })}`}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => view === "month" ? navigateMonth("next") : navigateWeek("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Vandaag
          </Button>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week")}>
          <TabsList>
            <TabsTrigger value="month">
              <Calendar className="h-4 w-4 mr-2" />
              Maand
            </TabsTrigger>
            <TabsTrigger value="week">
              <List className="h-4 w-4 mr-2" />
              Week
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(workoutTypeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded-full", color)} />
            <span className="text-muted-foreground">
              {t(type as keyof typeof t)}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {view === "month" ? (
        <div className="bg-card rounded-xl border overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day) => (
              <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayWorkouts = workoutsByDate[dateStr] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={dateStr}
                  className={cn(
                    "min-h-[100px] p-2 border-b border-r last:border-r-0",
                    !isCurrentMonth && "bg-muted/30",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-sm mb-1",
                    !isCurrentMonth && "text-muted-foreground",
                    isToday(day) && "font-bold text-primary"
                  )}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayWorkouts.map((workout) => (
                      <Link
                        key={workout.id}
                        href={`/dashboard/workouts/${workout.id}`}
                        className={cn(
                          "block text-xs p-1.5 rounded text-white truncate hover:opacity-80 transition-opacity",
                          workoutTypeColors[workout.workout_type] || "bg-gray-500",
                          workout.status === "completed" && "opacity-60"
                        )}
                      >
                        {workout.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week View */
        <div className="space-y-4">
          {weekDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayWorkouts = workoutsByDate[dateStr] || [];

            return (
              <div
                key={dateStr}
                className={cn(
                  "bg-card rounded-xl border p-4",
                  isToday(day) && "ring-2 ring-primary"
                )}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn(
                    "flex flex-col items-center justify-center w-14 h-14 rounded-lg",
                    isToday(day) ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <span className="text-xs uppercase">
                      {format(day, "EEE", { locale: nl })}
                    </span>
                    <span className="text-lg font-bold">
                      {format(day, "d")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {format(day, "EEEE d MMMM", { locale: nl })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {dayWorkouts.length === 0
                        ? "Rustdag"
                        : `${dayWorkouts.length} training${dayWorkouts.length > 1 ? "en" : ""}`}
                    </p>
                  </div>
                </div>

                {dayWorkouts.length > 0 ? (
                  <div className="space-y-3">
                    {dayWorkouts.map((workout) => (
                      <WorkoutCard key={workout.id} workout={workout} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <span className="text-2xl">🧘</span>
                    <p className="text-sm mt-2">Geen training gepland</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{plan.weeks_duration}</p>
          <p className="text-sm text-muted-foreground">Weken</p>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{workouts.length}</p>
          <p className="text-sm text-muted-foreground">Trainingen</p>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">
            {workouts.filter((w) => w.status === "completed").length}
          </p>
          <p className="text-sm text-muted-foreground">Voltooid</p>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-blue-500">
            {workouts.filter((w) => w.status === "scheduled").length}
          </p>
          <p className="text-sm text-muted-foreground">Nog te gaan</p>
        </div>
      </div>
    </div>
  );
}

