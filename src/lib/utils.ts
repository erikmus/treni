import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { DistanceUnit } from "@/types/database"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Distance conversion constants
const KM_TO_MILES = 0.621371
const MILES_TO_KM = 1.60934

/**
 * Convert kilometers to miles
 */
export function kmToMiles(km: number): number {
  return km * KM_TO_MILES
}

/**
 * Convert miles to kilometers
 */
export function milesToKm(miles: number): number {
  return miles * MILES_TO_KM
}

/**
 * Convert distance based on the user's preferred unit
 * Input is always in kilometers (as stored in the database)
 */
export function convertDistance(distanceKm: number, unit: DistanceUnit): number {
  if (unit === "mi") {
    return kmToMiles(distanceKm)
  }
  return distanceKm
}

/**
 * Format distance with the appropriate unit label
 * @param distanceKm - Distance in kilometers (always from database)
 * @param unit - User's preferred unit
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatDistance(
  distanceKm: number,
  unit: DistanceUnit,
  decimals: number = 1
): string {
  const converted = convertDistance(distanceKm, unit)
  const formatted = converted.toFixed(decimals)
  return `${formatted} ${unit}`
}

/**
 * Format distance from meters with the appropriate unit label
 * @param distanceMeters - Distance in meters
 * @param unit - User's preferred unit
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatDistanceFromMeters(
  distanceMeters: number,
  unit: DistanceUnit,
  decimals: number = 1
): string {
  const distanceKm = distanceMeters / 1000
  return formatDistance(distanceKm, unit, decimals)
}

/**
 * Convert pace from seconds per km to the appropriate unit
 * Returns pace in seconds per unit (km or mi)
 */
export function convertPace(paceSecPerKm: number, unit: DistanceUnit): number {
  if (unit === "mi") {
    // Pace per mile = pace per km * 1.60934
    return paceSecPerKm * MILES_TO_KM
  }
  return paceSecPerKm
}

/**
 * Format pace with the appropriate unit label
 * @param paceSecPerKm - Pace in seconds per kilometer
 * @param unit - User's preferred unit
 */
export function formatPace(paceSecPerKm: number | null, unit: DistanceUnit): string {
  if (!paceSecPerKm) return "-"
  
  const convertedPace = convertPace(paceSecPerKm, unit)
  const mins = Math.floor(convertedPace / 60)
  const secs = Math.round(convertedPace % 60)
  const paceUnit = unit === "mi" ? "/mi" : "/km"
  
  return `${mins}:${secs.toString().padStart(2, "0")}${paceUnit}`
}

/**
 * Get the unit label
 */
export function getUnitLabel(unit: DistanceUnit): string {
  return unit
}

/**
 * Get the pace unit label
 */
export function getPaceUnitLabel(unit: DistanceUnit): string {
  return unit === "mi" ? "/mi" : "/km"
}
