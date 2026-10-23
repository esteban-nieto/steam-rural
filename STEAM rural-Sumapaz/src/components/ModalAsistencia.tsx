import { useState, useEffect } from 'react'
import {
  guardarAsistenciasLocal,
  obtenerAsistenciasPorCursoYFecha,
  obtenerFechasAsistenciaPorCurso,
  obtenerTodasAsistenciasPorCurso,
  type RegistroAsistencia,
} from '../services/db'
import type { Estudiante } from '../types/models'

interface ModalAsistenciaProps {
  isOpen: boolean
  onClose: () => void
  curso: string
  estudiantes: Estudiante[]
}

export function ModalAsistencia({ isOpen, onClose, curso, estudiantes }: ModalAsistenciaProps) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [asistenciasMap, setAsistenciasMap] = useState<Record<string, { estado: 'presente' | 'ausente' | 'excusa'; observacion?: string }>>({})
  const [fechasDisponibles, setFechasDisponibles] = useState<string[]>([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [tab, setTab] = useState<'pasar_lista' | 'exportar'>('pasar_lista')

  // Para exportar rango de fechas
  const [modoExportar, setModoExportar] = useState<'dia_actual' | 'rango' | 'todas'>('dia_actual')
  const [fechaInicioExport, setFechaInicioExport] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [fechaFinExport, setFechaFinExport] = useState<string>(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (!isOpen) return
    cargarFechas()
    cargarAsistenciaDia(fechaSeleccionada)
  }, [isOpen, curso, fechaSeleccionada])

  const cargarFechas = async () => {
    const fechas = await obtenerFechasAsistenciaPorCurso(curso)
    setFechasDisponibles(fechas)
  }

  const cargarAsistenciaDia = async (fecha: string) => {
    const registros = await obtenerAsistenciasPorCursoYFecha(curso, fecha)
    const map: Record<string, { estado: 'presente' | 'ausente' | 'excusa'; observacion?: string }> = {}

    // Si ya hay guardados
    if (registros && registros.length > 0) {
      registros.forEach((r) => {
        map[r.estudiante_id] = { estado: r.estado, observacion: r.observacion }
      })
    } else {
      // Por defecto todos presentes
      estudiantes.forEach((e) => {
        map[e.id] = { estado: 'presente' }
      })
    }
    setAsistenciasMap(map)
  }

  const toggleEstado = (estudianteId: string, nuevoEstado: 'presente' | 'ausente' | 'excusa') => {
    setAsistenciasMap((prev) => ({
      ...prev,
      [estudianteId]: {
        ...prev[estudianteId],
        estado: nuevoEstado,
      },
    }))
  }

  const handleObservacion = (estudianteId: string, obs: string) => {
    setAsistenciasMap((prev) => ({
      ...prev,
      [estudianteId]: {
        ...prev[estudianteId],
        observacion: obs,
      },
    }))
  }

  const marcarTodos = (estado: 'presente' | 'ausente') => {
    const nuevoMap: Record<string, { estado: 'presente' | 'ausente' | 'excusa'; observacion?: string }> = {}
    estudiantes.forEach((e) => {
      nuevoMap[e.id] = {
        estado,
        observacion: asistenciasMap[e.id]?.observacion,
      }
    })
    setAsistenciasMap(nuevoMap)
  }

  const guardarAsistencia = async () => {
    if (!estudiantes.length) return
    setGuardando(true)
    const registros: RegistroAsistencia[] = estudiantes.map((e) => {
      const entrada = asistenciasMap[e.id] || { estado: 'presente' }
      return {
        id: `${curso}_${fechaSeleccionada}_${e.id}`,
        curso,
        fecha: fechaSeleccionada,
        estudiante_id: e.id,
        estudiante_nombre: e.nombre,
        estado: entrada.estado,
        observacion: entrada.observacion || undefined,
      }
    })

    await guardarAsistenciasLocal(registros)
    await cargarFechas()
    setGuardando(false)
    setMensaje('✓ Asistencia guardada correctamente')
    setTimeout(() => setMensaje(''), 3000)
  }

  // Generador de Excel XML nativo con estilos y bordes (.xls / .xlsx compatible)
  const generarExcelAsistencias = async () => {
    const todosRegistros = await obtenerTodasAsistenciasPorCurso(curso)

    // Filtrar fechas según selección del usuario
    let fechasAExportar: string[] = []
    if (modoExportar === 'dia_actual') {
      fechasAExportar = [fechaSeleccionada]
    } else if (modoExportar === 'todas') {
      const setF = new Set(todosRegistros.map((r) => r.fecha))
      if (setF.size === 0) setF.add(fechaSeleccionada)
      fechasAExportar = Array.from(setF).sort()
    } else if (modoExportar === 'rango') {
      const setF = new Set(
        todosRegistros
          .filter((r) => r.fecha >= fechaInicioExport && r.fecha <= fechaFinExport)
          .map((r) => r.fecha)
      )
      if (fechaSeleccionada >= fechaInicioExport && fechaSeleccionada <= fechaFinExport) {
        setF.add(fechaSeleccionada)
      }
      fechasAExportar = Array.from(setF).sort()
      if (fechasAExportar.length === 0) {
        fechasAExportar = [fechaInicioExport]
      }
    }

    if (!fechasAExportar.length) {
      alert('No hay fechas seleccionadas para exportar.')
      return
    }

    // Mapa rápido: fecha -> estudianteId -> estado
    const mapPorFechaYEst: Record<string, Record<string, RegistroAsistencia>> = {}
    todosRegistros.forEach((r) => {
      if (!mapPorFechaYEst[r.fecha]) mapPorFechaYEst[r.fecha] = {}
      mapPorFechaYEst[r.fecha][r.estudiante_id] = r
    })

    // Construir tabla HTML formateada para Excel
    let theadCols = `
      <th style="background-color:#2D5016; color:#ffffff; font-weight:bold; padding:10px; border:1px solid #c2b49d; width:50px; text-align:center;">#</th>
      <th style="background-color:#2D5016; color:#ffffff; font-weight:bold; padding:10px; border:1px solid #c2b49d; width:220px; text-align:left;">Nombre del Estudiante</th>
      <th style="background-color:#2D5016; color:#ffffff; font-weight:bold; padding:10px; border:1px solid #c2b49d; width:80px; text-align:center;">Curso</th>
    `
    fechasAExportar.forEach((f) => {
      theadCols += `<th style="background-color:#3B691C; color:#ffffff; font-weight:bold; padding:10px; border:1px solid #c2b49d; width:110px; text-align:center;">${f}</th>`
    })
    theadCols += `
      <th style="background-color:#C47A3C; color:#ffffff; font-weight:bold; padding:10px; border:1px solid #c2b49d; width:80px; text-align:center;">Total Asistió</th>
      <th style="background-color:#A8432D; color:#ffffff; font-weight:bold; padding:10px; border:1px solid #c2b49d; width:80px; text-align:center;">Total Faltas</th>
      <th style="background-color:#5B6B58; color:#ffffff; font-weight:bold; padding:10px; border:1px solid #c2b49d; width:80px; text-align:center;">% Asist.</th>
    `

    let rowsHtml = ''
    estudiantes.forEach((est, idx) => {
      let presentes = 0
      let ausentes = 0
      let celdasFechas = ''

      fechasAExportar.forEach((f) => {
        const reg = mapPorFechaYEst[f]?.[est.id]
        // Si no está en BD pero es el día actual abierto en pantalla, usar el estado del mapa
        let estado = reg?.estado
        if (!estado && f === fechaSeleccionada) {
          estado = asistenciasMap[est.id]?.estado || 'presente'
        }

        if (estado === 'presente') {
          presentes++
          celdasFechas += `<td style="border:1px solid #c2b49d; text-align:center; background-color:#EBF5E1; color:#2D5016; font-weight:bold; padding:8px;">PRESENTE</td>`
        } else if (estado === 'ausente') {
          ausentes++
          celdasFechas += `<td style="border:1px solid #c2b49d; text-align:center; background-color:#FDE8E4; color:#A8432D; font-weight:bold; padding:8px;">FALTA</td>`
        } else if (estado === 'excusa') {
          celdasFechas += `<td style="border:1px solid #c2b49d; text-align:center; background-color:#FFF5DF; color:#8C5815; font-weight:bold; padding:8px;">EXCUSA</td>`
        } else {
          celdasFechas += `<td style="border:1px solid #c2b49d; text-align:center; color:#888888; padding:8px;">—</td>`
        }
      })

      const totalValidas = presentes + ausentes
      const porcentaje = totalValidas > 0 ? Math.round((presentes / totalValidas) * 100) : 100
      const bgColorFila = idx % 2 === 0 ? '#FFFFFF' : '#F9F6F0'

      rowsHtml += `
        <tr style="background-color:${bgColorFila};">
          <td style="border:1px solid #c2b49d; text-align:center; padding:8px; font-weight:bold;">${idx + 1}</td>
          <td style="border:1px solid #c2b49d; padding:8px; font-weight:bold; text-align:left;">${est.nombre}</td>
          <td style="border:1px solid #c2b49d; text-align:center; padding:8px;">${curso}</td>
          ${celdasFechas}
          <td style="border:1px solid #c2b49d; text-align:center; font-weight:bold; color:#2D5016; padding:8px;">${presentes}</td>
          <td style="border:1px solid #c2b49d; text-align:center; font-weight:bold; color:#A8432D; padding:8px;">${ausentes}</td>
          <td style="border:1px solid #c2b49d; text-align:center; font-weight:bold; padding:8px;">${porcentaje}%</td>
        </tr>
      `
    })

    const contenidoExcel = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Asistencia Grupo ${curso}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
        </style>
      </head>
      <body>
        <table style="margin-bottom:15px;">
          <tr>
            <td colspan="${fechasAExportar.length + 6}" style="font-size:18px; font-weight:bold; color:#2D5016; text-align:center; padding:12px;">
              REGISTRO DE ASISTENCIA — GRUPO ${curso}
            </td>
          </tr>
          <tr>
            <td colspan="${fechasAExportar.length + 6}" style="font-size:12px; color:#555555; text-align:center; padding-bottom:10px;">
              STEAM Rural Sumapaz · Generado el ${new Date().toLocaleDateString('es-CO')}
            </td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>${theadCols}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob(['\uFEFF', contenidoExcel], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Asistencia_Grupo_${curso}_${fechasAExportar[0] || 'reporte'}.xls`
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      a.remove()
      URL.revokeObjectURL(url)
    }, 2000)
  }

  if (!isOpen) return null

  // Métricas rápidas del día
  const totalAlumnos = estudiantes.length
  let presentesHoy = 0
  let ausentesHoy = 0
  let excusasHoy = 0
  estudiantes.forEach((e) => {
    const estado = asistenciasMap[e.id]?.estado || 'presente'
    if (estado === 'presente') presentesHoy++
    else if (estado === 'ausente') ausentesHoy++
    else if (estado === 'excusa') excusasHoy++
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl border border-[#E8E0D0] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden paper-texture animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-[#E8E0D0] flex items-center justify-between bg-paper">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-paramo text-white flex items-center justify-center text-xl shadow-sm">
              📋
            </div>
            <div>
              <h2 className="font-display font-extrabold text-[19px] text-ink leading-tight">
                Llamar a Lista — Curso {curso}
              </h2>
              <p className="text-[12px] text-ink/60">
                Control de asistencia diaria y exportación a Excel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-mist border border-[#E8E0D0] flex items-center justify-center text-ink/60 hover:text-ink font-bold text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Pestañas */}
        <div className="px-6 pt-3 border-b border-[#E8E0D0] flex items-center justify-between gap-2 bg-white">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('pasar_lista')}
              className={`px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-t-xl transition border-b-2 ${
                tab === 'pasar_lista'
                  ? 'border-paramo text-paramo bg-mist/40'
                  : 'border-transparent text-ink/50 hover:text-ink'
              }`}
            >
              📝 Registro de Asistencia
            </button>
            <button
              onClick={() => setTab('exportar')}
              className={`px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-t-xl transition border-b-2 ${
                tab === 'exportar'
                  ? 'border-terracota text-terracota bg-orange-50/50'
                  : 'border-transparent text-ink/50 hover:text-ink'
              }`}
            >
              📊 Exportar a Excel
            </button>
          </div>

          {mensaje && (
            <span className="text-[12px] font-bold text-paramo bg-mist px-3 py-1 rounded-full animate-bounce">
              {mensaje}
            </span>
          )}
        </div>

        {/* Contenido según pestaña */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'pasar_lista' ? (
            <div>
              {/* Barra de Selección de Fecha y Marcación rápida */}
              <div className="bg-paper border border-[#E8E0D0] rounded-2xl p-4 mb-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="text-xs font-bold text-ink/70 uppercase">Fecha:</label>
                  <input
                    type="date"
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    className="bg-white border border-[#E8E0D0] rounded-full px-3.5 py-1.5 text-xs font-bold text-ink outline-none focus:border-paramo shadow-sm"
                  />

                  {fechasDisponibles.length > 0 && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="text-[11px] text-ink/40">Días guardados:</span>
                      <select
                        value={fechasDisponibles.includes(fechaSeleccionada) ? fechaSeleccionada : ''}
                        onChange={(e) => {
                          if (e.target.value) setFechaSeleccionada(e.target.value)
                        }}
                        className="bg-white border border-[#E8E0D0] rounded-full px-2.5 py-1 text-[11px] font-medium outline-none"
                      >
                        <option value="">Historial de fechas ({fechasDisponibles.length})</option>
                        {fechasDisponibles.map((f) => (
                          <option key={f} value={f}>
                            📅 {f}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase text-ink/40 mr-1">Rápido:</span>
                  <button
                    onClick={() => marcarTodos('presente')}
                    className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition"
                  >
                    Todos Presentes
                  </button>
                  <button
                    onClick={() => marcarTodos('ausente')}
                    className="px-3 py-1 rounded-full bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold border border-red-200 transition"
                  >
                    Todos Ausentes
                  </button>
                </div>
              </div>

              {/* Resumen numérico */}
              <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Presentes
                  </span>
                  <span className="text-xl font-extrabold text-emerald-800">
                    {presentesHoy} / {totalAlumnos}
                  </span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
                    Faltas
                  </span>
                  <span className="text-xl font-extrabold text-red-800">
                    {ausentesHoy}
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                    Excusas
                  </span>
                  <span className="text-xl font-extrabold text-amber-800">
                    {excusasHoy}
                  </span>
                </div>
              </div>

              {/* Lista de Estudiantes para llamar */}
              <div className="space-y-2">
                {estudiantes.map((est, idx) => {
                  const estado = asistenciasMap[est.id]?.estado || 'presente'
                  const obs = asistenciasMap[est.id]?.observacion || ''

                  return (
                    <div
                      key={est.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                        estado === 'presente'
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : estado === 'ausente'
                          ? 'bg-red-50/40 border-red-200'
                          : 'bg-amber-50/40 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <span className="w-6 text-center text-xs font-extrabold text-ink/40">
                          {idx + 1}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white border border-[#E8E0D0] flex items-center justify-center font-bold text-xs text-ink">
                          {est.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[14px] text-ink leading-tight">
                            {est.nombre}
                          </p>
                          <p className="text-[11px] text-ink/50 uppercase font-semibold">
                            Curso {curso}
                          </p>
                        </div>
                      </div>

                      {/* Botones de estado */}
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-[#E8E0D0] shadow-sm">
                        <button
                          type="button"
                          onClick={() => toggleEstado(est.id, 'presente')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                            estado === 'presente'
                              ? 'bg-emerald-600 text-white shadow'
                              : 'text-ink/60 hover:bg-paper'
                          }`}
                        >
                          ✓ Presente
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleEstado(est.id, 'ausente')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                            estado === 'ausente'
                              ? 'bg-red-600 text-white shadow'
                              : 'text-ink/60 hover:bg-paper'
                          }`}
                        >
                          ✕ Ausente
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleEstado(est.id, 'excusa')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                            estado === 'excusa'
                              ? 'bg-amber-500 text-white shadow'
                              : 'text-ink/60 hover:bg-paper'
                          }`}
                        >
                          📋 Excusa
                        </button>
                      </div>

                      {/* Observación opcional */}
                      <div className="w-full sm:w-auto flex-1 max-w-xs">
                        <input
                          type="text"
                          value={obs}
                          onChange={(e) => handleObservacion(est.id, e.target.value)}
                          placeholder="Observación (opcional)..."
                          className="w-full bg-white border border-[#E8E0D0] rounded-full px-3 py-1 text-xs outline-none focus:border-paramo"
                        />
                      </div>
                    </div>
                  )
                })}

                {estudiantes.length === 0 && (
                  <div className="text-center py-12 text-ink/40">
                    <p className="text-3xl mb-2">📋</p>
                    <p className="font-bold text-sm">No hay estudiantes registrados en este curso.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Vista de Exportación */
            <div className="max-w-xl mx-auto space-y-6 py-4">
              <div className="bg-paper border border-[#E8E0D0] rounded-2xl p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-terracota/10 text-terracota flex items-center justify-center text-3xl mx-auto">
                  📊
                </div>
                <h3 className="font-display font-extrabold text-[18px] text-ink">
                  Descargar Asistencia en Excel
                </h3>
                <p className="text-xs text-ink/70 leading-relaxed">
                  Genera una hoja de cálculo organizada en tablas con las fechas seleccionadas,
                  totales de asistencia, fallas y porcentaje por cada estudiante del curso {curso}.
                </p>

                {/* Selección de modo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left pt-2">
                  <label
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col gap-1 ${
                      modoExportar === 'dia_actual'
                        ? 'border-terracota bg-white shadow-sm'
                        : 'border-[#E8E0D0] bg-white/60 hover:border-ink/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modoExport"
                      checked={modoExportar === 'dia_actual'}
                      onChange={() => setModoExportar('dia_actual')}
                      className="hidden"
                    />
                    <span className="font-bold text-xs text-ink">Día actual</span>
                    <span className="text-[11px] text-ink/50">{fechaSeleccionada}</span>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col gap-1 ${
                      modoExportar === 'rango'
                        ? 'border-terracota bg-white shadow-sm'
                        : 'border-[#E8E0D0] bg-white/60 hover:border-ink/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modoExport"
                      checked={modoExportar === 'rango'}
                      onChange={() => setModoExportar('rango')}
                      className="hidden"
                    />
                    <span className="font-bold text-xs text-ink">Rango de fechas</span>
                    <span className="text-[11px] text-ink/50">Elegir desde y hasta</span>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col gap-1 ${
                      modoExportar === 'todas'
                        ? 'border-terracota bg-white shadow-sm'
                        : 'border-[#E8E0D0] bg-white/60 hover:border-ink/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modoExport"
                      checked={modoExportar === 'todas'}
                      onChange={() => setModoExportar('todas')}
                      className="hidden"
                    />
                    <span className="font-bold text-xs text-ink">Todo el historial</span>
                    <span className="text-[11px] text-ink/50">Todas las fechas</span>
                  </label>
                </div>

                {/* Selectores de rango */}
                {modoExportar === 'rango' && (
                  <div className="bg-white border border-[#E8E0D0] rounded-xl p-4 flex items-center justify-center gap-3 flex-wrap">
                    <div className="text-left">
                      <label className="text-[10px] font-bold text-ink/60 uppercase block mb-1">
                        Desde:
                      </label>
                      <input
                        type="date"
                        value={fechaInicioExport}
                        onChange={(e) => setFechaInicioExport(e.target.value)}
                        className="bg-paper border border-[#E8E0D0] rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
                      />
                    </div>
                    <span className="text-ink/40 font-bold mt-4">→</span>
                    <div className="text-left">
                      <label className="text-[10px] font-bold text-ink/60 uppercase block mb-1">
                        Hasta:
                      </label>
                      <input
                        type="date"
                        value={fechaFinExport}
                        onChange={(e) => setFechaFinExport(e.target.value)}
                        className="bg-paper border border-[#E8E0D0] rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={generarExcelAsistencias}
                  disabled={estudiantes.length === 0}
                  className="w-full bg-terracota hover:bg-[#b03b22] text-white py-3 rounded-full font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>📥</span>
                  <span>Descargar Archivo Excel (.xls)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E8E0D0] bg-paper flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full border border-[#E8E0D0] text-xs font-semibold text-ink/70 hover:bg-white transition"
          >
            Cerrar
          </button>

          {tab === 'pasar_lista' && (
            <button
              onClick={guardarAsistencia}
              disabled={guardando || estudiantes.length === 0}
              className="bg-paramo hover:bg-[#1e3a0f] text-white px-6 py-2 rounded-full text-xs font-bold shadow transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>💾</span>
              <span>{guardando ? 'Guardando...' : 'Guardar Asistencia del Día'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
