"use client"

import Link from "next/link"
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
    return hours > 0 ? `${hours}u ${mins}m` : `${mins}m`
  }

  // Show simplified cards when no plan exists
  if (!hasPlan) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card col-span-full @xl/main:col-span-2 @5xl/main:col-span-4">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Geen actief schema
            </CardDescription>
            <CardTitle className="text-xl font-semibold">
              Maak je eerste trainingsschema om te beginnen
            </CardTitle>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/dashboard/plan/new">
                <Plus className="mr-2 h-4 w-4" />
                Maak een schema
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const hasActivity = data.weeklyDistance > 0 || data.weeklyTime > 0 || data.completedWorkouts > 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Afstand deze week
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.weeklyDistance.toFixed(1)} km
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
              "Begin met trainen!"
            ) : data.weeklyDistanceChange >= 0 ? (
              <>Goed bezig! <TrendingUp className="size-4 text-emerald-500" /></>
            ) : (
              <>Iets minder dan vorige week <TrendingDown className="size-4 text-red-500" /></>
            )}
          </div>
          <div className="text-muted-foreground">
            {hasActivity ? "Vergeleken met vorige week" : "Nog geen activiteiten deze week"}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Trainingstijd
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
            Totale actieve tijd
          </div>
          <div className="text-muted-foreground">
            Deze week
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Trainingen
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
            Schema voortgang
          </div>
          <div className="text-muted-foreground">
            {data.totalWorkouts - data.completedWorkouts > 0 
              ? `${data.totalWorkouts - data.completedWorkouts} training${data.totalWorkouts - data.completedWorkouts !== 1 ? "en" : ""} nog te gaan`
              : data.totalWorkouts > 0 ? "Alle trainingen voltooid! 🎉" : "Geen trainingen gepland"
            }
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Streak
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.streak} dag{data.streak !== 1 ? "en" : ""}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={data.streak >= 3 ? "text-orange-500" : "text-muted-foreground"}>
              {data.streak >= 7 ? "🔥🔥🔥" : data.streak >= 3 ? "🔥" : "—"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {data.streak >= 7 ? "Fantastisch!" : data.streak >= 3 ? "Goed bezig!" : "Begin je streak!"}
          </div>
          <div className="text-muted-foreground">
            Opeenvolgende trainingsdagen
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
