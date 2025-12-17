"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingSection() {
  const t = useTranslations("landing.pricing");

  const plans = [
    {
      key: "free",
      featured: false,
      features: [
        "1 actief trainingsschema",
        "Basis trainingen",
        "Handmatige activiteiten loggen",
        "Community toegang",
      ],
    },
    {
      key: "pro",
      featured: true,
      features: [
        "Onbeperkte schema's",
        "Garmin sync",
        "AI-aanpassingen",
        "Gedetailleerde statistieken",
        "Prioriteit support",
        ".FIT bestand export",
        "Geavanceerde analyses",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-24">
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

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border p-8 ${
                plan.featured
                  ? "border-primary bg-card shadow-xl shadow-primary/10"
                  : "border-border/50 bg-card/50"
              }`}
            >
              {/* Featured badge */}
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  Populair
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-xl font-semibold mb-2">
                {t(`${plan.key}.name`)}
              </h3>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">
                  {t(`${plan.key}.price`)}
                </span>
                <span className="text-muted-foreground">
                  /{t(`${plan.key}.period`)}
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.featured ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                asChild
                className={`w-full ${
                  plan.featured
                    ? "bg-primary hover:bg-primary/90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                <Link href="/signup">
                  {plan.featured ? "Start Pro" : "Gratis beginnen"}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Money back guarantee */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          14 dagen geld-terug-garantie • Geen creditcard nodig voor gratis plan
        </p>
      </div>
    </section>
  );
}

