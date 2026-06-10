'use server'

import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth'
import {
  getGoogleCalendarConnectionState,
  importGoogleCalendarEvents,
  previewGoogleCalendarImport,
} from '../services/google-calendar.service'

function ensureDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} is invalid`)
  }
}

export async function getGoogleCalendarState() {
  const { user } = await getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  return getGoogleCalendarConnectionState()
}

export async function previewGoogleCalendarImportAction(input: {
  calendarId: string
  dateFrom: string
  dateTo: string
}) {
  const { user } = await getUser()
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    }
  }

  try {
    if (!input.calendarId) {
      throw new Error('Calendar is required')
    }

    ensureDate(input.dateFrom, 'Start date')
    ensureDate(input.dateTo, 'End date')

    const preview = await previewGoogleCalendarImport(input.calendarId, input.dateFrom, input.dateTo)
    return {
      success: true,
      data: preview,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preview Google Calendar import',
    }
  }
}

export async function applyGoogleCalendarImportAction(input: {
  calendarId: string
  calendarName: string | null
  dateFrom: string
  dateTo: string
  selectedEventIds: string[]
}) {
  const { user } = await getUser()
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    }
  }

  try {
    if (!input.calendarId) {
      throw new Error('Calendar is required')
    }

    if (input.selectedEventIds.length === 0) {
      throw new Error('Select at least one event to import')
    }

    ensureDate(input.dateFrom, 'Start date')
    ensureDate(input.dateTo, 'End date')

    const result = await importGoogleCalendarEvents(input)
    revalidatePath('/calendar')
    revalidatePath('/')

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import Google Calendar events',
    }
  }
}
