"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import "mapbox-gl/dist/mapbox-gl.css";
import { ActivityCharts } from "./activity-charts";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZXJpa211c3dpbmUiLCJhIjoiY21qYWVyazBoMDA1MDNtcjY0ajN2c3J1MiJ9.ST1TRKU7y4ZkLIN-fh3OKA";

interface Trackpoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
  hr?: number;
  cad?: number;
}

interface ActivityVisualizationProps {
  trackpoints: Trackpoint[];
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

export function ActivityVisualization({ trackpoints }: ActivityVisualizationProps) {
  // Track hover index and source separately
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverSource, setHoverSource] = useState<"map" | "chart" | null>(null);

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

  const handleMapHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
    setHoverSource(index !== null ? "map" : null);
  }, []);

  const handleChartHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
    setHoverSource(index !== null ? "chart" : null);
  }, []);

  const showMap = validPoints.length >= 2;

  // Only pass hoveredIndex to map if hover came from chart
  const mapHoveredIndex = hoverSource === "chart" ? hoveredIndex : null;
  // Only pass hoveredIndex to charts if hover came from map  
  const chartHoveredIndex = hoverSource === "map" ? hoveredIndex : null;

  return (
    <div className="space-y-6">
      {/* Route Map */}
      {showMap && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="p-4 pb-2 border-b">
            <h3 className="text-lg font-semibold">Route</h3>
          </div>
          <div className="h-[400px] relative">
            <MapComponent 
              trackpoints={validPoints} 
              mapboxToken={MAPBOX_TOKEN}
              hoveredIndex={mapHoveredIndex}
              onHover={handleMapHover}
            />
          </div>
        </div>
      )}

      {/* Charts Section */}
      {validPoints.length > 0 && (
        <ActivityCharts 
          trackpoints={validPoints}
          hoveredIndex={chartHoveredIndex}
          onHover={handleChartHover}
        />
      )}
    </div>
  );
}

