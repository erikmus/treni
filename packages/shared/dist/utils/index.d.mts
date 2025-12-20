import { DistanceUnit } from '../types/index.mjs';

/**
 * Convert kilometers to miles
 */
declare function kmToMiles(km: number): number;
/**
 * Convert miles to kilometers
 */
declare function milesToKm(miles: number): number;
/**
 * Convert distance based on the user's preferred unit
 * Input is always in kilometers (as stored in the database)
 */
declare function convertDistance(distanceKm: number, unit: DistanceUnit): number;
/**
 * Format distance with the appropriate unit label
 * @param distanceKm - Distance in kilometers (always from database)
 * @param unit - User's preferred unit
 * @param decimals - Number of decimal places (default: 1)
 */
declare function formatDistance(distanceKm: number, unit: DistanceUnit, decimals?: number): string;
/**
 * Format distance from meters with the appropriate unit label
 * @param distanceMeters - Distance in meters
 * @param unit - User's preferred unit
 * @param decimals - Number of decimal places (default: 1)
 */
declare function formatDistanceFromMeters(distanceMeters: number, unit: DistanceUnit, decimals?: number): string;
/**
 * Convert pace from seconds per km to the appropriate unit
 * Returns pace in seconds per unit (km or mi)
 */
declare function convertPace(paceSecPerKm: number, unit: DistanceUnit): number;
/**
 * Format pace with the appropriate unit label
 * @param paceSecPerKm - Pace in seconds per kilometer
 * @param unit - User's preferred unit
 */
declare function formatPace(paceSecPerKm: number | null, unit: DistanceUnit): string;
/**
 * Get the unit label
 */
declare function getUnitLabel(unit: DistanceUnit): string;
/**
 * Get the pace unit label
 */
declare function getPaceUnitLabel(unit: DistanceUnit): string;

export { convertDistance, convertPace, formatDistance, formatDistanceFromMeters, formatPace, getPaceUnitLabel, getUnitLabel, kmToMiles, milesToKm };
