"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-pattern">
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {t("badge")}
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            {t("title").split(" ").map((word, i) => (
              <span key={i} className={i === 2 ? "text-primary" : ""}>
                {word}{" "}
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "200ms" }}>
            {t("subtitle")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto text-lg px-8 py-6 bg-primary hover:bg-primary/90 animate-pulse-glow"
            >
              <Link href="/signup">
                {t("cta")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto text-lg px-8 py-6 group"
            >
              <Link href="#how-it-works">
                <Play className="mr-2 h-5 w-5 group-hover:text-primary transition-colors" />
                {t("ctaSecondary")}
              </Link>
            </Button>
          </div>

          {/* 2026 Goals */}
          <div className="mt-16 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">{t("stats.goalsTitle")}</p>
            <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">1000+</div>
                <div className="text-sm text-muted-foreground mt-1">{t("stats.activeRunners")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">2000+</div>
                <div className="text-sm text-muted-foreground mt-1">{t("stats.completedPlans")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground mt-1">{t("stats.satisfaction")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image/Preview */}
        <div className="mt-16 relative animate-fade-in" style={{ animationDelay: "500ms" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="relative mx-auto max-w-5xl">
            <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card">
              {/* Mock dashboard preview */}
              <div className="aspect-[16/9] bg-gradient-to-br from-muted/50 to-muted p-6">
                <div className="h-full rounded-xl bg-card/80 backdrop-blur border border-border/50 p-4 flex flex-col">
                  {/* Header bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20" />
                      <div className="h-4 w-24 bg-muted rounded" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-20 bg-muted rounded-md" />
                      <div className="h-8 w-8 bg-primary/20 rounded-md" />
                    </div>
                  </div>
                  
                  {/* Content grid */}
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    {/* Calendar */}
                    <div className="col-span-2 rounded-lg bg-muted/50 p-4">
                      <div className="h-4 w-32 bg-muted rounded mb-4" />
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 28 }).map((_, i) => (
                          <div
                            key={i}
                            className={`aspect-square rounded-md ${
                              [2, 4, 6, 9, 11, 13, 16, 18, 20, 23, 25, 27].includes(i)
                                ? "bg-primary/30"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Stats sidebar */}
                    <div className="space-y-4">
                      <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                        <div className="h-3 w-16 bg-primary/30 rounded mb-2" />
                        <div className="h-6 w-20 bg-primary/40 rounded" />
                      </div>
                      <div className="rounded-lg bg-accent/10 p-4 border border-accent/20">
                        <div className="h-3 w-20 bg-accent/30 rounded mb-2" />
                        <div className="h-6 w-16 bg-accent/40 rounded" />
                      </div>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="h-3 w-14 bg-muted rounded mb-2" />
                        <div className="h-6 w-24 bg-muted rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

