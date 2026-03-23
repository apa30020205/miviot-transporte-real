import { useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

const initialEvents = [
  {
    title: 'Prado 12 - Recursos Humanos',
    start: '2026-03-23T11:30:00',
    end: '2026-03-23T14:30:00',
    status: 'Pendiente',
    vehicle: 'Prado 12'
  },
  {
    title: 'Hilux 8 - Finanzas',
    start: '2026-03-23T09:00:00',
    end: '2026-03-23T11:00:00',
    status: 'Aprobado',
    vehicle: 'Hilux 8'
  },
  {
    title: 'Prado 5 - Compras',
    start: '2026-03-24T08:00:00',
    end: '2026-03-24T10:00:00',
    status: 'Urgente',
    vehicle: 'Prado 5'
  }
]

export default function App() {
  const calendarRef = useRef(null)

  const [events] = useState(initialEvents)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)

  const getColor = (status) => {
    if (status === 'Aprobado') return '#16a34a'
    if (status === 'Pendiente') return '#f59e0b'
    if (status === 'Urgente') return '#dc2626'
  }

  return (
    <div style={layout}>

      {/* SIDEBAR */}
      <div style={sidebar}>
        <h2 style={logo}>MIVIOT</h2>
        <p style={activeItem}>Transporte</p>
        <p style={sidebarItem}>Dashboard</p>
        <p style={sidebarItem}>Reportes</p>
        <p style={sidebarItem}>Configuración</p>
      </div>

      {/* MAIN */}
      <div style={main}>
        <header style={headerBlock}>
          <h1 style={title}>Centro de Control de Transporte</h1>
          <p style={subtitle}>Gestión operativa en tiempo real</p>
        </header>

        {/* KPIs */}
        <div style={cards}>
          <Card title="Vehículos disponibles" value="5" />
          <Card title="En servicio" value="3" />
          <Card title="Servicios hoy" value="8" />
          <Card title="Choferes activos" value="6" />
        </div>

        {/* CONTROLES */}
        <div style={controls}>
          <h3 style={dateTitle}>
            {currentDate.toLocaleDateString('es-ES', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </h3>
        </div>

        {/* CALENDARIO */}
        <div style={calendarBox}>
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            editable
            selectable
            nowIndicator
            events={events.map(e => ({
              ...e,
              backgroundColor: getColor(e.status),
              borderColor: getColor(e.status)
            }))}

            datesSet={(arg) => setCurrentDate(arg.start)}

            eventClick={(info) => setSelectedEvent(info.event)}
          />
        </div>

        {/* MODAL */}
        {selectedEvent && (
          <div style={overlay} onClick={() => setSelectedEvent(null)}>
            <div style={modal} onClick={(e) => e.stopPropagation()}>
              <h2>{selectedEvent.title}</h2>
              <p>Inicio: {selectedEvent.start.toLocaleString()}</p>
              <p>Fin: {selectedEvent.end.toLocaleString()}</p>
              <button style={btnPrimary} onClick={() => setSelectedEvent(null)}>
                Cerrar
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ESTILO GLOBAL FULLCALENDAR + KPI */}
      <style>{`
        .kpi-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow:
            0 4px 6px -1px rgba(15, 23, 42, 0.06),
            0 24px 48px -16px rgba(15, 23, 42, 0.18) !important;
        }
        .fc-day-today {
          background-color: #e0f2fe !important;
        }

        .fc-day {
          transition: background 0.2s;
        }

        .fc-day:hover {
          background-color: #f1f5f9;
        }
      `}</style>

    </div>
  )
}

/* COMPONENTE KPI */
function Card({ title, value }) {
  return (
    <div className="kpi-card" style={card}>
      <p style={cardNumber}>{value}</p>
      <p style={cardText}>{title}</p>
    </div>
  )
}

/* ESTILOS */

const font =
  '"Plus Jakarta Sans", "Segoe UI", system-ui, -apple-system, sans-serif'

const layout = {
  display: 'flex',
  fontFamily: font,
  textAlign: 'left'
}

const sidebar = {
  width: 220,
  fontFamily: font,
  background: '#1e293b',
  color: 'white',
  padding: 24,
  height: '100vh',
  boxSizing: 'border-box'
}

const logo = {
  marginBottom: 20,
  fontFamily: font,
  fontWeight: 700,
  letterSpacing: '0.06em',
  fontSize: 18
}

const sidebarItem = { marginTop: 12, opacity: 0.7 }
const activeItem = { marginTop: 12, fontWeight: 'bold' }

const main = {
  flex: 1,
  padding: '36px 32px',
  background:
    'linear-gradient(165deg, #eef2f7 0%, #e8edf4 45%, #f1f5f9 100%)',
  minWidth: 0
}

const headerBlock = {
  margin: '0 auto 28px',
  textAlign: 'center',
  maxWidth: 720
}

const title = {
  fontSize: 'clamp(1.65rem, 2.5vw, 2.125rem)',
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: '-0.035em',
  margin: 0,
  marginBottom: 10,
  color: '#0f172a'
}

const subtitle = {
  margin: 0,
  marginBottom: 0,
  fontSize: 15,
  fontWeight: 500,
  letterSpacing: '0.01em',
  color: '#64748b',
  lineHeight: 1.5
}

const cards = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 20,
  marginBottom: 32
}

const card = {
  background: 'rgba(255, 255, 255, 0.92)',
  padding: '26px 24px',
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.22)',
  boxShadow:
    '0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 16px 36px -12px rgba(15, 23, 42, 0.14)',
  minWidth: 0,
  textAlign: 'center',
  backdropFilter: 'blur(8px)'
}

const cardNumber = {
  fontSize: 34,
  fontWeight: 700,
  letterSpacing: '-0.03em',
  margin: 0,
  marginBottom: 8,
  color: '#0f172a',
  lineHeight: 1
}

const cardText = {
  margin: 0,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#475569',
  lineHeight: 1.35
}

const controls = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  marginBottom: 15
}

const dateTitle = {
  fontWeight: 600,
  fontSize: 15,
  letterSpacing: '0.02em',
  color: '#334155'
}

const calendarBox = {
  background: 'rgba(255, 255, 255, 0.95)',
  padding: 24,
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.2)',
  boxShadow:
    '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 20px 40px -14px rgba(15, 23, 42, 0.12)',
  backdropFilter: 'blur(8px)'
}

const overlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999
}

const modal = {
  background: 'white',
  padding: 25,
  borderRadius: 10,
  width: 300,
  textAlign: 'center'
}

const btnPrimary = {
  marginTop: 15,
  padding: 10,
  background: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: 6
}