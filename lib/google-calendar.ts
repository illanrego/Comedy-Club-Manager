import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_API_BASE_URL = 'https://www.googleapis.com/calendar/v3'

interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  error?: string
  error_description?: string
}

interface GoogleCalendarListResponse<T> {
  items?: T[]
  nextPageToken?: string
  error?: {
    message?: string
  }
}

export interface GoogleCalendarTokens {
  accessToken: string
  refreshToken?: string
  tokenExpiresAt: Date | null
}

export interface GoogleCalendarOption {
  id: string
  summary: string
  primary?: boolean
}

export interface GoogleCalendarApiEvent {
  id?: string
  status?: string
  summary?: string | null
  start?: {
    date?: string
    dateTime?: string
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getEncryptionKey(): Buffer {
  const secret = getRequiredEnv('GOOGLE_CALENDAR_ENCRYPTION_KEY')
  return createHash('sha256').update(secret).digest()
}

function encodeToken(value: string): string {
  const iv = randomBytes(12)
  const key = getEncryptionKey()
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

function decodeToken(value: string): string {
  const raw = Buffer.from(value, 'base64')
  const iv = raw.subarray(0, 12)
  const authTag = raw.subarray(12, 28)
  const encrypted = raw.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

async function parseGoogleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()
  if (!response.ok) {
    const message =
      data?.error_description ||
      data?.error?.message ||
      data?.error ||
      'Google Calendar request failed'
    throw new Error(message)
  }

  return data as T
}

export function buildGoogleCalendarAuthUrl(redirectUri: string, state: string): string {
  const clientId = getRequiredEnv('GOOGLE_CLIENT_ID')
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_CALENDAR_SCOPE,
    state,
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeGoogleCalendarCode(code: string, redirectUri: string): Promise<GoogleCalendarTokens> {
  const body = new URLSearchParams({
    code,
    client_id: getRequiredEnv('GOOGLE_CLIENT_ID'),
    client_secret: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  })

  const data = await parseGoogleResponse<GoogleTokenResponse>(response)
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
  }
}

export async function refreshGoogleCalendarAccessToken(refreshToken: string): Promise<GoogleCalendarTokens> {
  const body = new URLSearchParams({
    client_id: getRequiredEnv('GOOGLE_CLIENT_ID'),
    client_secret: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  })

  const data = await parseGoogleResponse<GoogleTokenResponse>(response)
  return {
    accessToken: data.access_token,
    refreshToken,
    tokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
  }
}

export async function listGoogleCalendars(accessToken: string): Promise<GoogleCalendarOption[]> {
  const response = await fetch(`${GOOGLE_API_BASE_URL}/users/me/calendarList`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })

  const data = await parseGoogleResponse<GoogleCalendarListResponse<GoogleCalendarOption>>(response)
  return (data.items || []).map((calendar) => ({
    id: calendar.id,
    summary: calendar.summary,
    primary: calendar.primary,
  }))
}

export async function listGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarApiEvent[]> {
  const events: GoogleCalendarApiEvent[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin,
      timeMax,
      maxResults: '2500',
    })

    if (pageToken) {
      params.set('pageToken', pageToken)
    }

    const response = await fetch(
      `${GOOGLE_API_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      }
    )

    const data = await parseGoogleResponse<GoogleCalendarListResponse<GoogleCalendarApiEvent>>(response)
    events.push(...(data.items || []))
    pageToken = data.nextPageToken
  } while (pageToken)

  return events
}

export const googleCalendarCrypto = {
  encrypt: encodeToken,
  decrypt: decodeToken,
}
