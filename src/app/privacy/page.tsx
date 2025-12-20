import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { LandingHeader, Footer } from "@/components/landing";

export async function generateMetadata() {
  const t = await getTranslations("privacy");
  return {
    title: `${t("title")} - Treni`,
    description: t("intro"),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const locale = await getLocale();
  
  const dateLocale = locale === "nl" ? "nl-NL" : "en-US";

  return (
    <main className="min-h-screen">
      <LandingHeader />
      
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              {t("title")}
            </h1>
            <p className="text-muted-foreground">
              {t.rich("common.lastUpdated", { fallback: "" }) || ""} {new Date().toLocaleDateString(dateLocale, { 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="lead text-lg text-muted-foreground">
              {t("intro")}
            </p>

            <h2>{t("section1.title")}</h2>
            
            <h3>{t("section1.accountData")}</h3>
            <p>{t("section1.accountDataIntro")}</p>
            <ul>
              {(t.raw("section1.accountDataItems") as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <h3>{t("section1.trainingData")}</h3>
            <p>{t("section1.trainingDataIntro")}</p>
            <ul>
              {(t.raw("section1.trainingDataItems") as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <h3>{t("section1.thirdParty")}</h3>
            <p>{t("section1.thirdPartyIntro")}</p>
            <ul>
              <li>
                <strong>Garmin Connect:</strong> {t("section1.garminData")}
              </li>
              <li>
                <strong>Google Account:</strong> {t("section1.googleData")}
              </li>
            </ul>

            <h2>{t("section2.title")}</h2>
            <p>{t("section2.intro")}</p>
            <ul>
              <li>
                <strong>{t("section2.service")}</strong> {t("section2.serviceDesc")}
              </li>
              <li>
                <strong>{t("section2.personalization")}</strong> {t("section2.personalizationDesc")}
              </li>
              <li>
                <strong>{t("section2.progress")}</strong> {t("section2.progressDesc")}
              </li>
              <li>
                <strong>{t("section2.communication")}</strong> {t("section2.communicationDesc")}
              </li>
              <li>
                <strong>{t("section2.improvement")}</strong> {t("section2.improvementDesc")}
              </li>
            </ul>

            <h2>{t("section3.title")}</h2>
            <p>{t("section3.intro")}</p>
            <ul>
              {(t.raw("section3.items") as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <h2>{t("section4.title")}</h2>
            <p>{t("section4.intro")}</p>
            <ul>
              <li>
                <strong>{t("section4.providers")}</strong> {t("section4.providersDesc")}
              </li>
              <li>
                <strong>{t("section4.partners")}</strong> {t("section4.partnersDesc")}
              </li>
              <li>
                <strong>{t("section4.legal")}</strong> {t("section4.legalDesc")}
              </li>
            </ul>

            <h2>{t("section5.title")}</h2>
            <p>{t("section5.intro")}</p>
            <ul>
              <li>
                <strong>{t("section5.access")}</strong> {t("section5.accessDesc")}
              </li>
              <li>
                <strong>{t("section5.correction")}</strong> {t("section5.correctionDesc")}
              </li>
              <li>
                <strong>{t("section5.deletion")}</strong> {t("section5.deletionDesc")}
              </li>
              <li>
                <strong>{t("section5.portability")}</strong> {t("section5.portabilityDesc")}
              </li>
              <li>
                <strong>{t("section5.objection")}</strong> {t("section5.objectionDesc")}
              </li>
            </ul>
            <p>{t("section5.exerciseRights")}</p>

            <h2>{t("section6.title")}</h2>
            <p>{t("section6.intro")}</p>
            <ul>
              {(t.raw("section6.items") as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p>{t("section6.noTracking")}</p>

            <h2>{t("section7.title")}</h2>
            <p>{t("section7.content")}</p>

            <h2>{t("section8.title")}</h2>
            <p>{t("section8.content")}</p>

            <h2>{t("section9.title")}</h2>
            <p>{t("section9.intro")}</p>
            <ul>
              <li>
                <strong>{t("section9.email")}</strong>{" "}
                <a href="mailto:privacy@treni.app" className="text-primary hover:underline">
                  privacy@treni.app
                </a>
              </li>
            </ul>

            <div className="mt-12 pt-8 border-t">
              <p className="text-sm text-muted-foreground">
                {t("footer.agreement")}{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  {t("footer.termsLink")}
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
