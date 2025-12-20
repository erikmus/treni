import { Check, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function BillingPage() {
  const t = await getTranslations("settings.billing");
  const tCommon = await getTranslations("common");

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("subtitle")}
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-card border rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{t("freePlan")}</h3>
              <Badge variant="secondary">{tCommon("current")}</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {t("freePlanDesc")}
            </p>
          </div>
          <p className="text-2xl font-bold">€0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">{t("included")}</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-emerald-500" />
              {t("freeFeatures.plan")}
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-emerald-500" />
              {t("freeFeatures.stats")}
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-emerald-500" />
              {t("freeFeatures.import")}
            </li>
          </ul>
        </div>
      </div>

      {/* Pro Plan */}
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{t("proPlan")}</h3>
              <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                {tCommon("recommended")}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {t("proPlanDesc")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{t("proPrice")}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <p className="text-xs text-muted-foreground">{t("proYearlyPrice")}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-primary/10">
          <p className="text-sm text-muted-foreground mb-2">{t("allFromFree")}</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              {t("proFeatures.unlimitedPlans")}
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              {t("proFeatures.aiPlans")}
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              {t("proFeatures.advancedStats")}
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              {t("proFeatures.integrations")}
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              {t("proFeatures.export")}
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              {t("proFeatures.support")}
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <Button className="w-full" size="lg">
            {t("upgradeToPro")}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            {t("trialInfo")}
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8 pt-8 border-t">
        <h3 className="font-medium mb-4">{t("faq.title")}</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium">{t("faq.cancelQuestion")}</p>
            <p className="text-muted-foreground">
              {t("faq.cancelAnswer")}
            </p>
          </div>
          <div>
            <p className="font-medium">{t("faq.paymentQuestion")}</p>
            <p className="text-muted-foreground">
              {t("faq.paymentAnswer")}
            </p>
          </div>
          <div>
            <p className="font-medium">{t("faq.refundQuestion")}</p>
            <p className="text-muted-foreground">
              {t("faq.refundAnswer")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
