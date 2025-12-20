import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { locales, type Locale } from './config'

/**
 * Detects the preferred locale from the Accept-Language header.
 * Returns 'nl' if Dutch is preferred, otherwise 'en' as fallback.
 */
function detectLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return 'en'
  
  // Parse Accept-Language header (e.g., "nl-NL,nl;q=0.9,en;q=0.8")
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, qValue] = lang.trim().split(';q=')
      return {
        code: code.split('-')[0].toLowerCase(), // Get primary language code
        quality: qValue ? parseFloat(qValue) : 1.0
      }
    })
    .sort((a, b) => b.quality - a.quality)
  
  // Check if Dutch is in the preferred languages
  for (const lang of languages) {
    if (lang.code === 'nl') return 'nl'
    if (lang.code === 'en') return 'en'
  }
  
  // Default to English for all other languages
  return 'en'
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()
  
  // 1. First check if user has explicitly set a locale via cookie
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  
  let locale: Locale
  
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    // User has explicitly chosen a locale
    locale = cookieLocale as Locale
  } else {
    // No cookie set - detect from browser's Accept-Language header
    const acceptLanguage = headerStore.get('accept-language')
    locale = detectLocaleFromHeader(acceptLanguage)
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  }
})

