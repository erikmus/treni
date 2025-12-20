"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { TrendingUp, TrendingDown, Flame, Timer, MapPin, Calendar, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDistanceUnit } from "@/hooks/use-distance-unit"

interface StatsData {
  weeklyDistance: number
  weeklyDistanceChange: number
  weeklyTime: number
  weeklyTimeChange: number
  completedWorkouts: number
  totalWorkouts: number
  streak: number
}

interface SectionCardsProps {
  stats?: StatsData
  hasPlan?: boolean
}

export function SectionCards({ stats, hasPlan = true }: SectionCardsProps) {
  const t = useTranslations("sectionCards")
  const tCommon = useTranslations("common")
  const { formatDistance } = useDistanceUnit()
  
  // Default to zeros if no stats provided
  const data = stats || {
    weeklyDistance: 0,
    weeklyDistanceChange: 0,
    weeklyTime: 0,
    weeklyTimeChange: 0,
    completedWorkouts: 0,
    totalWorkouts: 0,
    streak: 0,
  }

  const formatTime = (minutes: number) => {
    if (minutes === 0) return "0m"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Show simplified cards when no plan exists
  if (!hasPlan) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card col-span-full @xl/main:col-span-2 @5xl/main:col-span-4">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t("noActivePlan")}
            </CardDescription>
            <CardTitle className="text-xl font-semibold">
              {t("createFirstPlan")}
            </CardTitle>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/dashboard/plan/new">
                <Plus className="mr-2 h-4 w-4" />
                {t("createPlan")}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const hasActivity = data.weeklyDistance > 0 || data.weeklyTime > 0 || data.completedWorkouts > 0
  const trainingsToGo = data.totalWorkouts - data.completedWorkouts

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t("distanceThisWeek")}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatDistance(data.weeklyDistance)}
          </CardTitle>
          <CardAction>
            {data.weeklyDistanceChange !== 0 ? (
              <Badge variant="outline" className={data.weeklyDistanceChange >= 0 ? "text-emerald-600" : "text-red-500"}>
                {data.weeklyDistanceChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {data.weeklyDistanceChange >= 0 ? "+" : ""}{data.weeklyDistanceChange}%
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                —
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {!hasActivity ? (
              t("startTraining")
            ) : data.weeklyDistanceChange >= 0 ? (
              <>{t("goodJob")} <TrendingUp className="size-4 text-emerald-500" /></>
            ) : (
              <>{t("lessThisWeek")} <TrendingDown className="size-4 text-red-500" /></>
            )}
          </div>
          <div className="text-muted-foreground">
            {hasActivity ? t("comparedToLastWeek") : t("noActivitiesYet")}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            {t("trainingTime")}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatTime(data.weeklyTime)}
          </CardTitle>
          <CardAction>
            {data.weeklyTimeChange !== 0 ? (
              <Badge variant="outline" className={data.weeklyTimeChange >= 0 ? "text-emerald-600" : "text-red-500"}>
                {data.weeklyTimeChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {data.weeklyTimeChange >= 0 ? "+" : ""}{data.weeklyTimeChange}%
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                —
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t("totalActiveTime")}
          </div>
          <div className="text-muted-foreground">
            {t("thisWeek")}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t("trainings")}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.completedWorkouts}/{data.totalWorkouts}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-primary">
              {data.totalWorkouts > 0 
                ? `${Math.round((data.completedWorkouts / data.totalWorkouts) * 100)}%`
                : "0%"
              }
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t("planProgress")}
          </div>
          <div className="text-muted-foreground">
            {trainingsToGo > 0 
              ? t("trainingsToGo", { count: trainingsToGo }).split("|")[trainingsToGo === 1 ? 0 : 1]?.trim()
              : data.totalWorkouts > 0 ? t("allTrainingsCompleted") : t("noTrainingsScheduled")
            }
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            {t("streak")}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.streak} {data.streak !== 1 ? tCommon("days") : tCommon("day")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={data.streak >= 3 ? "text-orange-500" : "text-muted-foreground"}>
              {data.streak >= 7 ? "🔥🔥🔥" : data.streak >= 3 ? "🔥" : "—"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {data.streak >= 7 ? t("fantastic") : data.streak >= 3 ? t("goodJob") : t("startYourStreak")}
          </div>
          <div className="text-muted-foreground">
            {t("consecutiveTrainingDays")}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
