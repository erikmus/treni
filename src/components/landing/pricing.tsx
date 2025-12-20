"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const featureKeys = [
  "unlimitedPlans",
  "aiPlans",
  "sync",
  "stats",
  "fitExport",
  "import",
] as const;

export function PricingSection() {
  const t = useTranslations("landing.pricing");

  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {t("badge")}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Single Free Card */}
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
            {/* Price */}
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold">{t("free")}</span>
              </div>
              <p className="text-muted-foreground mt-2">
                {t("allFeaturesIncluded")}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {featureKeys.map((featureKey, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t(`features.${featureKey}.title`)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t(`features.${featureKey}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button
              asChild
              size="lg"
              className="w-full text-lg py-6"
            >
              <Link href="/signup">
                {t("getStarted")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
