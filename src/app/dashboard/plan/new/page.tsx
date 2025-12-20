import { getTranslations } from "next-intl/server";
import { PlanWizard } from "@/components/plan";

export default async function NewPlanPage() {
  const t = await getTranslations("plans.create");

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("subtitle")}
        </p>
      </div>

      {/* Wizard */}
      <PlanWizard />
    </div>
  );
}
