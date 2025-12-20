import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LandingHeader, Footer } from "@/components/landing";
import { Button } from "@/components/ui/button";

export async function generateMetadata() {
  const t = await getTranslations("about");
  return {
    title: `${t("title")} - Treni`,
    description: t("intro"),
  };
}

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <main className="min-h-screen">
      <LandingHeader />
      
      {/* Hero section with gradient background */}
      <div className="pt-24 pb-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 hero-pattern" />
        <div className="absolute top-40 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-60 -right-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t("badge")}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              {t("title")}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("intro")}
            </p>
          </div>

          {/* Founder section */}
          <div className="mb-16">
            <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden">
              <div className="p-8 sm:p-10">
                <div className="flex items-start gap-6 mb-8">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                      EM
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-card" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{t("founder.name")}</h2>
                    <p className="text-muted-foreground">{t("founder.role")}</p>
                  </div>
                </div>
                
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-lg leading-relaxed">
                    {t("founder.story1")}
                  </p>
                  <p className="text-lg leading-relaxed">
                    {t("founder.story2")}
                  </p>
                  <p className="text-lg leading-relaxed">
                    {t("founder.story3")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Name origin section */}
          <div className="mb-16">
            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10 rounded-2xl border border-border/50 p-8 sm:p-10 relative overflow-hidden">
              {/* Subtle Kenya flag inspired accent */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <div className="w-full h-1/3 bg-black rounded-tr-2xl" />
                <div className="w-full h-1/3 bg-red-600" />
                <div className="w-full h-1/3 bg-green-600" />
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg text-2xl">
                  🇰🇪
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t("nameOrigin.title")}</h3>
                  <p className="text-muted-foreground text-sm">Kenya → Swahili → Treni</p>
                </div>
              </div>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>{t("nameOrigin.story1")}</p>
                <p>{t("nameOrigin.story2")}</p>
                <p>{t("nameOrigin.story3")}</p>
                <p className="font-medium text-foreground">{t("nameOrigin.story4")}</p>
              </div>
            </div>
          </div>

          {/* Built with Cursor section */}
          <div className="mb-16">
            <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl border border-border/50 p-8 sm:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t("cursor.title")}</h3>
                  <p className="text-muted-foreground text-sm">{t("cursor.subtitle")}</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {t("cursor.description")}
              </p>
            </div>
          </div>

          {/* Mission section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center">{t("mission.title")}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="bg-card rounded-xl border border-border/50 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">{t("mission.accessible.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("mission.accessible.description")}</p>
              </div>
              
              <div className="bg-card rounded-xl border border-border/50 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">{t("mission.community.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("mission.community.description")}</p>
              </div>
              
              <div className="bg-card rounded-xl border border-border/50 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">{t("mission.improvement.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("mission.improvement.description")}</p>
              </div>
            </div>
          </div>

          {/* CTA section */}
          <div className="text-center bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-8 sm:p-10 border border-border/50">
            <h2 className="text-2xl font-bold mb-4">{t("cta.title")}</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              {t("cta.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link href="/signup">{t("cta.getStarted")}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="mailto:erik@treni.app">{t("cta.contact")}</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

