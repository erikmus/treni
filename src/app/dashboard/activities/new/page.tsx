"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

const activityTypes = [
  { value: "run", label: "Hardlopen", icon: "🏃" },
  { value: "walk", label: "Wandelen", icon: "🚶" },
  { value: "cycling", label: "Fietsen", icon: "🚴" },
  { value: "swimming", label: "Zwemmen", icon: "🏊" },
  { value: "cross_training", label: "Cross-training", icon: "🏋️" },
  { value: "other", label: "Overig", icon: "💪" },
];

const feelings = [
  { value: "great", label: "Fantastisch", icon: "🤩" },
  { value: "good", label: "Goed", icon: "😊" },
  { value: "okay", label: "Oké", icon: "😐" },
  { value: "tired", label: "Moe", icon: "😓" },
  { value: "exhausted", label: "Uitgeput", icon: "😫" },
];

export default function NewActivityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [activityType, setActivityType] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => {
    // Default to today
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [time, setTime] = useState(() => {
    // Default to current time
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [durationHours, setDurationHours] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [feeling, setFeeling] = useState("");
  const [avgHeartRate, setAvgHeartRate] = useState("");
  const [calories, setCalories] = useState("");
  const [description, setDescription] = useState("");

  function generateTitle(type: string, distance: number | null): string {
    const typeLabel = activityTypes.find(t => t.value === type)?.label || "Training";
    if (distance && distance >= 1) {
      return `${typeLabel} - ${distance.toFixed(1)} km`;
    }
    return typeLabel;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation
    if (!activityType) {
      toast.error("Selecteer een type activiteit");
      return;
    }

    const hours = parseInt(durationHours) || 0;
    const minutes = parseInt(durationMinutes) || 0;
    const seconds = parseInt(durationSeconds) || 0;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds === 0) {
      toast.error("Voer een duur in");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Je bent niet ingelogd");
        router.push("/login");
        return;
      }

      // Parse distance
      const distance = distanceKm ? parseFloat(distanceKm.replace(",", ".")) : null;
      const distanceMeters = distance ? distance * 1000 : null;

      // Calculate pace if we have distance
      let avgPaceSecPerKm: number | null = null;
      if (distance && distance > 0) {
        avgPaceSecPerKm = totalSeconds / distance;
      }

      // Parse started_at
      const startedAt = new Date(`${date}T${time}`);
      const finishedAt = new Date(startedAt.getTime() + totalSeconds * 1000);

      // Generate title if not provided
      const finalTitle = title.trim() || generateTitle(activityType, distance);

      const { data, error } = await supabase
        .from("activities")
        .insert({
          user_id: user.id,
          source: "manual",
          activity_type: activityType,
          title: finalTitle,
          started_at: startedAt.toISOString(),
          finished_at: finishedAt.toISOString(),
          duration_seconds: totalSeconds,
          distance_meters: distanceMeters,
          avg_pace_sec_per_km: avgPaceSecPerKm,
          feeling: feeling || null,
          avg_heart_rate: avgHeartRate ? parseInt(avgHeartRate) : null,
          calories: calories ? parseInt(calories) : null,
          description: description.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Activiteit toegevoegd!");
      router.push(`/dashboard/activities/${data.id}`);
    } catch (error) {
      console.error("Error creating activity:", error);
      toast.error("Er ging iets mis bij het opslaan");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/activities">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Activiteit toevoegen</h1>
          <p className="text-muted-foreground text-sm">
            Voeg handmatig een training of activiteit toe
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Activity Type */}
        <div className="space-y-2">
          <Label htmlFor="activity_type">Type activiteit *</Label>
          <Select value={activityType} onValueChange={setActivityType}>
            <SelectTrigger id="activity_type" className="w-full">
              <SelectValue placeholder="Selecteer type" />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <span className="flex items-center gap-2">
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Title (optional) */}
        <div className="space-y-2">
          <Label htmlFor="title">Titel (optioneel)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bijv. Ochtendloop door het park"
          />
          <p className="text-xs text-muted-foreground">
            Laat leeg om automatisch een titel te genereren
          </p>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Datum *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Starttijd *</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label>Duur *</Label>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Input
                type="number"
                min="0"
                max="23"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground text-center">Uren</p>
            </div>
            <div className="space-y-1">
              <Input
                type="number"
                min="0"
                max="59"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground text-center">Minuten</p>
            </div>
            <div className="space-y-1">
              <Input
                type="number"
                min="0"
                max="59"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground text-center">Seconden</p>
            </div>
          </div>
        </div>

        {/* Distance */}
        <div className="space-y-2">
          <Label htmlFor="distance">Afstand (km)</Label>
          <Input
            id="distance"
            type="text"
            inputMode="decimal"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            placeholder="Bijv. 5.5"
          />
        </div>

        {/* Feeling */}
        <div className="space-y-2">
          <Label>Hoe voelde je je?</Label>
          <div className="grid grid-cols-5 gap-2">
            {feelings.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFeeling(feeling === f.value ? "" : f.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                  feeling === f.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="text-2xl">{f.icon}</span>
                <span className="text-xs text-muted-foreground">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="heart_rate">Gem. hartslag (bpm)</Label>
            <Input
              id="heart_rate"
              type="number"
              min="30"
              max="220"
              value={avgHeartRate}
              onChange={(e) => setAvgHeartRate(e.target.value)}
              placeholder="Bijv. 145"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calories">Calorieën (kcal)</Label>
            <Input
              id="calories"
              type="number"
              min="0"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="Bijv. 350"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Notities</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Hoe ging de training? Eventuele opmerkingen..."
            rows={3}
            className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" asChild className="flex-1">
            <Link href="/dashboard/activities">Annuleren</Link>
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opslaan...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Activiteit toevoegen
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

