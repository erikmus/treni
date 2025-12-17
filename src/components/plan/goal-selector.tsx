"use client";

import { cn } from "@/lib/utils";
import type { GoalType } from "@/types/database";

interface GoalSelectorProps {
  value: GoalType | null;
  onChange: (goal: GoalType) => void;
}

const goals: { type: GoalType; label: string; distance: string; icon: string; description: string; color: string }[] = [
  {
    type: "5k",
    label: "5 Kilometer",
    distance: "5K",
    icon: "🏃",
    description: "Perfect voor beginners of een snelle race",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    type: "10k",
    label: "10 Kilometer",
    distance: "10K",
    icon: "🏃‍♂️",
    description: "De populairste afstand voor recreatieve lopers",
    color: "from-blue-500 to-blue-600",
  },
  {
    type: "15k",
    label: "15 Kilometer",
    distance: "15K",
    icon: "🏃‍♀️",
    description: "Een goede tussenstap naar de halve marathon",
    color: "from-violet-500 to-violet-600",
  },
  {
    type: "half_marathon",
    label: "Halve Marathon",
    distance: "21.1K",
    icon: "🎯",
    description: "Een serieuze uitdaging voor de meeste lopers",
    color: "from-orange-500 to-orange-600",
  },
  {
    type: "marathon",
    label: "Marathon",
    distance: "42.2K",
    icon: "🏅",
    description: "De ultieme test van uithoudingsvermogen",
    color: "from-rose-500 to-rose-600",
  },
  {
    type: "fitness",
    label: "Fit Blijven",
    distance: "∞",
    icon: "💪",
    description: "Train zonder specifiek racedoel",
    color: "from-teal-500 to-teal-600",
  },
];

export function GoalSelector({ value, onChange }: GoalSelectorProps) {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Wat is je doel?</h2>
        <p className="text-muted-foreground">
          Kies de afstand waarvoor je wilt trainen
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <button
            key={goal.type}
            onClick={() => onChange(goal.type)}
            className={cn(
              "relative group text-left p-5 rounded-xl border-2 transition-all duration-200",
              "hover:shadow-lg hover:scale-[1.02]",
              value === goal.type
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/50"
            )}
          >
            {/* Selection indicator */}
            {value === goal.type && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Distance badge */}
            <div className={cn(
              "inline-flex items-center justify-center px-3 py-1.5 rounded-full text-white font-bold text-sm mb-3",
              `bg-gradient-to-r ${goal.color}`
            )}>
              {goal.distance}
            </div>

            {/* Icon and label */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{goal.icon}</span>
              <h3 className="font-semibold">{goal.label}</h3>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground">
              {goal.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

