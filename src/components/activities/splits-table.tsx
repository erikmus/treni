"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Split {
  lapNumber: number;
  startTime: string;
  durationSeconds: number;
  distanceMeters: number;
  paceSecPerKm: number | null;
  avgHeartRate?: number;
  maxHeartRate?: number;
  cadence?: number;
  calories: number;
}

interface SplitsTableProps {
  splits: Split[];
}

function formatPace(secondsPerKm: number | null): string {
  if (!secondsPerKm) return "-";
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function SplitsTable({ splits }: SplitsTableProps) {
  if (splits.length === 0) return null;

  const hasHeartRate = splits.some(s => s.avgHeartRate);
  const hasCadence = splits.some(s => s.cadence);

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="p-6 pb-4">
        <h2 className="text-lg font-semibold">Splits</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Overzicht per kilometer/lap
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Lap</TableHead>
              <TableHead>Afstand</TableHead>
              <TableHead>Tijd</TableHead>
              <TableHead>Tempo</TableHead>
              {hasHeartRate && <TableHead>Gem. HR</TableHead>}
              {hasCadence && <TableHead>Cadans</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {splits.map((split) => (
              <TableRow key={split.lapNumber}>
                <TableCell className="font-medium">{split.lapNumber}</TableCell>
                <TableCell>{(split.distanceMeters / 1000).toFixed(2)} km</TableCell>
                <TableCell>{formatDuration(split.durationSeconds)}</TableCell>
                <TableCell className="font-mono">
                  {formatPace(split.paceSecPerKm)} /km
                </TableCell>
                {hasHeartRate && (
                  <TableCell>
                    {split.avgHeartRate ? `${split.avgHeartRate} bpm` : "-"}
                  </TableCell>
                )}
                {hasCadence && (
                  <TableCell>
                    {split.cadence ? `${split.cadence} spm` : "-"}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

