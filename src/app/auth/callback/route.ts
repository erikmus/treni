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
          .select('locale, avatar_url, full_name')
          .eq('id', user.id)
          .single()
        
        // Sync avatar and name from OAuth provider (Google) if not already set
        const userMetadata = user.user_metadata
        const updates: Record<string, string> = {}
        
        // If user logged in with Google and doesn't have an avatar yet, use Google's
        if (userMetadata?.avatar_url && !profile?.avatar_url) {
          updates.avatar_url = userMetadata.avatar_url
        }
        
        // If user doesn't have a name yet, use Google's
        if (userMetadata?.full_name && !profile?.full_name) {
          updates.full_name = userMetadata.full_name
        }
        
        // Update profile if there are changes
        if (Object.keys(updates).length > 0) {
          await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', user.id)
        }
        
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

