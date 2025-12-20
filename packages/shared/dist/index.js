"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  convertDistance: () => convertDistance,
  convertPace: () => convertPace,
  defaultLocale: () => defaultLocale,
  formatDistance: () => formatDistance,
  formatDistanceFromMeters: () => formatDistanceFromMeters,
  formatPace: () => formatPace,
  getPaceUnitLabel: () => getPaceUnitLabel,
  getUnitLabel: () => getUnitLabel,
  kmToMiles: () => kmToMiles,
  localeNames: () => localeNames,
  locales: () => locales,
  milesToKm: () => milesToKm
});
module.exports = __toCommonJS(src_exports);

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

// src/i18n/config.ts
var locales = ["nl", "en"];
var defaultLocale = "nl";
var localeNames = {
  nl: "Nederlands",
  en: "English"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  convertDistance,
  convertPace,
  defaultLocale,
  formatDistance,
  formatDistanceFromMeters,
  formatPace,
  getPaceUnitLabel,
  getUnitLabel,
  kmToMiles,
  localeNames,
  locales,
  milesToKm
});
//# sourceMappingURL=index.js.map