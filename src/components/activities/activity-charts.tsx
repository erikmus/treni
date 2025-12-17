"use client";

import { useState, useMemo, useCallback, memo } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Trackpoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
  hr?: number;
  cad?: number;
}

interface ActivityChartsProps {
  trackpoints: Trackpoint[];
  hoveredIndex?: number | null;
  onHover?: (index: number | null) => void;
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function formatPace(secondsPerKm: number): string {
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Get distance tick interval based on max distance
function getDistanceTickInterval(maxKm: number): number {
  if (maxKm > 40) return 5;
  if (maxKm > 30) return 3;
  if (maxKm > 10) return 2;
  return 1;
}

// Get time tick interval (in minutes) based on max time
function getTimeTickInterval(maxMin: number): number {
  if (maxMin > 240) return 30;
  if (maxMin > 120) return 15;
  if (maxMin > 60) return 10;
  return 5;
}

// Generate ticks for distance axis
function generateDistanceTicks(maxKm: number): number[] {
  if (!maxKm || maxKm <= 0 || !isFinite(maxKm)) return [0, 1, 2, 3, 4, 5];
  const interval = getDistanceTickInterval(maxKm);
  const ticks: number[] = [];
  const maxTick = Math.ceil(maxKm / interval) * interval;
  for (let i = 0; i <= maxTick; i += interval) {
    ticks.push(i);
  }
  return ticks;
}

// Generate ticks for time axis
function generateTimeTicks(maxMin: number): number[] {
  if (!maxMin || maxMin <= 0 || !isFinite(maxMin)) return [0, 5, 10, 15, 20, 25, 30];
  const interval = getTimeTickInterval(maxMin);
  const ticks: number[] = [];
  const maxTick = Math.ceil(maxMin / interval) * interval;
  for (let i = 0; i <= maxTick; i += interval) {
    ticks.push(i);
  }
  return ticks;
}

// Format time for axis display
function formatTimeAxis(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) {
    return `${mins}`;
  }
  return `${hours}:${mins.toString().padStart(2, "0")}`;
}

interface ChartDataPoint {
  distanceKm: number;
  timeMin: number;
  hr?: number;
  pace?: number;
  elevation?: number;
  originalIndex: number;
}

function processTrackpoints(trackpoints: Trackpoint[]): ChartDataPoint[] {
  if (trackpoints.length === 0) return [];

  const data: ChartDataPoint[] = [];
  let cumulativeDistance = 0;
  let startTime: Date | null = null;

  const sampleRate = Math.max(1, Math.floor(trackpoints.length / 500));

  for (let i = 0; i < trackpoints.length; i += sampleRate) {
    const point = trackpoints[i];
    
    if (i > 0) {
      const prevPoint = trackpoints[Math.max(0, i - sampleRate)];
      cumulativeDistance += calculateDistance(prevPoint.lat, prevPoint.lon, point.lat, point.lon);
    }

    let timeMin = 0;
    if (point.time) {
      const pointTime = new Date(point.time);
      if (!startTime) startTime = pointTime;
      timeMin = (pointTime.getTime() - startTime.getTime()) / 60000;
    }

    let pace: number | undefined;
    if (i > 0 && point.time) {
      const prevIndex = Math.max(0, i - sampleRate * 3);
      const prevPoint = trackpoints[prevIndex];
      if (prevPoint.time) {
        const segmentDistance = calculateDistance(prevPoint.lat, prevPoint.lon, point.lat, point.lon);
        const segmentTime = (new Date(point.time).getTime() - new Date(prevPoint.time).getTime()) / 1000;
        if (segmentDistance > 10) {
          pace = (segmentTime / segmentDistance) * 1000;
          if (pace < 120 || pace > 900) pace = undefined;
        }
      }
    }

    data.push({
      distanceKm: cumulativeDistance / 1000,
      timeMin,
      hr: point.hr,
      pace,
      elevation: point.ele,
      originalIndex: i,
    });
  }

  return data;
}

// Memoized Heart Rate & Pace Chart
const HRPaceChart = memo(function HRPaceChart({
  chartData,
  chartConfig,
  xAxisType,
  distanceTicks,
  timeTicks,
  hasHeartRate,
  hasPace,
  referenceX,
  onMouseMove,
  onMouseLeave,
}: {
  chartData: ChartDataPoint[];
  chartConfig: Record<string, { label: string; color: string }>;
  xAxisType: "distance" | "time";
  distanceTicks: number[];
  timeTicks: number[];
  hasHeartRate: boolean;
  hasPace: boolean;
  referenceX: number | null;
  onMouseMove: (state: any) => void;
  onMouseLeave: () => void;
}) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ComposedChart 
        data={chartData}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey={xAxisType === "distance" ? "distanceKm" : "timeMin"}
          type="number"
          domain={[0, xAxisType === "distance" ? distanceTicks[distanceTicks.length - 1] : timeTicks[timeTicks.length - 1]]}
          ticks={xAxisType === "distance" ? distanceTicks : timeTicks}
          tickFormatter={(value) => xAxisType === "distance" ? `${value}` : formatTimeAxis(value)}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        {hasHeartRate && (
          <YAxis 
            yAxisId="hr"
            orientation="left"
            domain={['auto', 'auto']}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
            label={{ value: 'bpm', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
          />
        )}
        {hasPace && (
          <YAxis 
            yAxisId="pace"
            orientation="right"
            domain={['auto', 'auto']}
            reversed
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatPace(value)}
            label={{ value: 'min/km', angle: 90, position: 'insideRight', style: { fontSize: 11 } }}
          />
        )}
        <ChartTooltip 
          content={
            <ChartTooltipContent 
              labelFormatter={(_, payload) => {
                if (payload && payload[0]) {
                  const data = payload[0].payload;
                  return xAxisType === "distance" 
                    ? `${data.distanceKm.toFixed(2)} km`
                    : `${Math.floor(data.timeMin)}:${String(Math.round((data.timeMin % 1) * 60)).padStart(2, '0')}`;
                }
                return "";
              }}
              formatter={(value, name) => {
                if (name === "pace" && typeof value === "number") {
                  return [formatPace(value) + " /km", "Tempo"];
                }
                if (name === "hr") {
                  return [value + " bpm", "Hartslag"];
                }
                return [value, name];
              }}
            />
          }
        />
        {/* Reference line from map hover */}
        {referenceX !== null && (
          <ReferenceLine 
            x={referenceX} 
            yAxisId={hasHeartRate ? "hr" : "pace"}
            stroke="#f97316" 
            strokeWidth={2}
          />
        )}
        {hasHeartRate && (
          <Line 
            yAxisId="hr"
            type="monotone" 
            dataKey="hr" 
            stroke="var(--color-hr)" 
            strokeWidth={2}
            dot={false}
            name="hr"
            isAnimationActive={false}
          />
        )}
        {hasPace && (
          <Line 
            yAxisId="pace"
            type="monotone" 
            dataKey="pace" 
            stroke="var(--color-pace)" 
            strokeWidth={2}
            dot={false}
            name="pace"
            isAnimationActive={false}
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
});

// Memoized Elevation Chart
const ElevationChart = memo(function ElevationChart({
  chartData,
  chartConfig,
  xAxisType,
  distanceTicks,
  timeTicks,
  referenceX,
  onMouseMove,
  onMouseLeave,
}: {
  chartData: ChartDataPoint[];
  chartConfig: Record<string, { label: string; color: string }>;
  xAxisType: "distance" | "time";
  distanceTicks: number[];
  timeTicks: number[];
  referenceX: number | null;
  onMouseMove: (state: any) => void;
  onMouseLeave: () => void;
}) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <ComposedChart 
        data={chartData}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey={xAxisType === "distance" ? "distanceKm" : "timeMin"}
          type="number"
          domain={[0, xAxisType === "distance" ? distanceTicks[distanceTicks.length - 1] : timeTicks[timeTicks.length - 1]]}
          ticks={xAxisType === "distance" ? distanceTicks : timeTicks}
          tickFormatter={(value) => xAxisType === "distance" ? `${value} km` : formatTimeAxis(value)}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          yAxisId="elevation"
          domain={['auto', 'auto']}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${Math.round(value)}m`}
        />
        <ChartTooltip 
          content={
            <ChartTooltipContent 
              labelFormatter={(_, payload) => {
                if (payload && payload[0]) {
                  const data = payload[0].payload;
                  return xAxisType === "distance" 
                    ? `${data.distanceKm.toFixed(2)} km`
                    : `${Math.floor(data.timeMin)} min`;
                }
                return "";
              }}
              formatter={(value) => [`${Math.round(value as number)} m`, "Hoogte"]}
            />
          }
        />
        {/* Reference line from map hover */}
        {referenceX !== null && (
          <ReferenceLine 
            x={referenceX} 
            yAxisId="elevation"
            stroke="#f97316" 
            strokeWidth={2}
          />
        )}
        <Area 
          type="monotone" 
          dataKey="elevation" 
          stroke="var(--color-elevation)" 
          fill="var(--color-elevation)"
          fillOpacity={0.3}
          strokeWidth={2}
          yAxisId="elevation"
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
});

export function ActivityCharts({ trackpoints, hoveredIndex, onHover }: ActivityChartsProps) {
  const [xAxisType, setXAxisType] = useState<"distance" | "time">("distance");

  // Process trackpoints into chart data
  const chartData = useMemo(() => processTrackpoints(trackpoints), [trackpoints]);

  // Find closest chart index when hoveredIndex changes (from map)
  const hoveredChartData = useMemo(() => {
    if (hoveredIndex === null || hoveredIndex === undefined) return null;
    
    let closestIndex = 0;
    let minDiff = Infinity;
    
    chartData.forEach((point, i) => {
      const diff = Math.abs(point.originalIndex - hoveredIndex);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    });
    
    return chartData[closestIndex] || null;
  }, [hoveredIndex, chartData]);

  const handleMouseMove = useCallback((state: any) => {
    if (state?.activePayload?.[0]?.payload && onHover) {
      const dataPoint = state.activePayload[0].payload as ChartDataPoint;
      onHover(dataPoint.originalIndex);
    }
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    if (onHover) {
      onHover(null);
    }
  }, [onHover]);

  // Memoize derived data to prevent unnecessary re-renders
  const { hasHeartRate, hasElevation, hasPace, distanceTicks, timeTicks } = useMemo(() => {
    const hasHR = chartData.some(d => d.hr !== undefined);
    const hasEle = chartData.some(d => d.elevation !== undefined);
    const hasPc = chartData.some(d => d.pace !== undefined && d.pace > 0);
    const maxDist = Math.max(...chartData.map(d => d.distanceKm));
    const maxTime = Math.max(...chartData.map(d => d.timeMin));
    
    return {
      hasHeartRate: hasHR,
      hasElevation: hasEle,
      hasPace: hasPc,
      distanceTicks: generateDistanceTicks(maxDist),
      timeTicks: generateTimeTicks(maxTime),
    };
  }, [chartData]);

  // Memoize chart config to prevent re-renders
  const chartConfig = useMemo(() => ({
    hr: {
      label: "Hartslag",
      color: "hsl(0, 84%, 60%)",
    },
    pace: {
      label: "Tempo",
      color: "hsl(217, 91%, 60%)",
    },
    elevation: {
      label: "Hoogte",
      color: "hsl(142, 71%, 45%)",
    },
  }), []);

  // Calculate the x value for the reference line (only from map hover)
  const referenceX = hoveredChartData 
    ? (xAxisType === "distance" ? hoveredChartData.distanceKm : hoveredChartData.timeMin)
    : null;

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Tabs for X-axis selection */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Grafieken</h2>
        <Tabs value={xAxisType} onValueChange={(v) => setXAxisType(v as "distance" | "time")}>
          <TabsList>
            <TabsTrigger value="distance">Afstand</TabsTrigger>
            <TabsTrigger value="time">Tijd</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Heart Rate & Pace Chart */}
      {(hasHeartRate || hasPace) && (
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            {hasHeartRate && hasPace ? "Hartslag & Tempo" : hasHeartRate ? "Hartslag" : "Tempo"}
          </h3>
          <HRPaceChart
            chartData={chartData}
            chartConfig={chartConfig}
            xAxisType={xAxisType}
            distanceTicks={distanceTicks}
            timeTicks={timeTicks}
            hasHeartRate={hasHeartRate}
            hasPace={hasPace}
            referenceX={referenceX}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            {hasHeartRate && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Hartslag (bpm)</span>
              </div>
            )}
            {hasPace && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Tempo (min/km)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Elevation Chart */}
      {hasElevation && (
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Hoogteprofiel</h3>
          <ElevationChart
            chartData={chartData}
            chartConfig={chartConfig}
            xAxisType={xAxisType}
            distanceTicks={distanceTicks}
            timeTicks={timeTicks}
            referenceX={referenceX}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        </div>
      )}
    </div>
  );
}
