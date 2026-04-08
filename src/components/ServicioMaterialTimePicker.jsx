import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker'

dayjs.locale('es')

function hhmmToDayjs(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') {
    return dayjs().hour(9).minute(0).second(0).millisecond(0)
  }
  const parts = hhmm.split(':')
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1] ?? '0', 10)
  if (Number.isNaN(h)) {
    return dayjs().hour(9).minute(0).second(0).millisecond(0)
  }
  return dayjs()
    .hour(h)
    .minute(Number.isNaN(m) ? 0 : m)
    .second(0)
    .millisecond(0)
}

function formatoMostrar24h(hhmm) {
  if (!hhmm || !String(hhmm).trim()) return ''
  const d = hhmmToDayjs(hhmm)
  return d.format('HH:mm')
}

const pickersLocaleText = {
  cancelButtonLabel: 'Cancelar',
  okButtonLabel: 'Aceptar',
  clearButtonLabel: 'Borrar',
  todayButtonLabel: 'Hoy'
}

export default function ServicioMaterialTimePicker({
  value,
  onChange,
  disabled,
  labelStyle,
  wrapStyle,
  triggerStyle
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(() => hhmmToDayjs(value))

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          primary: { main: '#7c3aed' },
          secondary: { main: '#16a34a' }
        },
        shape: { borderRadius: 12 }
      }),
    []
  )

  useEffect(() => {
    if (open) setDraft(hhmmToDayjs(value))
  }, [open, value])

  const mostrar = formatoMostrar24h(value)

  return (
    <>
      <label style={wrapStyle}>
        <span style={labelStyle}>Hora</span>
        <button
          type="button"
          disabled={disabled}
          aria-label="Abrir selector de hora con reloj"
          onClick={() => setOpen(true)}
          style={{
            ...triggerStyle,
            ...(disabled ? { opacity: 0.65 } : {})
          }}
        >
          <span>{mostrar || 'Elegir hora'}</span>
          <span style={{ opacity: 0.65, fontSize: '1rem' }} aria-hidden>
            🕐
          </span>
        </button>
      </label>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, overflow: 'hidden' }
          }
        }}
      >
        <ThemeProvider theme={theme}>
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="es"
            localeText={pickersLocaleText}
          >
            <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
              <StaticTimePicker
                value={draft}
                onChange={(v) => v && setDraft(v)}
                ampm
                displayStaticWrapperAs="mobile"
                slotProps={{
                  actionBar: { actions: [] }
                }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
              <Button
                onClick={() => setOpen(false)}
                color="inherit"
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (draft) onChange(draft.format('HH:mm'))
                  setOpen(false)
                }}
                variant="contained"
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Aceptar
              </Button>
            </DialogActions>
          </LocalizationProvider>
        </ThemeProvider>
      </Dialog>
    </>
  )
}
