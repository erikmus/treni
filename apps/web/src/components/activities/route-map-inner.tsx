"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import mapboxgl from "mapbox-gl";

interface Trackpoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
  hr?: number;
  cad?: number;
}

interface RouteMapInnerProps {
  trackpoints: Trackpoint[];
  mapboxToken: string;
  hoveredIndex?: number | null;
  onHover?: (index: number | null) => void;
}

// Find the closest point on the route to a given coordinate
function findClosestPointIndex(
  trackpoints: Trackpoint[],
  lng: number,
  lat: number
): number {
  let minDist = Infinity;
  let closestIndex = 0;
  
  for (let i = 0; i < trackpoints.length; i++) {
    const point = trackpoints[i];
    const dist = Math.pow(point.lon - lng, 2) + Math.pow(point.lat - lat, 2);
    if (dist < minDist) {
      minDist = dist;
      closestIndex = i;
    }
  }
  
  return closestIndex;
}

export function RouteMapInner({ trackpoints, mapboxToken, hoveredIndex, onHover }: RouteMapInnerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const hoverMarker = useRef<mapboxgl.Marker | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Calculate bounds
  const bounds = useMemo(() => {
    if (trackpoints.length === 0) return null;
    
    let minLat = Infinity, maxLat = -Infinity;
    let minLon = Infinity, maxLon = -Infinity;
    
    for (const point of trackpoints) {
      minLat = Math.min(minLat, point.lat);
      maxLat = Math.max(maxLat, point.lat);
      minLon = Math.min(minLon, point.lon);
      maxLon = Math.max(maxLon, point.lon);
    }
    
    return {
      minLat, maxLat, minLon, maxLon,
      centerLat: (minLat + maxLat) / 2,
      centerLon: (minLon + maxLon) / 2,
    };
  }, [trackpoints]);

  // Create GeoJSON for the route
  const routeGeoJSON = useMemo(() => ({
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: trackpoints.map(tp => [tp.lon, tp.lat]),
    },
  }), [trackpoints]);

  // Update hover marker when hoveredIndex changes (from chart)
  useEffect(() => {
    if (!map.current || !loaded) return;

    if (hoveredIndex !== null && hoveredIndex !== undefined && trackpoints[hoveredIndex]) {
      const point = trackpoints[hoveredIndex];
      
      if (!hoverMarker.current) {
        // Create the hover marker element
        const el = document.createElement("div");
        el.className = "hover-marker";
        el.innerHTML = `
          <div style="
            width: 16px; 
            height: 16px; 
            border-radius: 50%; 
            background: #f97316; 
            border: 3px solid white; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            transition: transform 0.1s ease;
          "></div>
        `;
        
        hoverMarker.current = new mapboxgl.Marker({ element: el })
          .setLngLat([point.lon, point.lat])
          .addTo(map.current);
      } else {
        hoverMarker.current.setLngLat([point.lon, point.lat]);
      }
    } else {
      // Remove marker when not hovering
      if (hoverMarker.current) {
        hoverMarker.current.remove();
        hoverMarker.current = null;
      }
    }
  }, [hoveredIndex, trackpoints, loaded]);

  useEffect(() => {
    if (!mapContainer.current || !bounds) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [bounds.centerLon, bounds.centerLat],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      if (!map.current) return;

      // Add route source and layer
      map.current.addSource("route", {
        type: "geojson",
        data: routeGeoJSON,
      });

      // Invisible wider line for easier hover detection
      map.current.addLayer({
        id: "route-hover-area",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "transparent",
          "line-width": 20,
          "line-opacity": 0,
        },
      });

      // Route outline
      map.current.addLayer({
        id: "route-outline",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#1e40af",
          "line-width": 6,
          "line-opacity": 0.5,
        },
      });

      // Main route line
      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
          "line-opacity": 0.9,
        },
      });

      // Fit bounds
      map.current.fitBounds(
        [[bounds.minLon, bounds.minLat], [bounds.maxLon, bounds.maxLat]],
        { padding: 50, duration: 0 }
      );

      // Add start marker
      const startPoint = trackpoints[0];
      const startEl = document.createElement("div");
      startEl.className = "start-marker";
      startEl.innerHTML = `
        <div style="position: relative;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: #10b981; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: white;"></div>
          </div>
          <div style="position: absolute; top: 28px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500; white-space: nowrap;">Start</div>
        </div>
      `;
      new mapboxgl.Marker({ element: startEl })
        .setLngLat([startPoint.lon, startPoint.lat])
        .addTo(map.current);

      // Add end marker
      const endPoint = trackpoints[trackpoints.length - 1];
      const endEl = document.createElement("div");
      endEl.className = "end-marker";
      endEl.innerHTML = `
        <div style="position: relative;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: #ef4444; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div style="position: absolute; top: 28px; left: 50%; transform: translateX(-50%); background: #ef4444; color: white; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500; white-space: nowrap;">Finish</div>
        </div>
      `;
      new mapboxgl.Marker({ element: endEl })
        .setLngLat([endPoint.lon, endPoint.lat])
        .addTo(map.current);

      // Set up hover events
      if (onHover) {
        // Change cursor on hover
        map.current.on("mouseenter", "route-hover-area", () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = "crosshair";
          }
        });

        map.current.on("mouseleave", "route-hover-area", () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = "";
          }
          onHover(null);
        });

        // Track mouse movement on route
        map.current.on("mousemove", "route-hover-area", (e) => {
          if (e.lngLat) {
            const index = findClosestPointIndex(trackpoints, e.lngLat.lng, e.lngLat.lat);
            onHover(index);
          }
        });
      }

      setLoaded(true);
    });

    return () => {
      if (hoverMarker.current) {
        hoverMarker.current.remove();
        hoverMarker.current = null;
      }
      map.current?.remove();
    };
  }, [bounds, mapboxToken, routeGeoJSON, trackpoints, onHover]);

  return (
    <div 
      ref={mapContainer} 
      style={{ width: "100%", height: "100%" }}
    />
  );
}
