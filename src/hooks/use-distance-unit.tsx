"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DistanceUnit } from "@/types/database";
import {
  formatDistance,
  formatDistanceFromMeters,
  formatPace,
  convertDistance,
  convertPace,
  getUnitLabel,
  getPaceUnitLabel,
} from "@/lib/utils";

interface DistanceUnitContextValue {
  unit: DistanceUnit;
  formatDistance: (distanceKm: number, decimals?: number) => string;
  formatDistanceFromMeters: (distanceMeters: number, decimals?: number) => string;
  formatPace: (paceSecPerKm: number | null) => string;
  convertDistance: (distanceKm: number) => number;
  convertPace: (paceSecPerKm: number) => number;
  unitLabel: string;
  paceUnitLabel: string;
}

const DistanceUnitContext = createContext<DistanceUnitContextValue | null>(null);

interface DistanceUnitProviderProps {
  children: ReactNode;
  unit: DistanceUnit;
}

export function DistanceUnitProvider({ children, unit }: DistanceUnitProviderProps) {
  const value: DistanceUnitContextValue = {
    unit,
    formatDistance: (distanceKm: number, decimals?: number) =>
      formatDistance(distanceKm, unit, decimals),
    formatDistanceFromMeters: (distanceMeters: number, decimals?: number) =>
      formatDistanceFromMeters(distanceMeters, unit, decimals),
    formatPace: (paceSecPerKm: number | null) => formatPace(paceSecPerKm, unit),
    convertDistance: (distanceKm: number) => convertDistance(distanceKm, unit),
    convertPace: (paceSecPerKm: number) => convertPace(paceSecPerKm, unit),
    unitLabel: getUnitLabel(unit),
    paceUnitLabel: getPaceUnitLabel(unit),
  };

  return (
    <DistanceUnitContext.Provider value={value}>
      {children}
    </DistanceUnitContext.Provider>
  );
}

export function useDistanceUnit(): DistanceUnitContextValue {
  const context = useContext(DistanceUnitContext);
  
  if (!context) {
    // Return default km values if no provider is present
    // This ensures backwards compatibility and prevents errors
    return {
      unit: "km",
      formatDistance: (distanceKm: number, decimals?: number) =>
        formatDistance(distanceKm, "km", decimals),
      formatDistanceFromMeters: (distanceMeters: number, decimals?: number) =>
        formatDistanceFromMeters(distanceMeters, "km", decimals),
      formatPace: (paceSecPerKm: number | null) => formatPace(paceSecPerKm, "km"),
      convertDistance: (distanceKm: number) => distanceKm,
      convertPace: (paceSecPerKm: number) => paceSecPerKm,
      unitLabel: "km",
      paceUnitLabel: "/km",
    };
  }
  
  return context;
}

