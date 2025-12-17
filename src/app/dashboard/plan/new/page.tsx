import { PlanWizard } from "@/components/plan";

export default function NewPlanPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Nieuw trainingsschema</h1>
        <p className="text-muted-foreground mt-2">
          Maak een gepersonaliseerd schema op basis van jouw doelen en beschikbaarheid
        </p>
      </div>

      {/* Wizard */}
      <PlanWizard />
    </div>
  );
}

