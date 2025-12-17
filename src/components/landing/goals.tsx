"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const goals = [
  { key: "5k", distance: "5K", time: "~30 min", weeks: "8 weken", color: "from-emerald-500 to-emerald-600" },
  { key: "10k", distance: "10K", time: "~60 min", weeks: "10 weken", color: "from-blue-500 to-blue-600" },
  { key: "15k", distance: "15K", time: "~90 min", weeks: "12 weken", color: "from-violet-500 to-violet-600" },
  { key: "halfMarathon", distance: "21.1K", time: "~2 uur", weeks: "14 weken", color: "from-primary to-orange-600" },
  { key: "marathon", distance: "42.2K", time: "~4 uur", weeks: "18 weken", color: "from-rose-500 to-rose-600" },
  { key: "fitness", distance: "∞", time: "Flexibel", weeks: "Doorlopend", color: "from-accent to-teal-600" },
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
                <p>Typische tijd: {goal.time}</p>
                <p>Schema: {goal.weeks}</p>
              </div>

              {/* Arrow */}
              <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                <span>Start nu</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

