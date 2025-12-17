import { Bell, Mail, Smartphone, Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Notificaties</h2>
        <p className="text-muted-foreground text-sm">
          Bepaal hoe en wanneer je meldingen ontvangt
        </p>
      </div>

      <div className="space-y-8">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">E-mailnotificaties</h3>
          </div>
          
          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-workout">Workout herinneringen</Label>
                <p className="text-xs text-muted-foreground">
                  Ontvang een herinnering voor geplande trainingen
                </p>
              </div>
              <Switch id="email-workout" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-weekly">Wekelijkse samenvatting</Label>
                <p className="text-xs text-muted-foreground">
                  Overzicht van je trainingsweek
                </p>
              </div>
              <Switch id="email-weekly" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-tips">Tips en updates</Label>
                <p className="text-xs text-muted-foreground">
                  Trainingstips en nieuwe features
                </p>
              </div>
              <Switch id="email-tips" />
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">Push notificaties</h3>
          </div>
          
          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-workout">Workout herinneringen</Label>
                <p className="text-xs text-muted-foreground">
                  Push melding voor geplande trainingen
                </p>
              </div>
              <Switch id="push-workout" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-achievements">Prestaties</Label>
                <p className="text-xs text-muted-foreground">
                  Meldingen bij nieuwe PR&apos;s en mijlpalen
                </p>
              </div>
              <Switch id="push-achievements" defaultChecked />
            </div>
          </div>
        </div>

        {/* Calendar Sync */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">Agenda integratie</h3>
          </div>
          
          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="calendar-sync">Synchroniseer met agenda</Label>
                <p className="text-xs text-muted-foreground">
                  Voeg workouts automatisch toe aan je agenda
                </p>
              </div>
              <Switch id="calendar-sync" />
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground pt-4 border-t">
          Wijzigingen worden automatisch opgeslagen.
        </p>
      </div>
    </div>
  );
}

