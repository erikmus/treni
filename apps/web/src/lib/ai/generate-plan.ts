"use server";

import OpenAI from "openai";
import type { GoalType, ExperienceLevel, WorkoutType } from "@/types/database";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratePlanInput {
  goalType: GoalType;
  eventDate: Date | null;
  targetTimeMinutes: number | null;
  experienceLevel: ExperienceLevel;
  recentWeeklyKm: number;
  longestRecentRun: number;
  currentPace: number | null;
  daysPerWeek: number;
  hoursPerWeek: number;
  preferredDays: string[];
  weeksDuration: number;
}

export interface WorkoutSegment {
  type: "warmup" | "interval" | "recovery" | "cooldown" | "steady" | "repeat";
  name: string;
  duration_type: "time" | "distance" | "open";
  duration_value?: number;
  target_type: "pace" | "pace_zone" | "heart_rate_zone" | "open";
  target_pace_low?: number;
  target_pace_high?: number;
  target_zone?: number;
  repeat_count?: number;
  segments?: WorkoutSegment[];
  notes?: string;
}

export interface GeneratedWorkout {
  scheduled_date: string;
  week_number: number;
  day_of_week: number;
  workout_type: WorkoutType;
  title: string;
  description: string;
  target_duration_minutes: number;
  target_distance_km: number;
  target_pace_min_per_km: number | null;
  target_heart_rate_zone: number | null;
  workout_structure: {
    segments: WorkoutSegment[];
    estimated_duration_minutes: number;
    estimated_distance_km: number;
  };
  coach_notes: string | null;
}

export interface GeneratePlanResult {
  success: boolean;
  plan?: {
    phases: {
      name: string;
      weeks: number[];
      focus: string;
    }[];
    weekly_summary: {
      week: number;
      phase: string;
      total_km: number;
      focus: string;
    }[];
  };
  workouts?: GeneratedWorkout[];
  error?: string;
}

const SYSTEM_PROMPT = `Je bent een ervaren hardloopcoach die gepersonaliseerde trainingsschema's maakt. Je genereert gevarieerde, realistische trainingsschema's.

TRAINING PRINCIPES:
1. 80/20 regel: 80% van trainingen op lage intensiteit (zone 1-2), 20% op hogere intensiteit
2. Progressieve opbouw: Maximaal 10% volume stijging per week
3. Periodisering: Base fase → Build fase → Peak fase → Taper (laatste 2-3 weken)
4. Variatie: Mix verschillende workout types door de week
5. Herstel: Minimaal 1 rustdag na intensieve training, elke 3-4e week een herstelweek

WORKOUT TYPES (gebruik deze exact, wissel af per week):
- easy_run: Rustige duurloop, zone 1-2
- long_run: Lange duurloop (1x per week), zone 2
- tempo_run: Tempo training, zone 3-4
- interval: Intervaltraining met herhalingen
- fartlek: Speelse tempowisselingen
- recovery: Herstelloop, zeer rustig
- hill_training: Heuveltraining
- race_pace: Training op wedstrijdtempo

VERPLICHT JSON FORMAT - volg dit EXACT:
{
  "phases": [
    { "name": "Base", "weeks": [1, 2, 3, 4], "focus": "Aerobe basis opbouwen" }
  ],
  "weekly_summary": [
    { "week": 1, "phase": "Base", "total_km": 25, "focus": "Opbouw beginnen" }
  ],
  "workouts": [
    {
      "week_number": 1,
      "day_of_week": 2,
      "workout_type": "easy_run",
      "title": "Rustige duurloop",
      "description": "Houd een tempo aan waarbij je nog kunt praten. Focus op ontspannen lopen.",
      "target_duration_minutes": 40,
      "target_distance_km": 6,
      "target_heart_rate_zone": 2,
      "coach_notes": "Begin rustig en bouw langzaam op.",
      "workout_structure": {
        "estimated_duration_minutes": 40,
        "estimated_distance_km": 6,
        "segments": [
          { "type": "warmup", "name": "Warming-up", "duration_type": "time", "duration_value": 300, "target_type": "pace_zone", "target_zone": 1 },
          { "type": "steady", "name": "Duurloop", "duration_type": "time", "duration_value": 1800, "target_type": "pace_zone", "target_zone": 2 },
          { "type": "cooldown", "name": "Cooling-down", "duration_type": "time", "duration_value": 300, "target_type": "pace_zone", "target_zone": 1 }
        ]
      }
    },
    {
      "week_number": 1,
      "day_of_week": 4,
      "workout_type": "interval",
      "title": "6x 400m intervallen",
      "description": "Snelle intervallen om je snelheid te verbeteren. Herstel volledig tussen herhalingen.",
      "target_duration_minutes": 45,
      "target_distance_km": 7,
      "target_heart_rate_zone": 4,
      "coach_notes": "De laatste 2 herhalingen moeten net zo snel zijn als de eerste.",
      "workout_structure": {
        "estimated_duration_minutes": 45,
        "estimated_distance_km": 7,
        "segments": [
          { "type": "warmup", "name": "Warming-up", "duration_type": "time", "duration_value": 600, "target_type": "pace_zone", "target_zone": 1, "notes": "Inclusief loopscholing" },
          { "type": "repeat", "name": "Intervallen", "repeat_count": 6, "segments": [
            { "type": "interval", "name": "Snel", "duration_type": "distance", "duration_value": 400, "target_type": "pace_zone", "target_zone": 4 },
            { "type": "recovery", "name": "Herstel", "duration_type": "time", "duration_value": 90, "target_type": "open" }
          ]},
          { "type": "cooldown", "name": "Cooling-down", "duration_type": "time", "duration_value": 600, "target_type": "pace_zone", "target_zone": 1 }
        ]
      }
    },
    {
      "week_number": 1,
      "day_of_week": 6,
      "workout_type": "long_run",
      "title": "Lange duurloop 12km",
      "description": "De belangrijkste training van de week. Houd een rustig tempo aan.",
      "target_duration_minutes": 75,
      "target_distance_km": 12,
      "target_heart_rate_zone": 2,
      "coach_notes": "Neem water mee. Begin rustig, eindig sterker.",
      "workout_structure": {
        "estimated_duration_minutes": 75,
        "estimated_distance_km": 12,
        "segments": [
          { "type": "warmup", "name": "Eerste kilometers", "duration_type": "distance", "duration_value": 2000, "target_type": "pace_zone", "target_zone": 1 },
          { "type": "steady", "name": "Hoofddeel", "duration_type": "distance", "duration_value": 8000, "target_type": "pace_zone", "target_zone": 2 },
          { "type": "cooldown", "name": "Laatste kilometers", "duration_type": "distance", "duration_value": 2000, "target_type": "pace_zone", "target_zone": 1 }
        ]
      }
    }
  ]
}

BELANGRIJKE REGELS:
1. Geef ELKE workout een UNIEKE, BESCHRIJVENDE titel (niet "Training")
2. Varieer workout_type: gebruik MINIMAAL 3 verschillende types per week
3. Elke workout MOET een description hebben met uitleg
4. Bouw km en duur progressief op per week
5. Lange duurloop (long_run) altijd op zaterdag of zondag
6. Na interval of tempo training, plan een easy_run of recovery
7. duration_value is in SECONDEN voor time, in METERS voor distance`;

export async function generateTrainingPlan(input: GeneratePlanInput): Promise<GeneratePlanResult> {
  const {
    goalType,
    eventDate,
    targetTimeMinutes,
    experienceLevel,
    recentWeeklyKm,
    longestRecentRun,
    currentPace,
    daysPerWeek,
    hoursPerWeek,
    preferredDays,
    weeksDuration,
  } = input;

  // Calculate target pace from target time
  let targetPacePerKm: number | null = null;
  if (targetTimeMinutes) {
    const distances: Record<GoalType, number> = {
      "5k": 5,
      "10k": 10,
      "15k": 15,
      "half_marathon": 21.0975,
      "marathon": 42.195,
      "fitness": 0,
      "custom": 0,
    };
    const distance = distances[goalType];
    if (distance > 0) {
      targetPacePerKm = (targetTimeMinutes * 60) / distance; // seconds per km
    }
  }

  // Build the user prompt
  const userPrompt = `Maak een ${weeksDuration} weken durend trainingsschema voor een ${experienceLevel} loper met de volgende gegevens:

DOEL: ${goalType === "fitness" ? "Algemene fitness verbeteren" : `${goalType.toUpperCase()} race`}
${eventDate ? `EVENTDATUM: ${eventDate.toISOString().split("T")[0]}` : ""}
${targetTimeMinutes ? `DOELTIJD: ${Math.floor(targetTimeMinutes / 60)}:${(targetTimeMinutes % 60).toString().padStart(2, "0")}` : ""}
${targetPacePerKm ? `DOELTEMPO: ${Math.floor(targetPacePerKm / 60)}:${Math.floor(targetPacePerKm % 60).toString().padStart(2, "0")} /km` : ""}

HUIDIG NIVEAU:
- Ervaring: ${experienceLevel}
- Wekelijkse kilometers: ${recentWeeklyKm} km
- Langste recente loop: ${longestRecentRun} km
${currentPace ? `- Huidig comfortabel tempo: ${Math.floor(currentPace / 60)}:${(currentPace % 60).toString().padStart(2, "0")} /km` : ""}

BESCHIKBAARHEID:
- Trainingsdagen per week: ${daysPerWeek}
- Uren per week: ${hoursPerWeek}
- Voorkeursdagen: ${preferredDays.join(", ")}

STARTDATUM: ${new Date().toISOString().split("T")[0]}

Genereer een volledig schema met alle ${weeksDuration * daysPerWeek} trainingen in het juiste JSON formaat.
Zorg dat elke workout een gedetailleerde workout_structure heeft met segments.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 16000,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return { success: false, error: "Geen response van AI" };
    }

    const planData = JSON.parse(responseText);

    // Validate and transform the response
    if (!planData.phases || !planData.weekly_summary || !planData.workouts) {
      return { success: false, error: "Ongeldig schema formaat van AI" };
    }

    // Post-process workouts to ensure correct format
    const processedWorkouts: GeneratedWorkout[] = planData.workouts.map((workout: Record<string, unknown>, index: number) => {
      // Calculate the scheduled date
      const startDate = new Date();
      const weekNumber = workout.week_number as number || Math.floor(index / daysPerWeek) + 1;
      const dayIndex = (workout.day_of_week as number) || (index % daysPerWeek);
      
      // Find the actual date based on preferred days
      const scheduledDate = calculateWorkoutDate(startDate, weekNumber, dayIndex, preferredDays);

      return {
        scheduled_date: scheduledDate,
        week_number: weekNumber,
        day_of_week: new Date(scheduledDate).getDay(),
        workout_type: workout.workout_type as WorkoutType || "easy_run",
        title: workout.title as string || "Training",
        description: workout.description as string || "",
        target_duration_minutes: workout.target_duration_minutes as number || 30,
        target_distance_km: workout.target_distance_km as number || 5,
        target_pace_min_per_km: workout.target_pace_min_per_km as number | null || null,
        target_heart_rate_zone: workout.target_heart_rate_zone as number | null || null,
        workout_structure: workout.workout_structure as GeneratedWorkout["workout_structure"] || createDefaultStructure(workout),
        coach_notes: workout.coach_notes as string | null || null,
      };
    });

    return {
      success: true,
      plan: {
        phases: planData.phases,
        weekly_summary: planData.weekly_summary,
      },
      workouts: processedWorkouts,
    };
  } catch (error) {
    console.error("AI generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Onbekende fout",
    };
  }
}

function calculateWorkoutDate(
  startDate: Date,
  weekNumber: number,
  dayIndex: number,
  preferredDays: string[]
): string {
  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  // Sort preferred days by day number
  const sortedDays = [...preferredDays].sort((a, b) => dayMap[a] - dayMap[b]);
  const targetDayName = sortedDays[dayIndex % sortedDays.length];
  const targetDayNumber = dayMap[targetDayName];

  // Calculate the date
  const date = new Date(startDate);
  
  // Move to the start of the target week
  const daysToAdd = (weekNumber - 1) * 7;
  date.setDate(date.getDate() + daysToAdd);
  
  // Find the correct day in that week
  const currentDay = date.getDay();
  const daysUntilTarget = (targetDayNumber - currentDay + 7) % 7;
  date.setDate(date.getDate() + daysUntilTarget);

  return date.toISOString().split("T")[0];
}

function createDefaultStructure(workout: Record<string, unknown>): GeneratedWorkout["workout_structure"] {
  const duration = (workout.target_duration_minutes as number) || 30;
  const warmupTime = Math.min(10, Math.floor(duration * 0.15)) * 60;
  const cooldownTime = Math.min(10, Math.floor(duration * 0.15)) * 60;
  const mainTime = (duration * 60) - warmupTime - cooldownTime;

  return {
    segments: [
      {
        type: "warmup",
        name: "Warming-up",
        duration_type: "time",
        duration_value: warmupTime,
        target_type: "pace_zone",
        target_zone: 1,
        notes: "Rustig inlopen",
      },
      {
        type: "steady",
        name: "Hoofdtraining",
        duration_type: "time",
        duration_value: mainTime,
        target_type: "pace_zone",
        target_zone: 2,
      },
      {
        type: "cooldown",
        name: "Cooling-down",
        duration_type: "time",
        duration_value: cooldownTime,
        target_type: "pace_zone",
        target_zone: 1,
        notes: "Rustig uitlopen",
      },
    ],
    estimated_duration_minutes: duration,
    estimated_distance_km: (workout.target_distance_km as number) || 5,
  };
}

