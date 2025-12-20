"use client";

import { useTranslations } from "next-intl";
import { UserPlus, Sparkles, Activity, Trophy } from "lucide-react";

const steps = [
  { icon: UserPlus, key: "step1", color: "text-primary", bg: "bg-primary/10" },
  { icon: Sparkles, key: "step2", color: "text-accent", bg: "bg-accent/10" },
  { icon: Activity, key: "step3", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { icon: Trophy, key: "step4", color: "text-amber-500", bg: "bg-amber-500/10" },
];

export function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");

  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {t("title")}
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-amber-500 -translate-y-1/2" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.key} className="relative">
                  {/* Step card */}
                  <div className="relative bg-card rounded-2xl border border-border/50 p-6 text-center hover:shadow-lg transition-shadow">
                    {/* Step number */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>

                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${step.bg} mb-4 mt-2`}>
                      <Icon className={`w-8 h-8 ${step.color}`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold mb-2">
                      {t(`${step.key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`${step.key}.description`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

