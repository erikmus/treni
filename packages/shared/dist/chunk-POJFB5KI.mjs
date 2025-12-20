// src/utils/distance.ts
var KM_TO_MILES = 0.621371;
var MILES_TO_KM = 1.60934;
function kmToMiles(km) {
  return km * KM_TO_MILES;
}
function milesToKm(miles) {
  return miles * MILES_TO_KM;
}
function convertDistance(distanceKm, unit) {
  if (unit === "mi") {
    return kmToMiles(distanceKm);
  }
  return distanceKm;
}
function formatDistance(distanceKm, unit, decimals = 1) {
  const converted = convertDistance(distanceKm, unit);
  const formatted = converted.toFixed(decimals);
  return `${formatted} ${unit}`;
}
function formatDistanceFromMeters(distanceMeters, unit, decimals = 1) {
  const distanceKm = distanceMeters / 1e3;
  return formatDistance(distanceKm, unit, decimals);
}
function convertPace(paceSecPerKm, unit) {
  if (unit === "mi") {
    return paceSecPerKm * MILES_TO_KM;
  }
  return paceSecPerKm;
}
function formatPace(paceSecPerKm, unit) {
  if (!paceSecPerKm) return "-";
  const convertedPace = convertPace(paceSecPerKm, unit);
  const mins = Math.floor(convertedPace / 60);
  const secs = Math.round(convertedPace % 60);
  const paceUnit = unit === "mi" ? "/mi" : "/km";
  return `${mins}:${secs.toString().padStart(2, "0")}${paceUnit}`;
}
function getUnitLabel(unit) {
  return unit;
}
function getPaceUnitLabel(unit) {
  return unit === "mi" ? "/mi" : "/km";
}

export {
  kmToMiles,
  milesToKm,
  convertDistance,
  formatDistance,
  formatDistanceFromMeters,
  convertPace,
  formatPace,
  getUnitLabel,
  getPaceUnitLabel
};
//# sourceMappingURL=chunk-POJFB5KI.mjs.map