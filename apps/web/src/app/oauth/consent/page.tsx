import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Shield, ExternalLink, Check, X } from 'lucide-react'

interface ConsentPageProps {
  searchParams: Promise<{ authorization_id?: string }>
}

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const params = await searchParams
  const authorizationId = params.authorization_id
  const t = await getTranslations('oauth')

  if (!authorizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('error')}</h1>
          <p className="text-muted-foreground">{t('missingAuthId')}</p>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to login, preserving authorization_id
    redirect(`/login?redirect=/oauth/consent?authorization_id=${authorizationId}`)
  }

  // Get authorization details using the authorization_id
  const { data: authDetails, error } =
    await supabase.auth.oauth.getAuthorizationDetails(authorizationId)

  if (error || !authDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('invalidRequest')}</h1>
          <p className="text-muted-foreground">{error?.message || t('invalidAuthRequest')}</p>
        </div>
      </div>
    )
  }

  // Convert scope string to array (scopes are space-separated in OAuth)
  const scopes = authDetails.scope ? authDetails.scope.split(' ').filter(Boolean) : []

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('authorize', { app: authDetails.client.name })}
          </h1>
          <p className="text-muted-foreground">
            {t('wantsAccess')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          {/* App Info */}
          <div className="mb-6 pb-6 border-b border-border">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-muted-foreground">
                  {authDetails.client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-foreground truncate">
                  {authDetails.client.name}
                </h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate">{authDetails.redirect_url}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Requested Permissions */}
          {scopes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-3">
                {t('requestsPermission')}
              </h3>
              <ul className="space-y-2">
                {scopes.map((scope) => (
                  <li key={scope} className="flex items-center gap-3 text-sm">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      {t.has(`scopes.${scope}` as const) ? t(`scopes.${scope}` as `scopes.${string}`) : scope}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* User Info */}
          <div className="mb-6 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">{t('loggedInAs')}</p>
            <p className="text-sm font-medium text-foreground">{user.email}</p>
          </div>

          {/* Actions */}
          <form action="/api/oauth/decision" method="POST" className="space-y-3">
            <input type="hidden" name="authorization_id" value={authorizationId} />
            
            <button
              type="submit"
              name="decision"
              value="approve"
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {t('allow')}
            </button>
            
            <button
              type="submit"
              name="decision"
              value="deny"
              className="w-full py-3 px-4 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
            >
              {t('deny')}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          {t('consentFooter')}{' '}
          <span className="underline">{t('privacyPolicy')}</span>.
        </p>
      </div>
    </div>
  )
}
