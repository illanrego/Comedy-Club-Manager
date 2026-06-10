import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { buildGoogleCalendarAuthUrl } from '@/lib/google-calendar'

const STATE_COOKIE = 'google_calendar_oauth_state'

export async function GET(request: Request) {
  const { user } = await getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin?callbackUrl=/calendar', request.url))
  }

  const state = randomBytes(24).toString('hex')
  const redirectUri = new URL('/api/google-calendar/callback', request.url).toString()
  const googleUrl = buildGoogleCalendarAuthUrl(redirectUri, state)
  const response = NextResponse.redirect(googleUrl)

  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  })

  return response
}
