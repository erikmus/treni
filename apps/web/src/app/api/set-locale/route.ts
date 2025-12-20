import { NextRequest, NextResponse } from 'next/server'
import { locales, type Locale } from '@/i18n/config'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const locale = searchParams.get('locale') as Locale
  const redirectTo = searchParams.get('redirect') || '/'

  // Validate locale
  if (!locale || !locales.includes(locale)) {
    return NextResponse.json(
      { error: 'Invalid locale. Use: ' + locales.join(', ') },
      { status: 400 }
    )
  }

  // Create response with redirect
  const response = NextResponse.redirect(new URL(redirectTo, request.url))
  
  // Set the locale cookie (1 year expiry)
  response.cookies.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  return response
}

