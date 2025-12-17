"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoalSelector } from "./goal-selector";
import { EventDetails } from "./event-details";
import { ExperienceForm } from "./experience-form";
import { AvailabilityForm } from "./availability-form";
import { PlanReview } from "./plan-review";
import { generatePlanFromTemplates } from "@/lib/training/generate-plan-from-templates";
import { createClient } from "@/lib/supabase/client";
import type { GoalType, ExperienceLevel, TablesInsert, Json } from "@/types/database";

export interface PlanWizardData {
  // Step 1: Goal
  goalType: GoalType | null;
  
  // Step 2: Event Details
  eventName: string;
  eventDate: Date | null;
  targetTimeMinutes: number | null;
  
  // Step 3: Experience
  experienceLevel: ExperienceLevel | null;
  recentWeeklyKm: number;
  longestRecentRun: number;
  currentPace: number | null; // seconds per km
  
  // Step 4: Availability
  daysPerWeek: number;
  hoursPerWeek: number;
  preferredDays: string[];
}

const initialData: PlanWizardData = {
  goalType: null,
  eventName: "",
  eventDate: null,
  targetTimeMinutes: null,
  experienceLevel: null,
  recentWeeklyKm: 20,
  longestRecentRun: 10,
  currentPace: null,
  daysPerWeek: 4,
  hoursPerWeek: 5,
  preferredDays: ["tuesday", "thursday", "saturday", "sunday"],
};

const STEPS = [
  { id: 1, name: "Doel", description: "Kies je trainingsdoel" },
  { id: 2, name: "Event", description: "Wanneer is je wedstrijd?" },
  { id: 3, name: "Niveau", description: "Jouw huidige niveau" },
  { id: 4, name: "Beschikbaarheid", description: "Wanneer kun je trainen?" },
  { id: 5, name: "Overzicht", description: "Bevestig en start" },
];

export function PlanWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<PlanWizardData>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateData = (updates: Partial<PlanWizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return data.goalType !== null;
      case 2:
        if (data.goalType === "fitness") return true;
        return data.eventDate !== null;
      case 3:
        return data.experienceLevel !== null;
      case 4:
        return data.daysPerWeek >= 3 && data.preferredDays.length >= data.daysPerWeek;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Je moet ingelogd zijn");
        return;
      }

      // Calculate weeks until event
      let weeksDuration = 12; // Default for fitness
      if (data.eventDate) {
        const today = new Date();
        const diffTime = data.eventDate.getTime() - today.getTime();
        weeksDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      }

      // Generate plan from templates (no AI needed)
      const planResult = await generatePlanFromTemplates({
        goalType: data.goalType!,
        eventDate: data.eventDate,
        targetTimeMinutes: data.targetTimeMinutes,
        experienceLevel: data.experienceLevel!,
        recentWeeklyKm: data.recentWeeklyKm,
        longestRecentRun: data.longestRecentRun,
        currentPace: data.currentPace,
        daysPerWeek: data.daysPerWeek,
        hoursPerWeek: data.hoursPerWeek,
        preferredDays: data.preferredDays,
        weeksDuration,
      });

      if (!planResult.success || !planResult.workouts) {
        toast.error(planResult.error || "Kon geen schema genereren");
        return;
      }

      // Calculate start and end dates
      const startDate = new Date();
      const endDate = data.eventDate || new Date(startDate.getTime() + weeksDuration * 7 * 24 * 60 * 60 * 1000);

      // Create training plan in database
      const { data: plan, error: planError } = await supabase
        .from("training_plans")
        .insert({
          user_id: user.id,
          name: data.eventName || getDefaultPlanName(data.goalType!),
          description: `${weeksDuration} weken schema naar ${getGoalLabel(data.goalType!)}`,
          goal_type: data.goalType!,
          goal_event_name: data.eventName || null,
          goal_event_date: data.eventDate?.toISOString().split("T")[0] || null,
          target_time_minutes: data.targetTimeMinutes,
          status: "active",
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          weeks_duration: weeksDuration,
          plan_data: planResult.plan,
        })
        .select()
        .single();

      if (planError) {
        console.error("Plan creation error:", planError);
        toast.error("Kon schema niet opslaan");
        return;
      }

      // Create individual workouts
      const workouts: TablesInsert<'workouts'>[] = planResult.workouts.map((workout) => ({
        plan_id: plan.id,
        user_id: user.id,
        scheduled_date: workout.scheduled_date,
        week_number: workout.week_number,
        day_of_week: workout.day_of_week,
        workout_type: workout.workout_type,
        title: workout.title,
        description: workout.description,
        target_duration_minutes: workout.target_duration_minutes,
        target_distance_km: workout.target_distance_km,
        target_pace_min_per_km: workout.target_pace_min_per_km,
        target_heart_rate_zone: workout.target_heart_rate_zone,
        workout_structure: workout.workout_structure as Json,
        coach_notes: workout.coach_notes,
        status: "scheduled",
      }));

      const { error: workoutsError } = await supabase
        .from("workouts")
        .insert(workouts);

      if (workoutsError) {
        console.error("Workouts creation error:", workoutsError);
        toast.error("Kon trainingen niet opslaan");
        return;
      }

      toast.success("Trainingsschema aangemaakt! 🎉");
      router.push(`/dashboard/plan/${plan.id}`);
      router.refresh();
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Er is iets misgegaan");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <li key={step.id} className="relative flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium
                    ${currentStep > step.id 
                      ? "border-primary bg-primary text-primary-foreground" 
                      : currentStep === step.id 
                        ? "border-primary text-primary" 
                        : "border-muted text-muted-foreground"
                    }
                  `}
                >
                  {currentStep > step.id ? "✓" : step.id}
                </div>
                <div className="mt-2 text-center">
                  <span className={`text-xs font-medium ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.name}
                  </span>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div 
                  className={`absolute top-5 left-1/2 w-full h-0.5 ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`}
                  style={{ transform: "translateX(50%)" }}
                />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Step Content */}
      <div className="bg-card rounded-xl border p-6 md:p-8">
        {currentStep === 1 && (
          <GoalSelector
            value={data.goalType}
            onChange={(goalType) => updateData({ goalType })}
          />
        )}
        {currentStep === 2 && (
          <EventDetails
            goalType={data.goalType!}
            eventName={data.eventName}
            eventDate={data.eventDate}
            targetTimeMinutes={data.targetTimeMinutes}
            onChange={updateData}
          />
        )}
        {currentStep === 3 && (
          <ExperienceForm
            experienceLevel={data.experienceLevel}
            recentWeeklyKm={data.recentWeeklyKm}
            longestRecentRun={data.longestRecentRun}
            currentPace={data.currentPace}
            onChange={updateData}
          />
        )}
        {currentStep === 4 && (
          <AvailabilityForm
            daysPerWeek={data.daysPerWeek}
            hoursPerWeek={data.hoursPerWeek}
            preferredDays={data.preferredDays}
            onChange={updateData}
          />
        )}
        {currentStep === 5 && (
          <PlanReview data={data} />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isGenerating}
          >
            Vorige
          </Button>
          
          {currentStep < 5 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Volgende
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="min-w-[160px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Genereren...
                </>
              ) : (
                "Schema genereren"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function getDefaultPlanName(goalType: GoalType): string {
  const names: Record<GoalType, string> = {
    "5k": "5 kilometer training",
    "10k": "10 kilometer training",
    "15k": "15 kilometer training",
    "half_marathon": "Halve marathon training",
    "marathon": "Marathon training",
    "fitness": "Fit blijven",
    "custom": "Aangepast schema",
  };
  return names[goalType];
}

function getGoalLabel(goalType: GoalType): string {
  const labels: Record<GoalType, string> = {
    "5k": "5 km",
    "10k": "10 km",
    "15k": "15 km",
    "half_marathon": "halve marathon",
    "marathon": "marathon",
    "fitness": "algemene fitness",
    "custom": "aangepast doel",
  };
  return labels[goalType];
}

