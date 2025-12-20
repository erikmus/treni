"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { ExperienceLevel } from "@/types/database";
import type { PlanWizardData } from "./plan-wizard";

interface ExperienceFormProps {
  experienceLevel: ExperienceLevel | null;
  recentWeeklyKm: number;
  longestRecentRun: number;
  currentPace: number | null;
  onChange: (updates: Partial<PlanWizardData>) => void;
}

const experienceLevels: { level: ExperienceLevel; label: string; description: string; icon: string }[] = [
  {
    level: "beginner",
    label: "Beginner",
    description: "Nieuw met hardlopen of minder dan 6 maanden ervaring",
    icon: "🌱",
  },
  {
    level: "intermediate",
    label: "Gemiddeld",
    description: "6 maanden - 2 jaar ervaring, enkele races gelopen",
    icon: "🏃",
  },
  {
    level: "advanced",
    label: "Gevorderd",
    description: "2+ jaar ervaring, regelmatig wedstrijden, consistent trainingsschema",
    icon: "⚡",
  },
  {
    level: "elite",
    label: "Elite",
    description: "Competitieve atleet met jarenlange ervaring",
    icon: "🏆",
  },
];

export function ExperienceForm({ 
  experienceLevel, 
  recentWeeklyKm, 
  longestRecentRun, 
  currentPace,
  onChange 
}: ExperienceFormProps) {
  const formatPace = (seconds: number | null): string => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const parsePace = (value: string): number | null => {
    if (!value) return null;
    const parts = value.split(":").map(Number);
    if (parts.length !== 2 || parts.some(isNaN)) return null;
    return parts[0] * 60 + parts[1];
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Jouw huidige niveau</h2>
        <p className="text-muted-foreground">
          Dit helpt ons het juiste trainingsschema voor je te maken
        </p>
      </div>

      <div className="space-y-8">
        {/* Experience Level Selection */}
        <div className="space-y-3">
          <Label>Hoe zou je jezelf omschrijven?</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {experienceLevels.map((exp) => (
              <button
                key={exp.level}
                onClick={() => onChange({ experienceLevel: exp.level })}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
                  experienceLevel === exp.level
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="text-2xl">{exp.icon}</span>
                <div>
                  <p className="font-medium">{exp.label}</p>
                  <p className="text-sm text-muted-foreground">{exp.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Weekly Distance */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Hoeveel kilometer loop je gemiddeld per week?</Label>
            <span className="text-sm font-medium">{recentWeeklyKm} km</span>
          </div>
          <Slider
            value={[recentWeeklyKm]}
            onValueChange={([value]) => onChange({ recentWeeklyKm: value })}
            min={0}
            max={100}
            step={5}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 km</span>
            <span>50 km</span>
            <span>100 km</span>
          </div>
        </div>

        {/* Longest Recent Run */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Wat is je langste loop van de afgelopen maand?</Label>
            <span className="text-sm font-medium">{longestRecentRun} km</span>
          </div>
          <Slider
            value={[longestRecentRun]}
            onValueChange={([value]) => onChange({ longestRecentRun: value })}
            min={0}
            max={42}
            step={1}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 km</span>
            <span>21 km</span>
            <span>42 km</span>
          </div>
        </div>

        {/* Current Easy Pace */}
        <div className="space-y-2">
          <Label htmlFor="currentPace">Wat is je comfortabele tempo? (optioneel)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="currentPace"
              placeholder="5:30"
              className="max-w-[120px]"
              value={formatPace(currentPace)}
              onChange={(e) => onChange({ currentPace: parsePace(e.target.value) })}
            />
            <span className="text-sm text-muted-foreground">min/km</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Dit is het tempo waarbij je nog gemakkelijk kunt praten
          </p>
        </div>
      </div>
    </div>
  );
}

