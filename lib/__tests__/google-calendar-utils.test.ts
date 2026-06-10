import { describe, expect, it } from 'vitest'
import { extractGoogleEventDateTime, mapGoogleEventToPreview } from '../google-calendar-utils'

describe('extractGoogleEventDateTime', () => {
  it('maps all-day events to a date with null time', () => {
    expect(extractGoogleEventDateTime({ date: '2026-06-10' })).toEqual({
      startDate: '2026-06-10',
      startTime: null,
    })
  })

  it('preserves the local wall-clock date and time from Google dateTime values', () => {
    expect(extractGoogleEventDateTime({ dateTime: '2026-06-10T20:30:00-03:00' })).toEqual({
      startDate: '2026-06-10',
      startTime: '20:30',
    })
  })
})

describe('mapGoogleEventToPreview', () => {
  it('ignores cancelled events', () => {
    expect(
      mapGoogleEventToPreview({
        id: 'evt_1',
        status: 'cancelled',
        start: { date: '2026-06-10' },
      })
    ).toBeNull()
  })

  it('maps valid events into preview rows', () => {
    expect(
      mapGoogleEventToPreview({
        id: 'evt_2',
        summary: 'Sexta Comedy',
        start: { dateTime: '2026-06-13T21:00:00-03:00' },
      })
    ).toEqual({
      googleEventId: 'evt_2',
      summary: 'Sexta Comedy',
      startDate: '2026-06-13',
      startTime: '21:00',
    })
  })
})
