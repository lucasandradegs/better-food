import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const returnTo = requestUrl.searchParams.get('returnTo')

    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      await supabase.auth.exchangeCodeForSession(code)
    }

    const redirectUrl =
      returnTo && returnTo !== '/login'
        ? `${requestUrl.origin}${returnTo}`
        : `${requestUrl.origin}/inicio`

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Erro no callback:', error)
    return NextResponse.redirect(
      `${new URL(request.url).origin}/login?error=auth`,
    )
  }
}
