import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

export default getRequestConfig(async () => {
  // Get locale from cookie, fallback to default
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  
  // Validate that the cookie value is a valid locale
  const locale: Locale = cookieLocale && locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : defaultLocale

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  }
})

