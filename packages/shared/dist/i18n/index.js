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

// src/i18n/index.ts
var i18n_exports = {};
__export(i18n_exports, {
  defaultLocale: () => defaultLocale,
  localeNames: () => localeNames,
  locales: () => locales
});
module.exports = __toCommonJS(i18n_exports);

// src/i18n/config.ts
var locales = ["nl", "en"];
var defaultLocale = "nl";
var localeNames = {
  nl: "Nederlands",
  en: "English"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  defaultLocale,
  localeNames,
  locales
});
//# sourceMappingURL=index.js.map