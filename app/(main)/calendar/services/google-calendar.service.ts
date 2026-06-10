import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import {
  googleCalendarConnectionsTable,
  showsTable,
  type SelectGoogleCalendarConnection,
} from '@/db/schema'
import {
  googleCalendarCrypto,
  listGoogleCalendars,
  listGoogleCalendarEvents,
  refreshGoogleCalendarAccessToken,
  type GoogleCalendarOption,
} from '@/lib/google-calendar'
import { mapGoogleEventToPreview, type GoogleCalendarPreviewEvent } from '@/lib/google-calendar-utils'

const GOOGLE_PROVIDER = 'google_calendar'

export interface GoogleCalendarConnectionState {
  connected: boolean
  calendars: GoogleCalendarOption[]
  selectedCalendarId: string | null
  selectedCalendarName: string | null
}

export interface GoogleCalendarImportPreviewRow extends GoogleCalendarPreviewEvent {
  status: 'new' | 'update'
  existingShowId: number | null
}

function getRangeBounds(dateFrom: string, dateTo: string) {
  return {
    timeMin: `${dateFrom}T00:00:00Z`,
    timeMax: `${dateTo}T23:59:59Z`,
  }
}

async function getConnection(): Promise<SelectGoogleCalendarConnection | null> {
  const [connection] = await db
    .select()
    .from(googleCalendarConnectionsTable)
    .where(eq(googleCalendarConnectionsTable.provider, GOOGLE_PROVIDER))
    .limit(1)

  return connection ?? null
}

export async function upsertGoogleCalendarConnection(input: {
  accessToken: string
  refreshToken?: string
  tokenExpiresAt: Date | null
  connectedByUserId: string
}) {
  const existing = await getConnection()
  const encryptedAccessToken = googleCalendarCrypto.encrypt(input.accessToken)
  const encryptedRefreshToken = input.refreshToken ? googleCalendarCrypto.encrypt(input.refreshToken) : null

  if (existing) {
    const [updated] = await db
      .update(googleCalendarConnectionsTable)
      .set({
        encryptedAccessToken,
        encryptedRefreshToken: encryptedRefreshToken ?? existing.encryptedRefreshToken,
        tokenExpiresAt: input.tokenExpiresAt,
        connectedByUserId: input.connectedByUserId,
        updatedAt: new Date(),
      })
      .where(eq(googleCalendarConnectionsTable.id, existing.id))
      .returning()

    return updated
  }

  const [created] = await db
    .insert(googleCalendarConnectionsTable)
    .values({
      provider: GOOGLE_PROVIDER,
      encryptedAccessToken,
      encryptedRefreshToken,
      tokenExpiresAt: input.tokenExpiresAt,
      connectedByUserId: input.connectedByUserId,
    })
    .returning()

  return created
}

async function getValidAccessToken() {
  const connection = await getConnection()
  if (!connection) {
    throw new Error('Google Calendar is not connected')
  }

  const hasValidToken =
    connection.tokenExpiresAt && connection.tokenExpiresAt.getTime() > Date.now() + 60_000

  if (hasValidToken) {
    return {
      connection,
      accessToken: googleCalendarCrypto.decrypt(connection.encryptedAccessToken),
    }
  }

  if (!connection.encryptedRefreshToken) {
    throw new Error('Google Calendar connection is missing a refresh token')
  }

  const refreshed = await refreshGoogleCalendarAccessToken(
    googleCalendarCrypto.decrypt(connection.encryptedRefreshToken)
  )

  const [updatedConnection] = await db
    .update(googleCalendarConnectionsTable)
    .set({
      encryptedAccessToken: googleCalendarCrypto.encrypt(refreshed.accessToken),
      tokenExpiresAt: refreshed.tokenExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(googleCalendarConnectionsTable.id, connection.id))
    .returning()

  return {
    connection: updatedConnection,
    accessToken: refreshed.accessToken,
  }
}

export async function getGoogleCalendarConnectionState(): Promise<GoogleCalendarConnectionState> {
  const connection = await getConnection()
  if (!connection) {
    return {
      connected: false,
      calendars: [],
      selectedCalendarId: null,
      selectedCalendarName: null,
    }
  }

  const { accessToken } = await getValidAccessToken()
  const calendars = await listGoogleCalendars(accessToken)

  return {
    connected: true,
    calendars,
    selectedCalendarId: connection.googleCalendarId,
    selectedCalendarName: connection.googleCalendarName,
  }
}

export async function previewGoogleCalendarImport(
  calendarId: string,
  dateFrom: string,
  dateTo: string
): Promise<GoogleCalendarImportPreviewRow[]> {
  const { accessToken } = await getValidAccessToken()
  const { timeMin, timeMax } = getRangeBounds(dateFrom, dateTo)
  const events = await listGoogleCalendarEvents(accessToken, calendarId, timeMin, timeMax)
  const previews = events
    .map(mapGoogleEventToPreview)
    .filter((event): event is GoogleCalendarPreviewEvent => event !== null)

  const eventIds = previews.map((event) => event.googleEventId)
  const existingShows =
    eventIds.length > 0
      ? await db
          .select({
            id: showsTable.id,
            googleEventId: showsTable.googleEventId,
          })
          .from(showsTable)
          .where(inArray(showsTable.googleEventId, eventIds))
      : []

  const existingByGoogleId = new Map(
    existingShows
      .filter((show): show is { id: number; googleEventId: string } => Boolean(show.googleEventId))
      .map((show) => [show.googleEventId, show.id])
  )

  return previews.map((event) => {
    const existingShowId = existingByGoogleId.get(event.googleEventId) ?? null
    return {
      ...event,
      status: existingShowId ? 'update' : 'new',
      existingShowId,
    }
  })
}

export async function importGoogleCalendarEvents(input: {
  calendarId: string
  calendarName: string | null
  dateFrom: string
  dateTo: string
  selectedEventIds: string[]
}) {
  const { connection, accessToken } = await getValidAccessToken()
  const { timeMin, timeMax } = getRangeBounds(input.dateFrom, input.dateTo)
  const events = await listGoogleCalendarEvents(accessToken, input.calendarId, timeMin, timeMax)
  const selectedEvents = events
    .map(mapGoogleEventToPreview)
    .filter((event): event is GoogleCalendarPreviewEvent => event !== null)
    .filter((event) => input.selectedEventIds.includes(event.googleEventId))

  if (selectedEvents.length === 0) {
    return {
      created: 0,
      updated: 0,
    }
  }

  const eventIds = selectedEvents.map((event) => event.googleEventId)
  const existingShows = await db
    .select({
      id: showsTable.id,
      googleEventId: showsTable.googleEventId,
      importedAt: showsTable.importedAt,
    })
    .from(showsTable)
    .where(inArray(showsTable.googleEventId, eventIds))

  const existingByGoogleId = new Map(
    existingShows
      .filter((show): show is { id: number; googleEventId: string; importedAt: Date | null } => Boolean(show.googleEventId))
      .map((show) => [show.googleEventId, show])
  )

  let created = 0
  let updated = 0
  const now = new Date()

  await db.transaction(async (tx) => {
    for (const event of selectedEvents) {
      const existingShow = existingByGoogleId.get(event.googleEventId)

      if (existingShow) {
        await tx
          .update(showsTable)
          .set({
            date: event.startDate,
            startTime: event.startTime,
            showName: event.summary,
            source: 'google_calendar',
            googleEventId: event.googleEventId,
            importedAt: existingShow.importedAt ?? now,
            lastGoogleSyncAt: now,
          })
          .where(eq(showsTable.id, existingShow.id))

        updated += 1
      } else {
        await tx.insert(showsTable).values({
          date: event.startDate,
          startTime: event.startTime,
          showName: event.summary,
          source: 'google_calendar',
          googleEventId: event.googleEventId,
          importedAt: now,
          lastGoogleSyncAt: now,
        })

        created += 1
      }
    }

    await tx
      .update(googleCalendarConnectionsTable)
      .set({
        googleCalendarId: input.calendarId,
        googleCalendarName: input.calendarName,
        updatedAt: now,
      })
      .where(
        and(
          eq(googleCalendarConnectionsTable.id, connection.id),
          eq(googleCalendarConnectionsTable.provider, GOOGLE_PROVIDER)
        )
      )
  })

  return {
    created,
    updated,
  }
}
