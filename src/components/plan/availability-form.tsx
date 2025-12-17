"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { PlanWizardData } from "./plan-wizard";

interface AvailabilityFormProps {
  daysPerWeek: number;
  hoursPerWeek: number;
  preferredDays: string[];
  onChange: (updates: Partial<PlanWizardData>) => void;
}

const weekDays = [
  { key: "monday", label: "Ma", fullLabel: "Maandag" },
  { key: "tuesday", label: "Di", fullLabel: "Dinsdag" },
  { key: "wednesday", label: "Wo", fullLabel: "Woensdag" },
  { key: "thursday", label: "Do", fullLabel: "Donderdag" },
  { key: "friday", label: "Vr", fullLabel: "Vrijdag" },
  { key: "saturday", label: "Za", fullLabel: "Zaterdag" },
  { key: "sunday", label: "Zo", fullLabel: "Zondag" },
];

export function AvailabilityForm({
  daysPerWeek,
  hoursPerWeek,
  preferredDays,
  onChange,
}: AvailabilityFormProps) {
  const toggleDay = (day: string) => {
    const newDays = preferredDays.includes(day)
      ? preferredDays.filter((d) => d !== day)
      : [...preferredDays, day];
    onChange({ preferredDays: newDays });
  };

  const selectedCount = preferredDays.length;
  const needMoreDays = selectedCount < daysPerWeek;

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Jouw beschikbaarheid</h2>
        <p className="text-muted-foreground">
          We passen het schema aan op de momenten dat jij kunt trainen
        </p>
      </div>

      <div className="space-y-8 max-w-lg mx-auto">
        {/* Days per week */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Hoeveel dagen per week kun je trainen?</Label>
            <span className="text-sm font-medium">{daysPerWeek} dagen</span>
          </div>
          <Slider
            value={[daysPerWeek]}
            onValueChange={([value]) => onChange({ daysPerWeek: value })}
            min={3}
            max={7}
            step={1}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>3 dagen</span>
            <span>5 dagen</span>
            <span>7 dagen</span>
          </div>
        </div>

        {/* Hours per week */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Hoeveel uur per week kun je besteden aan hardlopen?</Label>
            <span className="text-sm font-medium">{hoursPerWeek} uur</span>
          </div>
          <Slider
            value={[hoursPerWeek]}
            onValueChange={([value]) => onChange({ hoursPerWeek: value })}
            min={2}
            max={15}
            step={1}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>2 uur</span>
            <span>8 uur</span>
            <span>15 uur</span>
          </div>
        </div>

        {/* Preferred days */}
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <Label>Op welke dagen train je het liefst?</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Selecteer minimaal {daysPerWeek} dagen
              </p>
            </div>
            <span className={cn(
              "text-sm font-medium",
              needMoreDays ? "text-destructive" : "text-muted-foreground"
            )}>
              {selectedCount}/{daysPerWeek} geselecteerd
            </span>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const isSelected = preferredDays.includes(day.key);
              return (
                <button
                  key={day.key}
                  onClick={() => toggleDay(day.key)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-xs text-muted-foreground">{day.label}</span>
                  <span className="text-lg mt-1">
                    {isSelected ? "✓" : "○"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Show selected days as text */}
          {preferredDays.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Geselecteerd:{" "}
              {preferredDays
                .map((day) => weekDays.find((d) => d.key === day)?.fullLabel)
                .join(", ")}
            </p>
          )}
        </div>

        {/* Tips based on selection */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong>{" "}
            {daysPerWeek <= 3 
              ? "Met 3 trainingsdagen kun je nog steeds geweldige resultaten behalen!"
              : daysPerWeek >= 6
                ? "Zorg voor voldoende herstel tussen intensieve trainingen."
                : "Een goede mix van trainingsdagen met rust ertussen."}
          </p>
        </div>
      </div>
    </div>
  );
}

