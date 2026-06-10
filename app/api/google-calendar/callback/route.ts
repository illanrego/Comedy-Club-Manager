import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { exchangeGoogleCalendarCode } from '@/lib/google-calendar'
import { upsertGoogleCalendarConnection } from '@/app/(main)/calendar/services/google-calendar.service'

const STATE_COOKIE = 'google_calendar_oauth_state'

function redirectWithError(request: NextRequest, message: string) {
  const url = new URL('/calendar', request.url)
  url.searchParams.set('googleCalendarError', message)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const { user } = await getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin?callbackUrl=/calendar', request.url))
  }

  const state = request.nextUrl.searchParams.get('state')
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')
  const storedState = request.cookies.get(STATE_COOKIE)?.value

  if (error) {
    return redirectWithError(request, error)
  }

  if (!state || !storedState || state !== storedState) {
    return redirectWithError(request, 'invalid_state')
  }

  if (!code) {
    return redirectWithError(request, 'missing_code')
  }

  try {
    const redirectUri = new URL('/api/google-calendar/callback', request.url).toString()
    const tokens = await exchangeGoogleCalendarCode(code, redirectUri)

    await upsertGoogleCalendarConnection({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.tokenExpiresAt,
      connectedByUserId: user.id,
    })

    const response = NextResponse.redirect(new URL('/calendar?googleCalendar=connected', request.url))
    response.cookies.set(STATE_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (callbackError) {
    return redirectWithError(
      request,
      callbackError instanceof Error ? callbackError.message : 'callback_failed'
    )
  }
}
