"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface Trackpoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
  hr?: number;
  cad?: number;
}

interface RouteMapProps {
  trackpoints: Trackpoint[];
  className?: string;
}

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(
  () => import("./route-map-inner").then((mod) => mod.RouteMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="text-muted-foreground">Kaart laden...</div>
      </div>
    ),
  }
);

export function RouteMap({ trackpoints, className }: RouteMapProps) {
  // Filter valid trackpoints
  const validPoints = useMemo(() => 
    trackpoints.filter(tp => 
      tp.lat !== undefined && 
      tp.lon !== undefined && 
      !isNaN(tp.lat) && 
      !isNaN(tp.lon)
    ),
    [trackpoints]
  );

  if (validPoints.length < 2) {
    return null;
  }

  return (
    <div className={`bg-card rounded-xl border overflow-hidden ${className || ""}`}>
      <div className="p-4 pb-2 border-b">
        <h3 className="text-lg font-semibold">Route</h3>
      </div>
      <div className="h-[400px] relative">
        <MapComponent trackpoints={validPoints} mapboxToken={MAPBOX_TOKEN} />
      </div>
    </div>
  );
}
