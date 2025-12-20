"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const goals = [
  { key: "5k", distance: "5K", timeMin: 30, weeksCount: 8, color: "from-emerald-500 to-emerald-600" },
  { key: "10k", distance: "10K", timeMin: 60, weeksCount: 10, color: "from-blue-500 to-blue-600" },
  { key: "15k", distance: "15K", timeMin: 90, weeksCount: 12, color: "from-violet-500 to-violet-600" },
  { key: "halfMarathon", distance: "21.1K", hoursCount: 2, weeksCount: 14, color: "from-primary to-orange-600" },
  { key: "marathon", distance: "42.2K", hoursCount: 4, weeksCount: 18, color: "from-rose-500 to-rose-600" },
  { key: "fitness", distance: "∞", flexible: true, ongoing: true, color: "from-accent to-teal-600" },
];

export function GoalsSection() {
  const t = useTranslations("landing.goals");

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Goals Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal, index) => (
            <Link
              key={goal.key}
              href={`/signup?goal=${goal.key}`}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${goal.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              {/* Distance badge */}
              <div className={`inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r ${goal.color} text-white font-bold text-lg mb-4`}>
                {goal.distance}
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-2">
                {t(goal.key)}
              </h3>
              
              <div className="space-y-1 text-sm text-muted-foreground mb-4">
                <p>{t("typicalTime", { 
                  time: goal.flexible 
                    ? t("flexible") 
                    : goal.hoursCount 
                      ? `~${goal.hoursCount} ${goal.hoursCount === 1 ? 'hour' : 'hours'}`
                      : `~${goal.timeMin} min`
                })}</p>
                <p>{t("schedule", { 
                  weeks: goal.ongoing 
                    ? t("ongoing") 
                    : t("weeks", { count: goal.weeksCount ?? 0 })
                })}</p>
              </div>

              {/* Arrow */}
              <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                <span>{t("startNow")}</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

