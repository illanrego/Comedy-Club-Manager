export interface GoogleCalendarEventTime {
  date?: string
  dateTime?: string
}

export interface GoogleCalendarApiEvent {
  id?: string
  status?: string
  summary?: string | null
  start?: GoogleCalendarEventTime
}

export interface GoogleCalendarPreviewEvent {
  googleEventId: string
  summary: string
  startDate: string
  startTime: string | null
}

export function extractGoogleEventDateTime(start?: GoogleCalendarEventTime): {
  startDate: string
  startTime: string | null
} | null {
  if (!start) {
    return null
  }

  if (start.date) {
    return {
      startDate: start.date,
      startTime: null,
    }
  }

  if (!start.dateTime) {
    return null
  }

  const match = start.dateTime.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  if (match) {
    return {
      startDate: match[1],
      startTime: match[2],
    }
  }

  const parsed = new Date(start.dateTime)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const iso = parsed.toISOString()
  return {
    startDate: iso.slice(0, 10),
    startTime: iso.slice(11, 16),
  }
}

export function mapGoogleEventToPreview(event: GoogleCalendarApiEvent): GoogleCalendarPreviewEvent | null {
  if (!event.id || event.status === 'cancelled') {
    return null
  }

  const extracted = extractGoogleEventDateTime(event.start)
  if (!extracted) {
    return null
  }

  return {
    googleEventId: event.id,
    summary: event.summary?.trim() || 'Evento sem titulo',
    startDate: extracted.startDate,
    startTime: extracted.startTime,
  }
}
