import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Get user's locale preference and set cookie
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('locale')
          .eq('id', user.id)
          .single()
        
        const locale = profile?.locale || 'nl'
        const response = NextResponse.redirect(`${origin}${next}`)
        response.cookies.set('NEXT_LOCALE', locale, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365, // 1 year
        })
        return response
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}

