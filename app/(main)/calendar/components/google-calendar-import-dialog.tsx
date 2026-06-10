'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarSync, Link as LinkIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  applyGoogleCalendarImportAction,
  getGoogleCalendarState,
  previewGoogleCalendarImportAction,
} from '../actions/google-calendar.action'

interface GoogleCalendarOption {
  id: string
  summary: string
  primary?: boolean
}

interface GoogleCalendarPreviewRow {
  googleEventId: string
  summary: string
  startDate: string
  startTime: string | null
  status: 'new' | 'update'
  existingShowId: number | null
}

interface GoogleCalendarImportDialogProps {
  onImported?: () => Promise<void> | void
}

function getDefaultRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const endDate = new Date(year, month + 1, 0)
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

  return { start, end }
}

export function GoogleCalendarImportDialog({ onImported }: GoogleCalendarImportDialogProps) {
  const defaultRange = useMemo(() => getDefaultRange(), [])
  const [open, setOpen] = useState(false)
  const [loadingState, setLoadingState] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [calendars, setCalendars] = useState<GoogleCalendarOption[]>([])
  const [selectedCalendarId, setSelectedCalendarId] = useState('')
  const [dateFrom, setDateFrom] = useState(defaultRange.start)
  const [dateTo, setDateTo] = useState(defaultRange.end)
  const [previewRows, setPreviewRows] = useState<GoogleCalendarPreviewRow[]>([])
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const loadState = async () => {
      setLoadingState(true)
      setError(null)

      try {
        const state = await getGoogleCalendarState()
        setConnected(state.connected)
        setCalendars(state.calendars)
        setSelectedCalendarId(state.selectedCalendarId || state.calendars[0]?.id || '')
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load Google Calendar state')
      } finally {
        setLoadingState(false)
      }
    }

    void loadState()
  }, [open])

  const handlePreview = async () => {
    setPreviewLoading(true)
    setError(null)
    setMessage(null)

    const result = await previewGoogleCalendarImportAction({
      calendarId: selectedCalendarId,
      dateFrom,
      dateTo,
    })

    if (!result.success) {
      setError(result.error ?? 'Failed to preview Google Calendar events')
      setPreviewRows([])
      setSelectedEventIds([])
      setPreviewLoading(false)
      return
    }

    const rows = result.data ?? []
    setPreviewRows(rows)
    setSelectedEventIds(rows.map((row) => row.googleEventId))
    setPreviewLoading(false)
  }

  const toggleEvent = (googleEventId: string, checked: boolean) => {
    setSelectedEventIds((current) =>
      checked
        ? [...current, googleEventId]
        : current.filter((id) => id !== googleEventId)
    )
  }

  const handleImport = async () => {
    const selectedCalendar = calendars.find((calendar) => calendar.id === selectedCalendarId) || null
    setImportLoading(true)
    setError(null)
    setMessage(null)

    const result = await applyGoogleCalendarImportAction({
      calendarId: selectedCalendarId,
      calendarName: selectedCalendar?.summary ?? null,
      dateFrom,
      dateTo,
      selectedEventIds,
    })

    if (!result.success) {
      setError(result.error ?? 'Failed to import Google Calendar events')
      setImportLoading(false)
      return
    }

    const importResult = result.data ?? { created: 0, updated: 0 }
    setMessage(`${importResult.created} criados, ${importResult.updated} atualizados`)
    setPreviewRows([])
    setSelectedEventIds([])
    await onImported?.()
    setImportLoading(false)
    setOpen(false)
  }

  const allSelected = previewRows.length > 0 && selectedEventIds.length === previewRows.length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarSync className="h-4 w-4" />
          Importar Google Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar Google Calendar</DialogTitle>
          <DialogDescription>
            Conecte um calendario Google compartilhado, revise os eventos e importe apenas o que fizer sentido.
          </DialogDescription>
        </DialogHeader>

        {loadingState ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando integracao...
          </div>
        ) : !connected ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Nenhuma conta Google conectada ainda. A conexao usa permissao somente leitura do Google Calendar.
            </p>
            <Button asChild className="gap-2">
              <a href="/api/google-calendar/connect">
                <LinkIcon className="h-4 w-4" />
                Conectar Google Calendar
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="google-calendar-select">Calendario</Label>
                <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
                  <SelectTrigger id="google-calendar-select">
                    <SelectValue placeholder="Selecione um calendario" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.map((calendar) => (
                      <SelectItem key={calendar.id} value={calendar.id}>
                        {calendar.summary}
                        {calendar.primary ? ' (principal)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-date-from">Data inicial</Label>
                <Input
                  id="google-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-date-to">Data final</Label>
                <Input
                  id="google-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handlePreview}
                disabled={!selectedCalendarId || previewLoading}
              >
                {previewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buscar eventos
              </Button>
              {previewRows.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {previewRows.length} evento(s) encontrados
                </span>
              )}
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                {message}
              </div>
            )}

            {previewRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all-google-events"
                      checked={allSelected}
                      onCheckedChange={(checked) =>
                        setSelectedEventIds(checked ? previewRows.map((row) => row.googleEventId) : [])
                      }
                    />
                    <Label htmlFor="select-all-google-events">Selecionar todos</Label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {selectedEventIds.length} selecionado(s)
                  </span>
                </div>

                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {previewRows.map((row) => {
                    const checked = selectedEventIds.includes(row.googleEventId)
                    return (
                      <label
                        key={row.googleEventId}
                        className="flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleEvent(row.googleEventId, value === true)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{row.summary}</span>
                            <Badge variant={row.status === 'new' ? 'default' : 'secondary'}>
                              {row.status === 'new' ? 'Novo' : 'Atualizar'}
                            </Badge>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {row.startDate}
                            {row.startTime ? ` às ${row.startTime}` : ' (dia inteiro)'}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          {connected && previewRows.length > 0 && (
            <Button
              type="button"
              onClick={handleImport}
              disabled={selectedEventIds.length === 0 || importLoading}
            >
              {importLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar selecionados
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
