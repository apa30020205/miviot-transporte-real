import { useEffect, useMemo, useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import {
  fetchVehiculos,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo
} from './api/vehiculos'
import {
  fetchChoferes,
  createChofer,
  updateChofer,
  deleteChofer
} from './api/choferes'
import { fetchServicios, createServicio, deleteServicio } from './api/servicios'
import {
  fetchTalleres,
  createTaller,
  updateTaller,
  deleteTaller
} from './api/taller'

/** datetime-local a veces queda solo con fecha (sin hora) → Date inválido */
function localDateTimeInputToIso(value) {
  if (!value || typeof value !== 'string') return new Date().toISOString()
  const t = value.trim()
  if (!t) return new Date().toISOString()
  const withTime = t.length === 10 ? `${t}T12:00` : t
  const d = new Date(withTime)
  if (Number.isNaN(d.getTime())) return new Date().toISOString()
  return d.toISOString()
}

const navItems = [
  { key: 'transporte', label: 'Cronograma de Transporte' },
  { key: 'reportes', label: 'Reportes' },
  { key: 'taller', label: 'TALLER/VEHÍCULOS' },
  { key: 'choferes', label: 'Choferes' },
  { key: 'configuracion', label: 'Configuración' }
]

export default function App() {
  const calendarRef = useRef(null)

  const [currentRangeLabel, setCurrentRangeLabel] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [activeNav, setActiveNav] = useState('transporte')
  const [hoveredNav, setHoveredNav] = useState(null)

  const activeIndex = Math.max(
    0,
    navItems.findIndex((i) => i.key === activeNav)
  )
  const hoveredIndex = hoveredNav
    ? Math.max(0, navItems.findIndex((i) => i.key === hoveredNav))
    : null
  const indicatorIndex = hoveredIndex ?? activeIndex

  const getColor = (status) => {
    const s = String(status ?? '').toLowerCase()
    if (s.includes('aprob') || s.includes('complet') || s.includes('activ'))
      return '#16a34a'
    if (s.includes('pend')) return '#f59e0b'
    if (s.includes('urg')) return '#dc2626'
    return '#64748b'
  }

  return (
    <div style={layout}>

      {/* SIDEBAR */}
      <div style={sidebar}>
        <div style={brand}>
          <div style={brandMark}>MIVIOT</div>
          <div>
            <div style={brandSub}>Control & Operaciones</div>
          </div>
        </div>

        <nav style={nav}>
          <div
            className="nav-indicator"
            style={{
              ...navIndicator,
              transform: `translateY(${indicatorIndex * (NAV_ITEM_H + NAV_GAP)}px)`
            }}
          />
          {navItems.map((item) => {
            const isActive = item.key === activeNav
            return (
              <div
                key={item.key}
                className={`nav-item${isActive ? ' is-active' : ''}`}
                style={isActive ? navItemActive : navItem}
                onMouseEnter={() => setHoveredNav(item.key)}
                onMouseLeave={() => setHoveredNav(null)}
                onClick={() => setActiveNav(item.key)}
              >
                {item.label}
              </div>
            )
          })}
        </nav>
      </div>

      {/* MAIN */}
      <div style={main}>
        {activeNav === 'reportes' ? (
          <ReportesView active={activeNav === 'reportes'} />
        ) : activeNav === 'taller' ? (
          <TallerVehiculosView active={activeNav === 'taller'} />
        ) : activeNav === 'choferes' ? (
          <ChoferesView active={activeNav === 'choferes'} />
        ) : activeNav === 'configuracion' ? (
          <>
            <header style={headerBlock}>
              <h1 style={title}>Configuración</h1>
              <p style={subtitle}>
                Parámetros demo de identidad visual, usuarios y preferencias
              </p>
            </header>

            <div style={settingsGrid}>
              <div style={settingsCard}>
                <div style={settingsCardTitle}>Logos</div>
                <div style={settingsCardText}>
                  Gestiona archivos visuales para presentaciones y documentos.
                </div>
                <div style={settingsLogoList}>
                  {logoItems.map((logo) => (
                    <div key={logo.id} style={settingsRow}>
                      <div style={settingsBadge}>{logo.type}</div>
                      <div style={settingsRowText}>
                        <div style={settingsRowTitle}>{logo.name}</div>
                        <div style={settingsRowSub}>{logo.spec}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={settingsCard}>
                <div style={settingsCardTitle}>Usuarios (demo)</div>
                <div style={settingsCardText}>
                  Perfiles de acceso para control de transporte.
                </div>
                <div style={settingsUserList}>
                  {demoUsers.map((user) => (
                    <div key={user.id} style={settingsRow}>
                      <div style={settingsAvatar}>{user.initials}</div>
                      <div style={settingsRowText}>
                        <div style={settingsRowTitle}>{user.name}</div>
                        <div style={settingsRowSub}>
                          {user.role} · {user.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={settingsCardWide}>
                <div style={settingsCardTitle}>Preferencias del sistema</div>
                <div style={settingsToggles}>
                  {configItems.map((item) => (
                    <div key={item.id} style={settingsToggleRow}>
                      <div>
                        <div style={settingsRowTitle}>{item.label}</div>
                        <div style={settingsRowSub}>{item.help}</div>
                      </div>
                      <div
                        style={{
                          ...settingsToggle,
                          background: item.enabled
                            ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                            : 'rgba(15, 23, 42, 0.18)'
                        }}
                      >
                        <div
                          style={{
                            ...settingsToggleKnob,
                            transform: item.enabled
                              ? 'translateX(18px)'
                              : 'translateX(0)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <TransporteDashboard
              active={activeNav === 'transporte'}
              calendarRef={calendarRef}
              getColor={getColor}
              currentRangeLabel={currentRangeLabel}
              setCurrentRangeLabel={setCurrentRangeLabel}
              setSelectedEvent={setSelectedEvent}
            />
          </>
        )}

        {/* MODAL */}
        {selectedEvent && (
          <div style={overlay} onClick={() => setSelectedEvent(null)}>
            <div style={modal} onClick={(e) => e.stopPropagation()}>
              <h2>{selectedEvent.title}</h2>
              <p>Inicio: {selectedEvent.start.toLocaleString()}</p>
              <p>Fin: {selectedEvent.end?.toLocaleString?.() ?? '—'}</p>
              {selectedEvent.extendedProps?.servicioId != null && (
                <button
                  type="button"
                  style={{
                    ...btnPrimary,
                    marginRight: 8,
                    background: '#b91c1c'
                  }}
                  onClick={async () => {
                    const id = Number(selectedEvent.extendedProps.servicioId)
                    if (!id || !confirm('¿Eliminar este servicio?')) return
                    try {
                      await deleteServicio(id)
                      setSelectedEvent(null)
                      window.dispatchEvent(new Event('miviot-refresh-transporte'))
                    } catch (e) {
                      alert(e instanceof Error ? e.message : 'Error al eliminar')
                    }
                  }}
                >
                  Eliminar servicio
                </button>
              )}
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

        .nav-item {
          user-select: none;
        }
        .nav-item:hover {
          filter: brightness(1.02);
          transform: translateY(-1px);
        }
        .nav-item {
          cursor: pointer;
        }
        .nav-indicator {
          will-change: transform;
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

function ReportesView({ active }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [reportSearch, setReportSearch] = useState('')
  const [reportAuto, setReportAuto] = useState('Todos')
  const [reportChofer, setReportChofer] = useState('Todos')
  const [reportDept, setReportDept] = useState('Todos')

  useEffect(() => {
    if (!active) return
    let c = false
    async function load() {
      setErr('')
      setLoading(true)
      try {
        const [servicios, talleres, vehiculos, choferes] = await Promise.all([
          fetchServicios(),
          fetchTalleres(),
          fetchVehiculos(),
          fetchChoferes()
        ])
        if (c) return
        const vMap = Object.fromEntries((vehiculos || []).map((v) => [v.id, v]))
        const cMap = Object.fromEntries((choferes || []).map((x) => [x.id, x]))
        const built = []
        for (const s of servicios || []) {
          const v = s.vehiculo ?? vMap[s.vehiculoId]
          const ch = s.chofer ?? cMap[s.choferId]
          built.push({
            id: `srv-${s.id}`,
            departamento: s.origen,
            auto: v?.placa ?? `Vehículo #${s.vehiculoId}`,
            chofer: ch?.nombre ?? `Chofer #${s.choferId}`,
            solicitudes: 1,
            taller: '—',
            kilometraje:
              v?.km_actual != null ? `${Number(v.km_actual).toLocaleString()} km` : '—'
          })
        }
        for (const t of talleres || []) {
          const v = t.vehiculo ?? vMap[t.vehiculoId]
          built.push({
            id: `tal-${t.id}`,
            departamento: 'Taller',
            auto: v?.placa ?? `Vehículo #${t.vehiculoId}`,
            chofer: '—',
            solicitudes: '—',
            taller: t.tipo,
            kilometraje:
              v?.km_actual != null ? `${Number(v.km_actual).toLocaleString()} km` : '—'
          })
        }
        console.log('reportes filas:', built)
        setRows(built)
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : 'Error al cargar reportes')
      } finally {
        if (!c) setLoading(false)
      }
    }
    load()
    return () => {
      c = true
    }
  }, [active])

  const reportAutos = ['Todos', ...new Set(rows.map((r) => r.auto))]
  const reportChoferes = ['Todos', ...new Set(rows.map((r) => r.chofer))]
  const reportDepts = ['Todos', ...new Set(rows.map((r) => r.departamento))]
  const filteredReports = rows.filter((r) => {
    const query = reportSearch.trim().toLowerCase()
    const matchesSearch =
      !query ||
      `${r.departamento} ${r.auto} ${r.chofer} ${r.solicitudes} ${r.taller} ${r.kilometraje}`
        .toLowerCase()
        .includes(query)
    const matchesAuto = reportAuto === 'Todos' || r.auto === reportAuto
    const matchesChofer = reportChofer === 'Todos' || r.chofer === reportChofer
    const matchesDept = reportDept === 'Todos' || r.departamento === reportDept
    return matchesSearch && matchesAuto && matchesChofer && matchesDept
  })

  return (
    <>
      <header style={headerBlock}>
        <h1 style={title}>Reportes</h1>
        <p style={subtitle}>Datos operativos desde la base de datos</p>
      </header>

      <div style={reportPanel}>
        {loading && (
          <p style={{ color: '#64748b', fontWeight: 600 }}>Cargando…</p>
        )}
        {err && (
          <p style={{ color: '#b91c1c', fontWeight: 700 }}>{err}</p>
        )}
        <div style={reportToolbar}>
          <div style={reportFilterBlock}>
            <label style={workshopLabel} htmlFor="report-auto">Auto</label>
            <select
              id="report-auto"
              value={reportAuto}
              onChange={(e) => setReportAuto(e.target.value)}
              style={reportSelect}
            >
              {reportAutos.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div style={reportFilterBlock}>
            <label style={workshopLabel} htmlFor="report-chofer">Chofer</label>
            <select
              id="report-chofer"
              value={reportChofer}
              onChange={(e) => setReportChofer(e.target.value)}
              style={reportSelect}
            >
              {reportChoferes.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div style={reportFilterBlock}>
            <label style={workshopLabel} htmlFor="report-dep">Origen / área</label>
            <select
              id="report-dep"
              value={reportDept}
              onChange={(e) => setReportDept(e.target.value)}
              style={reportSelect}
            >
              {reportDepts.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div style={reportSearchBlock}>
            <label style={workshopLabel} htmlFor="report-search">Búsqueda</label>
            <input
              id="report-search"
              type="text"
              value={reportSearch}
              onChange={(e) => setReportSearch(e.target.value)}
              placeholder="Buscar…"
              style={reportSearchInput}
            />
          </div>
        </div>
        <div style={reportActions}>
          <span style={reportCount}>{filteredReports.length} resultados</span>
        </div>
        <div style={reportTableWrap}>
          <table style={reportTable}>
            <thead>
              <tr>
                <th style={reportTh}>Origen / área</th>
                <th style={reportTh}>Auto</th>
                <th style={reportTh}>Chofer</th>
                <th style={reportTh}>Servicios</th>
                <th style={reportTh}>Taller</th>
                <th style={reportTh}>Kilometraje</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((row) => (
                <tr key={row.id}>
                  <td style={reportTd}>{row.departamento}</td>
                  <td style={reportTd}>{row.auto}</td>
                  <td style={reportTd}>{row.chofer}</td>
                  <td style={reportTd}>{row.solicitudes}</td>
                  <td style={reportTd}>{row.taller}</td>
                  <td style={reportTd}>{row.kilometraje}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function VehiculosCrudPanel({ active }) {
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [vehForm, setVehForm] = useState({
    placa: '',
    modelo: '',
    estado: 'activo',
    km_actual: ''
  })
  const [editingVehId, setEditingVehId] = useState(null)

  async function loadVehiculos() {
    setErr('')
    setLoading(true)
    try {
      const v = await fetchVehiculos()
      setVehiculos(Array.isArray(v) ? v : [])
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al cargar vehículos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!active) return
    loadVehiculos()
  }, [active])

  async function saveVehiculo() {
    setErr('')
    const placa = vehForm.placa.trim()
    const modelo = vehForm.modelo.trim()
    const estado = vehForm.estado.trim()
    if (!placa || !modelo || !estado) {
      setErr(
        'Completa placa, modelo y estado para crear o actualizar un vehículo.'
      )
      return
    }
    try {
      const payload = {
        placa,
        modelo,
        estado,
        km_actual: Number(String(vehForm.km_actual).replace(',', '.')) || 0
      }
      if (editingVehId) {
        await updateVehiculo(editingVehId, payload)
      } else {
        await createVehiculo(payload)
      }
      setVehForm({ placa: '', modelo: '', estado: 'activo', km_actual: '' })
      setEditingVehId(null)
      await loadVehiculos()
      window.dispatchEvent(new Event('miviot-refresh-transporte'))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  async function removeVehiculo(id) {
    if (!confirm('¿Eliminar este vehículo?')) return
    try {
      await deleteVehiculo(id)
      await loadVehiculos()
      window.dispatchEvent(new Event('miviot-refresh-transporte'))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  return (
    <div style={reportPanel}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}
      >
        <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
          Registro de vehículos
        </div>
        {loading && (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
            Cargando...
          </span>
        )}
        {err && (
          <span style={{ fontSize: 12, fontWeight: 800, color: '#b91c1c' }}>
            {err}
          </span>
        )}
        {!loading && !err && (
          <span style={reportCount}>{vehiculos.length} vehículos</span>
        )}
      </div>

      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>
        Placa, modelo y estado obligatorios. Km puede ser 0.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        <input placeholder="Placa *" value={vehForm.placa} onChange={(e) => setVehForm((f) => ({ ...f, placa: e.target.value }))} style={reportSearchInput} />
        <input placeholder="Modelo *" value={vehForm.modelo} onChange={(e) => setVehForm((f) => ({ ...f, modelo: e.target.value }))} style={reportSearchInput} />
        <input placeholder="Estado *" value={vehForm.estado} onChange={(e) => setVehForm((f) => ({ ...f, estado: e.target.value }))} style={reportSearchInput} />
        <input placeholder="Km" value={vehForm.km_actual} onChange={(e) => setVehForm((f) => ({ ...f, km_actual: e.target.value }))} style={reportSearchInput} />
      </div>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <button type="button" style={reportBtnPrimary} onClick={saveVehiculo}>{editingVehId ? 'Actualizar' : 'Crear'}</button>
        <button type="button" style={reportBtnGhost} onClick={() => { setEditingVehId(null); setVehForm({ placa: '', modelo: '', estado: 'activo', km_actual: '' }) }}>Limpiar</button>
      </div>

      <div style={reportTableWrap}>
        <table style={{ ...reportTable, minWidth: 640 }}>
          <thead>
            <tr>
              <th style={reportTh}>Placa</th>
              <th style={reportTh}>Modelo</th>
              <th style={reportTh}>Estado</th>
              <th style={reportTh}>Km actual</th>
              <th style={reportTh} />
            </tr>
          </thead>
          <tbody>
            {!loading && !err && vehiculos.length === 0 ? (
              <tr>
                <td style={reportTd} colSpan={5}>
                  No hay vehículos. Crea uno con el formulario de arriba.
                </td>
              </tr>
            ) : (
              vehiculos.map((v) => (
                <tr key={v.id}>
                  <td style={reportTd}>{v.placa}</td>
                  <td style={reportTd}>{v.modelo}</td>
                  <td style={reportTd}>{v.estado}</td>
                  <td style={reportTd}>{v.km_actual}</td>
                  <td style={reportTd}>
                    <button type="button" style={reportBtnGhost} onClick={() => { setEditingVehId(v.id); setVehForm({ placa: v.placa, modelo: v.modelo, estado: v.estado, km_actual: String(v.km_actual) }) }}>Editar</button>
                    <button type="button" style={{ ...reportBtnGhost, marginLeft: 6 }} onClick={() => removeVehiculo(v.id)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TallerMantenimientoPanel({ active }) {
  const [vehiculos, setVehiculos] = useState([])
  const [talleres, setTalleres] = useState([])
  const [vehiculoId, setVehiculoId] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({
    tipo: 'Mantenimiento',
    fechaIngreso: '',
    fechaSalida: '',
    estado: 'Ingresado',
    costo: '',
    descripcion: ''
  })
  const [editingId, setEditingId] = useState(null)

  async function reload() {
    const [v, t] = await Promise.all([fetchVehiculos(), fetchTalleres()])
    const vArr = Array.isArray(v) ? v : []
    setVehiculos(vArr)
    setTalleres(Array.isArray(t) ? t : [])
    setVehiculoId((prev) => {
      if (prev && vArr.some((x) => String(x.id) === prev)) return prev
      return vArr.length ? String(vArr[0].id) : ''
    })
  }

  useEffect(() => {
    if (!active) return
    let c = false
    ;(async () => {
      setErr('')
      setLoading(true)
      try {
        if (!c) await reload()
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : 'Error')
      } finally {
        if (!c) setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [active])

  useEffect(() => {
    if (!active) return
    const fn = () => {
      reload()
    }
    window.addEventListener('miviot-refresh-transporte', fn)
    return () => window.removeEventListener('miviot-refresh-transporte', fn)
  }, [active])

  const vid = Number(vehiculoId)
  const vehiculo = vehiculos.find((x) => x.id === vid)
  const forVehicle = talleres.filter((t) => t.vehiculoId === vid)
  const last = forVehicle[0]
  const workshopInfo = {
    km: vehiculo ? `${Number(vehiculo.km_actual).toLocaleString()} km` : '—',
    lastMaintenance: last
      ? new Date(last.fechaIngreso).toLocaleString('es-ES')
      : '—',
    lastRepair: last?.descripcion ?? 'Sin registros en BD para este vehículo.'
  }

  async function saveTaller() {
    if (!vid) {
      setErr(
        'No hay vehículo seleccionado. Regístralo en la sección VEHÍCULO (debajo).'
      )
      return
    }
    setErr('')
    const tipo = form.tipo.trim() || 'Mantenimiento'
    const estado = form.estado.trim() || 'Ingresado'
    const descripcion = form.descripcion.trim() || 'Sin descripción'
    try {
      const fechaIn = localDateTimeInputToIso(form.fechaIngreso)
      const fechaOutRaw = form.fechaSalida.trim()
      const fechaOut = fechaOutRaw
        ? localDateTimeInputToIso(form.fechaSalida)
        : null
      const payload = {
        vehiculoId: vid,
        tipo,
        fechaIngreso: fechaIn,
        fechaSalida: fechaOut,
        estado,
        costo: Number(form.costo) || 0,
        descripcion
      }
      if (editingId) {
        await updateTaller(editingId, payload)
      } else {
        await createTaller(payload)
      }
      setForm({
        tipo: 'Mantenimiento',
        fechaIngreso: '',
        fechaSalida: '',
        estado: 'Ingresado',
        costo: '',
        descripcion: ''
      })
      setEditingId(null)
      await reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  async function removeTaller(id) {
    if (!confirm('¿Eliminar este orden de taller?')) return
    try {
      await deleteTaller(id)
      await reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  return (
    <div style={workshopPanel}>
      {loading && <p style={{ color: '#64748b' }}>Cargando…</p>}
      {err && <p style={{ color: '#b91c1c', fontWeight: 700 }}>{err}</p>}
        <div style={workshopRow}>
          <label style={workshopLabel} htmlFor="vehicle">Vehículo</label>
          <select
            id="vehicle"
            value={vehiculoId}
            onChange={(e) => setVehiculoId(e.target.value)}
            style={workshopSelect}
          >
            {vehiculos.map((v) => (
              <option key={v.id} value={String(v.id)}>
                {v.placa} — {v.modelo}
              </option>
            ))}
          </select>
        </div>
        <div style={workshopGrid}>
          <div style={workshopCard}>
            <div style={workshopCardLabel}>Kilómetros</div>
            <div style={workshopCardValue}>{workshopInfo.km}</div>
          </div>
          <div style={workshopCard}>
            <div style={workshopCardLabel}>Último ingreso</div>
            <div style={workshopCardValue}>{workshopInfo.lastMaintenance}</div>
          </div>
          <div style={workshopCardWide}>
            <div style={workshopCardLabel}>Última descripción</div>
            <div style={workshopCardText}>{workshopInfo.lastRepair}</div>
          </div>
        </div>
        <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 800, color: '#0f172a' }}>
            {editingId ? `Editar orden #${editingId}` : 'Nueva orden'}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
            Obligatorios: tipo, estado, ingreso (fecha y hora), costo y descripción. Si solo eliges fecha, se usa mediodía.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <input
              placeholder="Tipo *"
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              style={reportSearchInput}
            />
            <input
              placeholder="Estado *"
              value={form.estado}
              onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
              style={reportSearchInput}
            />
            <input
              type="datetime-local"
              value={form.fechaIngreso}
              onChange={(e) =>
                setForm((f) => ({ ...f, fechaIngreso: e.target.value }))
              }
              style={reportSearchInput}
            />
            <input
              type="datetime-local"
              value={form.fechaSalida}
              onChange={(e) =>
                setForm((f) => ({ ...f, fechaSalida: e.target.value }))
              }
              style={reportSearchInput}
            />
            <input
              placeholder="Costo *"
              value={form.costo}
              onChange={(e) => setForm((f) => ({ ...f, costo: e.target.value }))}
              style={reportSearchInput}
            />
          </div>
          <textarea
            placeholder="Descripción *"
            value={form.descripcion}
            onChange={(e) =>
              setForm((f) => ({ ...f, descripcion: e.target.value }))
            }
            rows={3}
            style={{ ...reportSearchInput, width: '100%', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={reportBtnPrimary} onClick={saveTaller}>
              Guardar
            </button>
            <button
              type="button"
              style={reportBtnGhost}
              onClick={() => {
                setEditingId(null)
                setForm({
                  tipo: 'Mantenimiento',
                  fechaIngreso: '',
                  fechaSalida: '',
                  estado: 'Ingresado',
                  costo: '',
                  descripcion: ''
                })
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Historial</div>
          <div style={reportTableWrap}>
            <table style={{ ...reportTable, minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={reportTh}>Tipo</th>
                  <th style={reportTh}>Ingreso</th>
                  <th style={reportTh}>Estado</th>
                  <th style={reportTh}>Costo</th>
                  <th style={reportTh} />
                </tr>
              </thead>
              <tbody>
                {forVehicle.map((t) => (
                  <tr key={t.id}>
                    <td style={reportTd}>{t.tipo}</td>
                    <td style={reportTd}>
                      {new Date(t.fechaIngreso).toLocaleString('es-ES')}
                    </td>
                    <td style={reportTd}>{t.estado}</td>
                    <td style={reportTd}>{t.costo}</td>
                    <td style={reportTd}>
                      <button
                        type="button"
                        style={reportBtnGhost}
                        onClick={() => {
                          setEditingId(t.id)
                          setForm({
                            tipo: t.tipo,
                            fechaIngreso: t.fechaIngreso
                              ? new Date(t.fechaIngreso).toISOString().slice(0, 16)
                              : '',
                            fechaSalida: t.fechaSalida
                              ? new Date(t.fechaSalida).toISOString().slice(0, 16)
                              : '',
                            estado: t.estado,
                            costo: String(t.costo),
                            descripcion: t.descripcion
                          })
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        style={{ ...reportBtnGhost, marginLeft: 6 }}
                        onClick={() => removeTaller(t.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  )
}

function TallerVehiculosView({ active }) {
  const [tab, setTab] = useState('mantenimiento')

  const tabBar = {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    padding: 6,
    borderRadius: 14,
    background: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    boxShadow:
      '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 12px 28px -12px rgba(15, 23, 42, 0.1)'
  }

  const tabBtnBase = {
    flex: 1,
    height: 42,
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease'
  }

  return (
    <>
      <header style={headerBlock}>
        <h1 style={title}>TALLER / VEHÍCULOS</h1>
        <p style={subtitle}>
          Mantenimiento, reparación y registro de flota
        </p>
      </header>

      <div style={tabBar}>
        <button
          type="button"
          style={{
            ...tabBtnBase,
            ...(tab === 'mantenimiento'
              ? {
                  background: '#16a34a',
                  color: 'white',
                  borderColor: 'rgba(22, 163, 74, 0.5)'
                }
              : {
                  background: 'white',
                  color: '#475569',
                  borderColor: 'rgba(15, 23, 42, 0.12)'
                })
          }}
          onClick={() => setTab('mantenimiento')}
        >
          Mantenimiento/Reparación
        </button>
        <button
          type="button"
          style={{
            ...tabBtnBase,
            ...(tab === 'vehiculo'
              ? {
                  background: '#16a34a',
                  color: 'white',
                  borderColor: 'rgba(22, 163, 74, 0.5)'
                }
              : {
                  background: 'white',
                  color: '#475569',
                  borderColor: 'rgba(15, 23, 42, 0.12)'
                })
          }}
          onClick={() => setTab('vehiculo')}
        >
          Vehículo
        </button>
      </div>

      {tab === 'mantenimiento' && (
        <TallerMantenimientoPanel active={active} />
      )}
      {tab === 'vehiculo' && <VehiculosCrudPanel active={active} />}
    </>
  )
}

function ChoferesView({ active }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState({ nombre: '', licencia: '', estado: '' })

  async function reload() {
    const data = await fetchChoferes()
    const arr = Array.isArray(data) ? data : []
    setList(arr)
    console.log('choferes desde backend:', arr)
    setSelectedId((prev) => {
      if (prev && arr.some((x) => String(x.id) === prev)) return prev
      return arr.length ? String(arr[0].id) : ''
    })
  }

  useEffect(() => {
    if (!active) return
    let c = false
    ;(async () => {
      setErr('')
      setLoading(true)
      try {
        if (!c) await reload()
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : 'Error')
      } finally {
        if (!c) setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [active])

  const selected = list.find((d) => String(d.id) === selectedId)

  useEffect(() => {
    if (selected) {
      setForm({
        nombre: selected.nombre,
        licencia: selected.licencia,
        estado: selected.estado
      })
    } else setForm({ nombre: '', licencia: '', estado: '' })
  }, [selectedId, active, list])

  async function saveChofer() {
    setErr('')
    try {
      if (selectedId) {
        await updateChofer(Number(selectedId), form)
      } else {
        const created = await createChofer(form)
        setSelectedId(String(created.id))
      }
      await reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  async function removeChofer() {
    if (!selectedId) return
    if (!confirm('¿Eliminar este chofer?')) return
    try {
      await deleteChofer(Number(selectedId))
      setSelectedId('')
      await reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  return (
    <>
      <header style={headerBlock}>
        <h1 style={title}>Choferes</h1>
        <p style={subtitle}>Gestión de choferes (nombre, licencia, estado)</p>
      </header>
      <div style={driverPanel}>
        {loading && <p style={{ color: '#64748b' }}>Cargando…</p>}
        {err && <p style={{ color: '#b91c1c', fontWeight: 700 }}>{err}</p>}
        <div style={driverHeader}>
          <div>
            <div style={driverTitle}>Registro</div>
            <div style={driverSubtitle}>Datos almacenados en MySQL</div>
          </div>
          <div style={driverPicker}>
            <label style={workshopLabel} htmlFor="driver">Chofer</label>
            <select
              id="driver"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              style={workshopSelect}
            >
              <option value="">— Nuevo —</option>
              {list.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={driverGrid}>
          <div style={workshopCard}>
            <div style={workshopCardLabel}>Nombre</div>
            <input
              value={form.nombre}
              onChange={(e) =>
                setForm((f) => ({ ...f, nombre: e.target.value }))
              }
              style={workshopSelect}
            />
          </div>
          <div style={workshopCard}>
            <div style={workshopCardLabel}>Licencia</div>
            <input
              value={form.licencia}
              onChange={(e) =>
                setForm((f) => ({ ...f, licencia: e.target.value }))
              }
              style={workshopSelect}
            />
          </div>
          <div style={workshopCard}>
            <div style={workshopCardLabel}>Estado</div>
            <input
              value={form.estado}
              onChange={(e) =>
                setForm((f) => ({ ...f, estado: e.target.value }))
              }
              style={workshopSelect}
            />
          </div>
          <div style={workshopCardWide}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" style={reportBtnPrimary} onClick={saveChofer}>
                Guardar
              </button>
              <button type="button" style={reportBtnGhost} onClick={removeChofer}>
                Eliminar
              </button>
              <button
                type="button"
                style={reportBtnGhost}
                onClick={() => {
                  setSelectedId('')
                  setForm({ nombre: '', licencia: '', estado: '' })
                }}
              >
                Nuevo
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function TransporteDashboard({
  active,
  calendarRef,
  getColor,
  currentRangeLabel,
  setCurrentRangeLabel,
  setSelectedEvent
}) {
  const [vehiculos, setVehiculos] = useState([])
  const [servicios, setServicios] = useState([])
  const [choferes, setChoferes] = useState([])
  const [vehiculosLoading, setVehiculosLoading] = useState(false)
  const [transporteError, setTransporteError] = useState('')
  const [servForm, setServForm] = useState({
    fecha: '',
    origen: '',
    destino: '',
    estado: 'Pendiente',
    vehiculoId: '',
    choferId: ''
  })

  const calendarEvents = useMemo(() => {
    return (servicios || []).map((s) => {
      const start = new Date(s.fecha)
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
      const placa = s.vehiculo?.placa ?? `#${s.vehiculoId}`
      return {
        id: String(s.id),
        title: `${placa}: ${s.origen} → ${s.destino}`,
        start: start.toISOString(),
        end: end.toISOString(),
        status: s.estado,
        extendedProps: { servicioId: s.id }
      }
    })
  }, [servicios])

  async function loadAll() {
    setTransporteError('')
    setVehiculosLoading(true)
    try {
      const [v, s, c] = await Promise.all([
        fetchVehiculos(),
        fetchServicios(),
        fetchChoferes()
      ])
      console.log('dashboard datos:', { vehiculos: v, servicios: s, choferes: c })
      setVehiculos(Array.isArray(v) ? v : [])
      setServicios(Array.isArray(s) ? s : [])
      setChoferes(Array.isArray(c) ? c : [])
    } catch (err) {
      setTransporteError(
        err instanceof Error ? err.message : 'Error al cargar datos'
      )
    } finally {
      setVehiculosLoading(false)
    }
  }

  useEffect(() => {
    if (!active) return
    ;(async () => {
      try {
        await loadAll()
      } catch {
        /* handled in loadAll */
      }
    })()
  }, [active])

  useEffect(() => {
    if (!active) return
    const fn = () => {
      loadAll()
    }
    window.addEventListener('miviot-refresh-transporte', fn)
    return () => window.removeEventListener('miviot-refresh-transporte', fn)
  }, [active])

  useEffect(() => {
    if (!vehiculos.length) return
    setServForm((f) => ({
      ...f,
      vehiculoId: f.vehiculoId || String(vehiculos[0].id)
    }))
  }, [vehiculos])

  useEffect(() => {
    if (!choferes.length) return
    setServForm((f) => ({
      ...f,
      choferId: f.choferId || String(choferes[0].id)
    }))
  }, [choferes])

  const hoy = new Date().toDateString()
  const serviciosHoy = servicios.filter(
    (s) => new Date(s.fecha).toDateString() === hoy
  ).length
  const enServicio = servicios.filter((s) =>
    String(s.estado).toLowerCase().includes('serv')
  ).length
  const disponibles = vehiculos.filter((v) =>
    String(v.estado).toLowerCase().includes('activ')
  ).length

  async function saveServicio() {
    setTransporteError('')
    const origen = servForm.origen.trim()
    const destino = servForm.destino.trim()
    const estado = servForm.estado.trim()
    const vid = Number(servForm.vehiculoId)
    const cid = Number(servForm.choferId)
    if (!origen || !destino || !estado || !vid || !cid) {
      setTransporteError(
        'Servicio: completa origen, destino, estado y elige vehículo y chofer.'
      )
      return
    }
    try {
      const fechaIso = localDateTimeInputToIso(servForm.fecha)
      await createServicio({
        fecha: fechaIso,
        origen,
        destino,
        estado,
        vehiculoId: vid,
        choferId: cid
      })
      setServForm((f) => ({
        fecha: '',
        origen: '',
        destino: '',
        estado: 'Pendiente',
        vehiculoId: f.vehiculoId,
        choferId: f.choferId
      }))
      await loadAll()
    } catch (e) {
      setTransporteError(e instanceof Error ? e.message : 'Error al crear servicio')
    }
  }

  return (
    <>
      <header style={headerBlock}>
        <h1 style={title}>Centro de Control de Transporte</h1>
        <p style={subtitle}>
          Cronograma y servicios. Los vehículos se gestionan en TALLER/VEHÍCULOS.
        </p>
      </header>

      <div style={cards}>
        <Card title="Vehículos (activos)" value={String(disponibles || vehiculos.length)} />
        <Card title="En servicio (aprox.)" value={String(enServicio || 0)} />
        <Card title="Servicios hoy" value={String(serviciosHoy)} />
        <Card title="Choferes" value={String(choferes.length)} />
      </div>

      {transporteError && (
        <p style={{ color: '#b91c1c', fontWeight: 700, marginBottom: 12 }}>{transporteError}</p>
      )}
      {vehiculosLoading && (
        <p style={{ color: '#64748b', marginBottom: 12 }}>Cargando datos del cronograma…</p>
      )}

      <div style={reportPanel}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Nuevo servicio (calendario)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <input type="datetime-local" value={servForm.fecha} onChange={(e) => setServForm((f) => ({ ...f, fecha: e.target.value }))} style={reportSearchInput} />
          <input placeholder="Origen" value={servForm.origen} onChange={(e) => setServForm((f) => ({ ...f, origen: e.target.value }))} style={reportSearchInput} />
          <input placeholder="Destino" value={servForm.destino} onChange={(e) => setServForm((f) => ({ ...f, destino: e.target.value }))} style={reportSearchInput} />
          <input placeholder="Estado servicio" value={servForm.estado} onChange={(e) => setServForm((f) => ({ ...f, estado: e.target.value }))} style={reportSearchInput} />
          <select value={servForm.vehiculoId} onChange={(e) => setServForm((f) => ({ ...f, vehiculoId: e.target.value }))} style={reportSelect}>
            <option value="">Vehículo</option>
            {vehiculos.map((v) => (
              <option key={v.id} value={String(v.id)}>{v.placa}</option>
            ))}
          </select>
          <select value={servForm.choferId} onChange={(e) => setServForm((f) => ({ ...f, choferId: e.target.value }))} style={reportSelect}>
            <option value="">Chofer</option>
            {choferes.map((ch) => (
              <option key={ch.id} value={String(ch.id)}>{ch.nombre}</option>
            ))}
          </select>
        </div>
        <button type="button" style={{ ...reportBtnPrimary, marginTop: 8 }} onClick={saveServicio}>Agregar al calendario</button>
      </div>

      <div style={controls}>
        <h3 style={dateTitle}>{currentRangeLabel}</h3>
      </div>

      <div style={calendarBox}>
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          locale={esLocale}
          firstDay={1}
          initialView="timeGridWeek"
          editable
          selectable
          nowIndicator
          events={calendarEvents.map((e) => ({
            ...e,
            backgroundColor: getColor(e.status),
            borderColor: getColor(e.status)
          }))}
          datesSet={(arg) =>
            setCurrentRangeLabel(formatWeekRange(arg.start, arg.end))
          }
          eventClick={(info) => setSelectedEvent(info.event)}
        />
      </div>
    </>
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
  width: 248,
  fontFamily: font,
  color: 'rgba(255,255,255,0.92)',
  padding: 22,
  height: '100vh',
  boxSizing: 'border-box',
  background: 'linear-gradient(180deg, #0b1220 0%, #0f1a2b 100%)',
  borderRight: '1px solid rgba(255,255,255,0.08)'
}

const brand = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 18
}

const brandMark = {
  padding: '9px 12px',
  borderRadius: 12,
  background: 'rgba(22, 163, 74, 0.18)',
  border: '1px solid rgba(22, 163, 74, 0.38)',
  display: 'inline-flex',
  alignItems: 'center',
  fontWeight: 900,
  letterSpacing: '0.14em',
  fontSize: 12,
  color: 'rgba(255,255,255,0.96)',
  lineHeight: 1
}

const brandSub = {
  marginTop: 4,
  fontSize: 12,
  opacity: 0.72,
  letterSpacing: '0.02em'
}

const NAV_ITEM_H = 40
const NAV_GAP = 10

const nav = {
  marginTop: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: NAV_GAP,
  position: 'relative'
}

const navItem = {
  height: NAV_ITEM_H,
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  borderRadius: 12,
  cursor: 'default',
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: '0.02em',
  opacity: 0.78,
  transition: 'transform 0.2s ease, filter 0.2s ease'
}

const navItemActive = {
  ...navItem,
  opacity: 1,
  color: 'rgba(255,255,255,0.98)',
  background: 'rgba(22, 163, 74, 0.18)',
  border: '1px solid rgba(22, 163, 74, 0.35)',
  boxShadow: '0 10px 28px -18px rgba(22, 163, 74, 0.6)'
}

const navIndicator = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: NAV_ITEM_H,
  borderRadius: 12,
  background: 'rgba(22, 163, 74, 0.12)',
  border: '1px solid rgba(22, 163, 74, 0.22)',
  boxShadow: '0 10px 28px -18px rgba(22, 163, 74, 0.45)',
  transition: 'transform 0.22s ease',
  pointerEvents: 'none'
}
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

const workshopPanel = {
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.2)',
  boxShadow:
    '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 20px 40px -14px rgba(15, 23, 42, 0.12)',
  padding: 24
}

const workshopRow = {
  display: 'grid',
  gridTemplateColumns: '140px 1fr',
  alignItems: 'center',
  gap: 12,
  marginBottom: 18
}

const workshopLabel = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  color: '#475569'
}

const workshopSelect = {
  width: '100%',
  height: 44,
  borderRadius: 12,
  padding: '0 12px',
  border: '1px solid rgba(15, 23, 42, 0.12)',
  background: 'white',
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 600,
  outline: 'none'
}

const workshopGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16
}

const workshopCard = {
  background: 'rgba(255, 255, 255, 0.9)',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  borderRadius: 14,
  padding: 16,
  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)'
}

const workshopCardWide = {
  ...workshopCard,
  gridColumn: '1 / -1'
}

const workshopCardLabel = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#64748b',
  marginBottom: 10
}

const workshopCardValue = {
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: '#0f172a'
}

const workshopCardValueSm = {
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: '-0.01em',
  color: '#0f172a'
}

const workshopCardText = {
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.5,
  color: '#0f172a'
}

const driverPanel = {
  ...workshopPanel,
  marginTop: 18
}

const driverHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: 16,
  marginBottom: 18
}

const driverTitle = {
  fontSize: 16,
  fontWeight: 900,
  letterSpacing: '-0.02em',
  color: '#0f172a'
}

const driverSubtitle = {
  marginTop: 6,
  fontSize: 13,
  fontWeight: 600,
  color: '#64748b'
}

const driverPicker = {
  display: 'grid',
  gridTemplateColumns: '84px 260px',
  alignItems: 'center',
  gap: 12
}

const driverGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 16
}

const ratingRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 10
}

const ratingValue = {
  fontSize: 20,
  fontWeight: 900,
  letterSpacing: '-0.02em',
  color: '#0f172a'
}

const starsRow = {
  display: 'flex',
  gap: 2,
  lineHeight: 1
}

const star = {
  fontSize: 16
}

const ratingBarBg = {
  height: 8,
  borderRadius: 999,
  background: 'rgba(15, 23, 42, 0.08)',
  overflow: 'hidden'
}

const ratingBarFill = {
  height: '100%',
  borderRadius: 999,
  background: 'linear-gradient(90deg, #16a34a, #22c55e)'
}

const ratingMeta = {
  marginTop: 10,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.02em',
  color: '#64748b'
}

const reportPanel = {
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.2)',
  boxShadow:
    '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 20px 40px -14px rgba(15, 23, 42, 0.12)',
  padding: 24
}

const reportToolbar = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(160px, 1fr)) minmax(280px, 1.3fr)',
  gap: 12,
  marginBottom: 14
}

const reportFilterBlock = {
  display: 'grid',
  gap: 6
}

const reportSearchBlock = {
  display: 'grid',
  gap: 6
}

const reportSelect = {
  ...workshopSelect,
  height: 42
}

const reportSearchInput = {
  height: 42,
  borderRadius: 12,
  padding: '0 12px',
  border: '1px solid rgba(15, 23, 42, 0.12)',
  background: 'white',
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 600,
  outline: 'none'
}

const reportActions = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 14
}

const reportBtnPrimary = {
  height: 38,
  padding: '0 14px',
  borderRadius: 10,
  border: 'none',
  background: '#16a34a',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer'
}

const reportBtnGhost = {
  height: 38,
  padding: '0 14px',
  borderRadius: 10,
  border: '1px solid rgba(15, 23, 42, 0.16)',
  background: 'white',
  color: '#0f172a',
  fontWeight: 700,
  cursor: 'pointer'
}

const reportCount = {
  marginLeft: 'auto',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  color: '#64748b'
}

const reportTableWrap = {
  overflowX: 'auto',
  borderRadius: 12,
  border: '1px solid rgba(15, 23, 42, 0.09)'
}

const reportTable = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 760
}

const reportTh = {
  textAlign: 'left',
  padding: '11px 12px',
  background: 'rgba(22, 163, 74, 0.1)',
  color: '#14532d',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(15, 23, 42, 0.09)'
}

const reportTd = {
  padding: '11px 12px',
  fontSize: 14,
  fontWeight: 600,
  color: '#0f172a',
  borderBottom: '1px solid rgba(15, 23, 42, 0.07)'
}

const settingsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16
}

const settingsCard = {
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.2)',
  boxShadow:
    '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 20px 40px -14px rgba(15, 23, 42, 0.12)',
  padding: 18
}

const settingsCardWide = {
  ...settingsCard,
  gridColumn: '1 / -1'
}

const settingsCardTitle = {
  fontSize: 15,
  fontWeight: 900,
  letterSpacing: '-0.02em',
  color: '#0f172a',
  marginBottom: 6
}

const settingsCardText = {
  fontSize: 13,
  fontWeight: 600,
  color: '#64748b',
  marginBottom: 12
}

const settingsLogoList = {
  display: 'grid',
  gap: 10
}

const settingsUserList = {
  display: 'grid',
  gap: 10
}

const settingsRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 11px',
  borderRadius: 12,
  border: '1px solid rgba(15, 23, 42, 0.08)',
  background: 'rgba(255, 255, 255, 0.8)'
}

const settingsBadge = {
  padding: '5px 9px',
  borderRadius: 999,
  background: 'rgba(22, 163, 74, 0.12)',
  border: '1px solid rgba(22, 163, 74, 0.2)',
  color: '#166534',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.03em',
  textTransform: 'uppercase'
}

const settingsAvatar = {
  width: 34,
  height: 34,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(22, 163, 74, 0.14)',
  color: '#166534',
  fontWeight: 800,
  fontSize: 12
}

const settingsRowText = {
  display: 'grid',
  gap: 2
}

const settingsRowTitle = {
  fontSize: 13,
  fontWeight: 800,
  color: '#0f172a'
}

const settingsRowSub = {
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b'
}

const settingsToggles = {
  display: 'grid',
  gap: 12
}

const settingsToggleRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 14,
  padding: '10px 11px',
  borderRadius: 12,
  border: '1px solid rgba(15, 23, 42, 0.08)',
  background: 'rgba(255, 255, 255, 0.8)'
}

const settingsToggle = {
  width: 44,
  height: 26,
  borderRadius: 999,
  padding: 3,
  display: 'flex',
  alignItems: 'center'
}

const settingsToggleKnob = {
  width: 20,
  height: 20,
  borderRadius: 999,
  background: 'white',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  transition: 'transform 0.2s ease'
}

function formatWeekRange(startDate, endDateExclusive) {
  const endDate = new Date(endDateExclusive)
  endDate.setDate(endDate.getDate() - 1)

  const sameMonth = startDate.getMonth() === endDate.getMonth()
  const sameYear = startDate.getFullYear() === endDate.getFullYear()

  if (sameMonth && sameYear) {
    const monthYear = startDate.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    })
    return `${startDate.getDate()}-${endDate.getDate()} de ${monthYear}`
  }

  return `${startDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })} - ${endDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })}`
}

const logoItems = [
  { id: 'lg-1', type: 'Principal', name: 'MIVIOT Verde', spec: 'SVG · 1200x400' },
  { id: 'lg-2', type: 'Secundario', name: 'MIVIOT Blanco', spec: 'PNG · 1024x512' },
  { id: 'lg-3', type: 'Icono', name: 'M Monograma', spec: 'SVG · 512x512' }
]

const demoUsers = [
  { id: 'u-1', initials: 'CM', name: 'Carlos Mena', role: 'Supervisor', status: 'Activo' },
  { id: 'u-2', initials: 'MP', name: 'María Peña', role: 'Operador', status: 'Activo' },
  { id: 'u-3', initials: 'JR', name: 'Juan Reyes', role: 'Auditor', status: 'Solo lectura' }
]

const configItems = [
  {
    id: 'cfg-1',
    label: 'Notificaciones por correo',
    help: 'Envía alertas cuando un chofer reciba reporte crítico.',
    enabled: true
  },
  {
    id: 'cfg-2',
    label: 'Aprobación de solicitudes',
    help: 'Requiere revisión de supervisor antes de asignar vehículo.',
    enabled: true
  },
  {
    id: 'cfg-3',
    label: 'Modo mantenimiento',
    help: 'Bloquea edición de reportes durante sincronización nocturna.',
    enabled: false
  }
]

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