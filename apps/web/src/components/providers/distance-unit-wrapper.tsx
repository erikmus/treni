"use client";

import type { ReactNode } from "react";
import { DistanceUnitProvider } from "@/hooks/use-distance-unit";
import type { DistanceUnit } from "@/types/database";

interface DistanceUnitWrapperProps {
  children: ReactNode;
  unit: DistanceUnit;
}

export function DistanceUnitWrapper({ children, unit }: DistanceUnitWrapperProps) {
  return (
    <DistanceUnitProvider unit={unit}>
      {children}
    </DistanceUnitProvider>
  );
}

