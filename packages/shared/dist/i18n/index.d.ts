declare const locales: readonly ["nl", "en"];
type Locale = (typeof locales)[number];
declare const defaultLocale: Locale;
declare const localeNames: Record<Locale, string>;

export { type Locale, defaultLocale, localeNames, locales };
