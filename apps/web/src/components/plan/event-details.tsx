"use client";

import { useState } from "react";
import { CalendarIcon, Clock, Gauge } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { GoalType } from "@/types/database";
import type { PlanWizardData } from "./plan-wizard";

type TimeInputMode = "finish_time" | "pace";

interface EventDetailsProps {
  goalType: GoalType;
  eventName: string;
  eventDate: Date | null;
  targetTimeMinutes: number | null;
  onChange: (updates: Partial<PlanWizardData>) => void;
}

// Distance in kilometers for each goal type
const goalDistances: Record<GoalType, number> = {
  "5k": 5,
  "10k": 10,
  "15k": 15,
  "half_marathon": 21.0975,
  "marathon": 42.195,
  "fitness": 0,
  "custom": 0,
};

// Estimated finish times based on goal and experience
const estimatedTimes: Record<GoalType, { fast: number; average: number; slow: number }> = {
  "5k": { fast: 20, average: 28, slow: 35 },
  "10k": { fast: 42, average: 55, slow: 70 },
  "15k": { fast: 65, average: 85, slow: 110 },
  "half_marathon": { fast: 90, average: 120, slow: 150 },
  "marathon": { fast: 180, average: 240, slow: 300 },
  "fitness": { fast: 0, average: 0, slow: 0 },
  "custom": { fast: 0, average: 0, slow: 0 },
};

export function EventDetails({ goalType, eventName, eventDate, targetTimeMinutes, onChange }: EventDetailsProps) {
  const isFitness = goalType === "fitness";
  const times = estimatedTimes[goalType];
  const distance = goalDistances[goalType];

  // Format finish time as h:mm or mm
  const formatTargetTime = (minutes: number | null): string => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}`;
    }
    return `${mins}`;
  };

  // Format pace as m:ss per km
  const formatPace = (minutes: number | null): string => {
    if (!minutes || distance === 0) return "";
    const paceMinutes = minutes / distance;
    const paceMin = Math.floor(paceMinutes);
    const paceSec = Math.round((paceMinutes - paceMin) * 60);
    return `${paceMin}:${paceSec.toString().padStart(2, "0")}`;
  };

  // Parse finish time input (formats: "45", "3:45", "3:45:00")
  const parseTargetTime = (value: string): number | null => {
    if (!value) return null;
    
    const parts = value.split(":").map(Number);
    if (parts.some(isNaN)) return null;
    
    if (parts.length === 1) {
      return parts[0]; // Just minutes
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1]; // hours:minutes
    } else if (parts.length === 3) {
      return parts[0] * 60 + parts[1]; // hours:minutes:seconds (ignore seconds)
    }
    return null;
  };

  // Parse pace input (format: "5:30" = 5 min 30 sec per km)
  const parsePace = (value: string): number | null => {
    if (!value || distance === 0) return null;
    
    const parts = value.split(":").map(Number);
    if (parts.some(isNaN)) return null;
    
    let paceMinutes: number;
    if (parts.length === 1) {
      paceMinutes = parts[0]; // Just minutes
    } else if (parts.length === 2) {
      paceMinutes = parts[0] + parts[1] / 60; // minutes:seconds
    } else {
      return null;
    }
    
    // Convert pace to total finish time
    return Math.round(paceMinutes * distance);
  };

  const [inputMode, setInputMode] = useState<TimeInputMode>("finish_time");
  const [timeInput, setTimeInput] = useState(formatTargetTime(targetTimeMinutes));
  const [paceInput, setPaceInput] = useState(formatPace(targetTimeMinutes));

  const handleModeChange = (mode: TimeInputMode) => {
    setInputMode(mode);
    // Update inputs to reflect current targetTimeMinutes in new format
    if (mode === "finish_time") {
      setTimeInput(formatTargetTime(targetTimeMinutes));
    } else {
      setPaceInput(formatPace(targetTimeMinutes));
    }
  };

  const handleTimeChange = (value: string) => {
    setTimeInput(value);
    const minutes = parseTargetTime(value);
    onChange({ targetTimeMinutes: minutes });
    // Also update pace input for when user switches modes
    setPaceInput(formatPace(minutes));
  };

  const handlePaceChange = (value: string) => {
    setPaceInput(value);
    const minutes = parsePace(value);
    onChange({ targetTimeMinutes: minutes });
    // Also update time input for when user switches modes
    setTimeInput(formatTargetTime(minutes));
  };

  const setQuickTime = (minutes: number) => {
    onChange({ targetTimeMinutes: minutes });
    setTimeInput(formatTargetTime(minutes));
    setPaceInput(formatPace(minutes));
  };

  // Calculate weeks until event
  const weeksUntilEvent = eventDate 
    ? Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 7))
    : null;

  const minWeeks: Record<GoalType, number> = {
    "5k": 6,
    "10k": 8,
    "15k": 10,
    "half_marathon": 12,
    "marathon": 16,
    "fitness": 4,
    "custom": 4,
  };

  const isDateTooSoon = weeksUntilEvent !== null && weeksUntilEvent < minWeeks[goalType];

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">
          {isFitness ? "Je trainingsperiode" : "Vertel ons over je event"}
        </h2>
        <p className="text-muted-foreground">
          {isFitness 
            ? "Kies een startdatum voor je trainingsschema"
            : "We stemmen je schema af op de datum van je wedstrijd"
          }
        </p>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        {/* Event Name */}
        {!isFitness && (
          <div className="space-y-2">
            <Label htmlFor="eventName">Naam van het evenement (optioneel)</Label>
            <Input
              id="eventName"
              placeholder="bijv. Rotterdam Marathon"
              value={eventName}
              onChange={(e) => onChange({ eventName: e.target.value })}
            />
          </div>
        )}

        {/* Event Date */}
        <div className="space-y-2">
          <Label>{isFitness ? "Startdatum" : "Datum van het evenement"}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !eventDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {eventDate ? format(eventDate, "PPP", { locale: nl }) : "Selecteer een datum"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={eventDate || undefined}
                onSelect={(date) => onChange({ eventDate: date || null })}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {weeksUntilEvent !== null && (
            <p className={cn(
              "text-sm",
              isDateTooSoon ? "text-destructive" : "text-muted-foreground"
            )}>
              {isDateTooSoon 
                ? `⚠️ Dit is te weinig tijd. Minimaal ${minWeeks[goalType]} weken aanbevolen.`
                : `📅 Nog ${weeksUntilEvent} weken tot je event`
              }
            </p>
          )}
        </div>

        {/* Target Time */}
        {!isFitness && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Doeltijd (optioneel)</Label>
              <ToggleGroup 
                type="single" 
                value={inputMode} 
                onValueChange={(value) => value && handleModeChange(value as TimeInputMode)}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="finish_time" aria-label="Eindtijd">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Eindtijd
                </ToggleGroupItem>
                <ToggleGroupItem value="pace" aria-label="Tempo">
                  <Gauge className="h-3.5 w-3.5 mr-1.5" />
                  Tempo/km
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {inputMode === "finish_time" ? (
              <div className="space-y-2">
                <Input
                  id="targetTime"
                  placeholder={goalType === "marathon" || goalType === "half_marathon" ? "bijv. 3:45" : "bijv. 55"}
                  value={timeInput}
                  onChange={(e) => handleTimeChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Formaat: {goalType === "5k" || goalType === "10k" ? "minuten (bijv. 55)" : "uren:minuten (bijv. 3:45)"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  id="targetPace"
                  placeholder="bijv. 5:30"
                  value={paceInput}
                  onChange={(e) => handlePaceChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Formaat: min:sec per kilometer (bijv. 5:30 = 5 min 30 sec/km)
                </p>
              </div>
            )}

            {/* Show conversion hint */}
            {targetTimeMinutes && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                {inputMode === "finish_time" 
                  ? `= ${formatPace(targetTimeMinutes)} per km tempo`
                  : `= ${formatTargetTime(targetTimeMinutes)} eindtijd`
                }
              </p>
            )}
            
            {/* Quick select times */}
            {times.fast > 0 && (
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickTime(times.fast)}
                  className="flex-1 flex-col h-auto py-2"
                >
                  <span className="font-medium">Snel</span>
                  <span className="text-xs text-muted-foreground">
                    {inputMode === "finish_time" 
                      ? formatTargetTime(times.fast)
                      : `${formatPace(times.fast)}/km`
                    }
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickTime(times.average)}
                  className="flex-1 flex-col h-auto py-2"
                >
                  <span className="font-medium">Gemiddeld</span>
                  <span className="text-xs text-muted-foreground">
                    {inputMode === "finish_time" 
                      ? formatTargetTime(times.average)
                      : `${formatPace(times.average)}/km`
                    }
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickTime(times.slow)}
                  className="flex-1 flex-col h-auto py-2"
                >
                  <span className="font-medium">Ontspannen</span>
                  <span className="text-xs text-muted-foreground">
                    {inputMode === "finish_time" 
                      ? formatTargetTime(times.slow)
                      : `${formatPace(times.slow)}/km`
                    }
                  </span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

