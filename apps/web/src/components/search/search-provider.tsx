"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Activity,
  Calendar,
  Dumbbell,
  Loader2,
  MapPin,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  workouts: {
    id: string;
    title: string;
    workout_type: string;
    scheduled_date: string;
    status: string;
  }[];
  activities: {
    id: string;
    title: string | null;
    activity_type: string;
    started_at: string;
    distance_meters: number | null;
    duration_seconds: number;
  }[];
}

const workoutTypeLabels: Record<string, string> = {
  easy_run: "Rustige duurloop",
  long_run: "Lange duurloop",
  tempo_run: "Tempo",
  interval: "Interval",
  fartlek: "Fartlek",
  recovery: "Herstel",
  hill_training: "Heuveltraining",
  race_pace: "Wedstrijdtempo",
  cross_training: "Cross-training",
  rest: "Rust",
};

const activityTypeLabels: Record<string, string> = {
  run: "Hardlopen",
  walk: "Wandelen",
  cross_training: "Cross-training",
  cycling: "Fietsen",
  swimming: "Zwemmen",
  other: "Anders",
};

function formatDistance(meters: number | null): string {
  if (!meters) return "";
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}u ${remainingMins}m`;
}

// Context for managing search dialog state globally
const SearchContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function useSearch() {
  const context = React.useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  // Keyboard shortcut to open search
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <SearchContext.Provider value={{ open, setOpen }}>
      {children}
      <SearchDialog open={open} onOpenChange={setOpen} />
    </SearchContext.Provider>
  );
}

// The actual search dialog
function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult>({
    workouts: [],
    activities: [],
  });
  const [isLoading, setIsLoading] = React.useState(false);

  // Reset query when dialog closes
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults({ workouts: [], activities: [] });
    }
  }, [open]);

  // Search when query changes
  React.useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ workouts: [], activities: [] });
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSelect = (type: "workout" | "activity", id: string) => {
    onOpenChange(false);
    if (type === "workout") {
      router.push(`/dashboard/workouts/${id}`);
    } else {
      router.push(`/dashboard/activities/${id}`);
    }
  };

  const hasResults = results.workouts.length > 0 || results.activities.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Zoek workouts en activiteiten..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && query.length >= 2 && !hasResults && (
          <CommandEmpty>
            Geen resultaten gevonden voor &quot;{query}&quot;
          </CommandEmpty>
        )}

        {!isLoading && query.length < 2 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Typ minimaal 2 karakters om te zoeken
          </div>
        )}

        {!isLoading && results.workouts.length > 0 && (
          <CommandGroup heading="Workouts">
            {results.workouts.map((workout) => (
              <CommandItem
                key={workout.id}
                value={`workout-${workout.id}`}
                onSelect={() => handleSelect("workout", workout.id)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Dumbbell className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{workout.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(workout.scheduled_date), "d MMM yyyy", { locale: nl })}
                    <span>•</span>
                    {workoutTypeLabels[workout.workout_type] || workout.workout_type}
                  </p>
                </div>
                <Badge
                  variant={workout.status === "completed" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {workout.status === "completed" ? "Voltooid" : "Gepland"}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!isLoading && results.workouts.length > 0 && results.activities.length > 0 && (
          <CommandSeparator />
        )}

        {!isLoading && results.activities.length > 0 && (
          <CommandGroup heading="Activiteiten">
            {results.activities.map((activity) => (
              <CommandItem
                key={activity.id}
                value={`activity-${activity.id}`}
                onSelect={() => handleSelect("activity", activity.id)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Activity className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {activity.title || activityTypeLabels[activity.activity_type] || "Activiteit"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(activity.started_at), "d MMM yyyy", { locale: nl })}
                    {activity.distance_meters && (
                      <>
                        <span>•</span>
                        <MapPin className="h-3 w-3" />
                        {formatDistance(activity.distance_meters)}
                      </>
                    )}
                    <span>•</span>
                    {formatDuration(activity.duration_seconds)}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

