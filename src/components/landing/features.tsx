"use client";

import { useTranslations } from "next-intl";
import { Brain, RefreshCcw, Watch, Target, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: Brain,
    key: "ai",
    gradient: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: RefreshCcw,
    key: "adaptive",
    gradient: "from-accent/20 to-accent/5",
    iconColor: "text-accent",
  },
  {
    icon: Watch,
    key: "garmin",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-500",
  },
  {
    icon: Target,
    key: "goals",
    gradient: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-500",
  },
];

export function FeaturesSection() {
  const t = useTranslations("landing.features");

  return (
    <section id="features" className="py-24 bg-muted/30">
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

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="group relative bg-card rounded-2xl border border-border/50 p-6 lg:p-8 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-2">
                    {t(`${feature.key}.title`)}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(`${feature.key}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional highlight features */}
        <div className="grid sm:grid-cols-3 gap-6 mt-12">
          {[
            { icon: Zap, title: "Snelle resultaten", desc: "Gemiddeld 15% sneller in 12 weken" },
            { icon: Shield, title: "Blessurepreventie", desc: "Slim opbouwende belasting" },
            { icon: Brain, title: "Slim plannen", desc: "Past zich aan je agenda aan" },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/30"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

