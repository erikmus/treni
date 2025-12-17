import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BillingPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Abonnement</h2>
        <p className="text-muted-foreground text-sm">
          Beheer je abonnement en facturatie
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-card border rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Gratis plan</h3>
              <Badge variant="secondary">Huidig</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Basis functies voor hardlopers
            </p>
          </div>
          <p className="text-2xl font-bold">€0<span className="text-sm font-normal text-muted-foreground">/maand</span></p>
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">Inbegrepen:</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-emerald-500" />
              1 actief trainingsschema
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-emerald-500" />
              Basis statistieken
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-emerald-500" />
              Activiteiten importeren
            </li>
          </ul>
        </div>
      </div>

      {/* Pro Plan */}
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Pro</h3>
              <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                Aanbevolen
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Alles wat je nodig hebt om je doelen te bereiken
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">€9<span className="text-sm font-normal text-muted-foreground">/maand</span></p>
            <p className="text-xs text-muted-foreground">of €89/jaar (bespaar 17%)</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-primary/10">
          <p className="text-sm text-muted-foreground mb-2">Alles van Gratis, plus:</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Onbeperkte trainingsschema&apos;s
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              AI-gegenereerde schema&apos;s
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Geavanceerde statistieken & analyses
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Garmin & Strava integratie
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Export naar Garmin horloge
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Prioriteit support
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <Button className="w-full" size="lg">
            Upgrade naar Pro
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            14 dagen gratis proberen • Elk moment opzegbaar
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8 pt-8 border-t">
        <h3 className="font-medium mb-4">Veelgestelde vragen</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Hoe kan ik opzeggen?</p>
            <p className="text-muted-foreground">
              Je kunt je abonnement elk moment opzeggen. Je houdt toegang tot Pro features tot het einde van je factureringsperiode.
            </p>
          </div>
          <div>
            <p className="font-medium">Welke betaalmethoden worden geaccepteerd?</p>
            <p className="text-muted-foreground">
              We accepteren alle gangbare creditcards en iDEAL.
            </p>
          </div>
          <div>
            <p className="font-medium">Kan ik van gedachten veranderen?</p>
            <p className="text-muted-foreground">
              Ja, we bieden een 14-dagen geld-terug-garantie als je niet tevreden bent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

