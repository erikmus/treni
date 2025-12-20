"use client";

import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Calendar, Clock, Target, User, Sparkles } from "lucide-react";
import type { PlanWizardData } from "./plan-wizard";
import type { GoalType, ExperienceLevel } from "@/types/database";

interface PlanReviewProps {
  data: PlanWizardData;
}

const goalLabels: Record<GoalType, string> = {
  "5k": "5 Kilometer",
  "10k": "10 Kilometer",
  "15k": "15 Kilometer",
  "half_marathon": "Halve Marathon",
  "marathon": "Marathon",
  "fitness": "Fit Blijven",
  "custom": "Aangepast",
};

const experienceLabels: Record<ExperienceLevel, string> = {
  beginner: "Beginner",
  intermediate: "Gemiddeld",
  advanced: "Gevorderd",
  elite: "Elite",
};

const weekDays: Record<string, string> = {
  monday: "Maandag",
  tuesday: "Dinsdag",
  wednesday: "Woensdag",
  thursday: "Donderdag",
  friday: "Vrijdag",
  saturday: "Zaterdag",
  sunday: "Zondag",
};

export function PlanReview({ data }: PlanReviewProps) {
  const formatTargetTime = (minutes: number | null): string => {
    if (!minutes) return "Geen doeltijd";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}`;
    }
    return `${mins} minuten`;
  };

  // Calculate weeks until event
  const weeksUntilEvent = data.eventDate 
    ? Math.ceil((data.eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 7))
    : 12;

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Klaar om te starten!</h2>
        <p className="text-muted-foreground">
          Controleer je gegevens en genereer je persoonlijke trainingsschema
        </p>
      </div>

      <div className="space-y-6">
        {/* Goal Summary */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Jouw doel</h3>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Afstand</span>
              <span className="font-medium">{goalLabels[data.goalType!]}</span>
            </div>
            {data.eventName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Evenement</span>
                <span className="font-medium">{data.eventName}</span>
              </div>
            )}
            {data.eventDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Datum</span>
                <span className="font-medium">
                  {format(data.eventDate, "d MMMM yyyy", { locale: nl })}
                </span>
              </div>
            )}
            {data.targetTimeMinutes && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doeltijd</span>
                <span className="font-medium">{formatTargetTime(data.targetTimeMinutes)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Experience Summary */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
              <User className="h-5 w-5 text-accent" />
            </div>
            <h3 className="font-semibold">Jouw niveau</h3>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ervaring</span>
              <span className="font-medium">{experienceLabels[data.experienceLevel!]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Huidige wekelijkse km</span>
              <span className="font-medium">{data.recentWeeklyKm} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Langste recente loop</span>
              <span className="font-medium">{data.longestRecentRun} km</span>
            </div>
          </div>
        </div>

        {/* Availability Summary */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10">
              <Calendar className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="font-semibold">Jouw beschikbaarheid</h3>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trainingsdagen</span>
              <span className="font-medium">{data.daysPerWeek} dagen per week</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trainingstijd</span>
              <span className="font-medium">{data.hoursPerWeek} uur per week</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Voorkeursdagen</span>
              <span className="font-medium text-right">
                {data.preferredDays.map((d) => weekDays[d]).join(", ")}
              </span>
            </div>
          </div>
        </div>

        {/* Plan Overview */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Je trainingsschema</h3>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duur</span>
              <span className="font-medium">{weeksUntilEvent} weken</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Totaal trainingen</span>
              <span className="font-medium">~{weeksUntilEvent * data.daysPerWeek} workouts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start</span>
              <span className="font-medium">
                {format(new Date(), "d MMMM yyyy", { locale: nl })}
              </span>
            </div>
          </div>
        </div>

        {/* AI Notice */}
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            🤖 Je schema wordt gegenereerd door AI op basis van bewezen trainingsprincipes.
            Het is volledig gepersonaliseerd voor jouw niveau en doelen.
          </p>
        </div>
      </div>
    </div>
  );
}

