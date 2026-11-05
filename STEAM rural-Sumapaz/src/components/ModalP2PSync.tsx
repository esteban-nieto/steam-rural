import { useState, useEffect } from 'react'
import {
  exportarBaseDatosCompleta,
  importarBaseDatosCompleta,
} from '../services/db'
import {
  isTauriEnvironment,
  startP2pHost,
  stopP2pHost,
  receiveP2pData,
} from '../services/tauriBridge'
import { generarCodigoSincronizacion } from '../services/auth'
import { useAppStore } from '../stores/app.store'
import {
  cifrarTexto,
  descifrarSobre,
  esSobreCifrado,
  normalizarCodigo,
  tokenDeAcceso,
} from '../services/cifrado'

function resumenImportacion(r: { aplicados: number; conservados: number; eliminados: number }) {
  return `${r.aplicados} registros actualizados, ${r.conservados} más recientes conservados en este equipo y ${r.eliminados} eliminados.`
}

interface ModalP2PSyncProps {
  isOpen: boolean
  onClose: () => void
  onSyncCompletado?: () => void
}

export function ModalP2PSync({ isOpen, onClose, onSyncCompletado }: ModalP2PSyncProps) {
  const profesorId = useAppStore((s) => s.usuario.profesor?.id) as string
  const [tab, setTab] = useState<'emitir' | 'recibir' | 'archivo'>('emitir')
  const [isDesktop, setIsDesktop] = useState(false)

  // Estados para modo Emitir
  const [emitPin, setEmitPin] = useState('')
  const [localIp, setLocalIp] = useState('')
  const [servidorActivo, setServidorActivo] = useState(false)
  const [cargandoEmision, setCargandoEmision] = useState(false)
  const [mensajeEmision, setMensajeEmision] = useState('')

  // Estados para modo Recibir
  const [targetIp, setTargetIp] = useState('')
  const [recibirPin, setRecibirPin] = useState('')
  const [cargandoRecepcion, setCargandoRecepcion] = useState(false)
  const [errorRecepcion, setErrorRecepcion] = useState('')
  const [exitoRecepcion, setExitoRecepcion] = useState('')

  // Estados para modo Respaldo por Archivo (.json)
  const [mensajeArchivo, setMensajeArchivo] = useState('')
  const [claveArchivo, setClaveArchivo] = useState('')

  useEffect(() => {
    setIsDesktop(isTauriEnvironment())
    setEmitPin(generarCodigoSincronizacion())
  }, [isOpen])

  // Al cerrar el modal, si el servidor emisor estaba activo, apagarlo
  const handleCerrar = async () => {
    if (servidorActivo && isDesktop) {
      await stopP2pHost().catch(() => {})
      setServidorActivo(false)
    }
    onClose()
  }

  // Iniciar emisión en red local
  const handleIniciarEmision = async () => {
    setCargandoEmision(true)
    setMensajeEmision('')
    try {
      const data = await exportarBaseDatosCompleta(profesorId)
      const cifrado = await cifrarTexto(JSON.stringify(data), emitPin)
      const ip = await startP2pHost(await tokenDeAcceso(emitPin), cifrado)
      setLocalIp(ip)
      setServidorActivo(true)
      setMensajeEmision('Listo: Esperando conexión desde el otro computador...')
    } catch (err: any) {
      setMensajeEmision(`Error iniciando emisor: ${err?.message || err}`)
    }
    setCargandoEmision(false)
  }

  // Detener emisión
  const handleDetenerEmision = async () => {
    await stopP2pHost().catch(() => {})
    setServidorActivo(false)
    setMensajeEmision('')
  }

  // Recibir datos de otro equipo
  const handleRecibirDatos = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetIp.trim() || !recibirPin.trim()) return

    setCargandoRecepcion(true)
    setErrorRecepcion('')
    setExitoRecepcion('')

    try {
      const codigo = normalizarCodigo(recibirPin)
      const sobre = JSON.parse(await receiveP2pData(targetIp.trim(), await tokenDeAcceso(codigo)))
      if (!esSobreCifrado(sobre)) throw new Error('El otro equipo envió datos sin cifrar. Actualiza la app en ambos equipos.')
      const r = await importarBaseDatosCompleta(JSON.parse(await descifrarSobre(sobre, codigo)), profesorId)
      setExitoRecepcion(`✓ ¡Datos recibidos! ${resumenImportacion(r)}`)
      if (onSyncCompletado) onSyncCompletado()
    } catch (err: any) {
      setErrorRecepcion(err?.message || String(err))
    }
    setCargandoRecepcion(false)
  }

  // Exportar respaldo manual como archivo JSON (para USB)
  const handleExportarArchivo = async () => {
    try {
      if (claveArchivo.length < 8) {
        setMensajeArchivo('Escribe una clave de al menos 8 caracteres para proteger el respaldo.')
        return
      }
      const data = await exportarBaseDatosCompleta(profesorId)
      const cifrado = await cifrarTexto(JSON.stringify(data), claveArchivo)
      const url = URL.createObjectURL(new Blob([cifrado], { type: 'application/json' }))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.href = url
      const fecha = new Date().toISOString().split('T')[0]
      downloadAnchor.setAttribute('download', `respaldo_steam_rural_${fecha}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      setMensajeArchivo('✓ Respaldo cifrado generado. Sin esta clave no se podrá abrir.')
    } catch {
      setMensajeArchivo('Error al generar archivo de respaldo.')
    }
  }

  // Importar respaldo manual desde archivo JSON
  const handleImportarArchivo = async (file: File) => {
    setMensajeArchivo('')
    try {
      let contenido = JSON.parse(await file.text())
      if (esSobreCifrado(contenido)) {
        if (!claveArchivo) {
          setMensajeArchivo('Este respaldo está cifrado: escribe su clave y vuelve a seleccionarlo.')
          return
        }
        contenido = JSON.parse(await descifrarSobre(contenido, claveArchivo))
      }
      const r = await importarBaseDatosCompleta(contenido, profesorId)
      setMensajeArchivo(`✓ Respaldo importado. ${resumenImportacion(r)}`)
      if (onSyncCompletado) onSyncCompletado()
    } catch (err: any) {
      setMensajeArchivo(
        err instanceof SyntaxError
          ? 'Error: el archivo no es un JSON válido.'
          : `Error: ${err?.message || 'no se pudo importar el archivo.'}`
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-white rounded-paper border border-[#E8E0D0] shadow-lift w-full max-w-lg overflow-hidden paper-texture">
        {/* Cabecera */}
        <div className="p-5 border-b border-[#E8E0D0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📡</span>
            <div>
              <h3 className="font-display font-bold text-ink text-base">
                Sincronización en el Aula (P2P)
              </h3>
              <p className="text-[12px] text-ink/50">
                Pasa tus cursos, notas y actividades a otro computador sin internet
              </p>
            </div>
          </div>
          <button
            onClick={handleCerrar}
            className="w-8 h-8 rounded-full bg-paper hover:bg-mist text-ink/60 hover:text-ink flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-[#E8E0D0] bg-paper/50">
          <button
            onClick={() => setTab('emitir')}
            className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
              tab === 'emitir'
                ? 'border-paramo text-paramo bg-white'
                : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            📤 Compartir / Emitir
          </button>
          <button
            onClick={() => setTab('recibir')}
            className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
              tab === 'recibir'
                ? 'border-terracota text-terracota bg-white'
                : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            📥 Recibir en este equipo
          </button>
          <button
            onClick={() => setTab('archivo')}
            className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
              tab === 'archivo'
                ? 'border-clay text-clay bg-white'
                : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            💾 Archivo / USB
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="p-6">
          {/* TAB 1: EMITIR */}
          {tab === 'emitir' && (
            <div className="space-y-4">
              <p className="text-xs text-ink/70">
                Usa esta opción en el <b>computador que tiene los datos</b> para transferirlos a otra
                máquina conectada al mismo router o WiFi del aula.
              </p>

              {!servidorActivo ? (
                <div className="bg-paper p-5 rounded-2xl border border-[#E8E0D0] text-center space-y-3">
                  <div className="w-12 h-12 bg-paramo/10 text-paramo rounded-xl flex items-center justify-center mx-auto text-2xl">
                    📤
                  </div>
                  <h4 className="font-display font-bold text-ink text-sm">
                    Preparar emisión de datos
                  </h4>
                  <p className="text-[12px] text-ink/60">
                    Se generará un PIN de seguridad temporal para conectar el otro equipo.
                  </p>
                  <button
                    onClick={handleIniciarEmision}
                    disabled={cargandoEmision}
                    className="bg-paramo text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#1e3a0f] transition shadow-paper disabled:opacity-50"
                  >
                    {cargandoEmision ? 'Iniciando servicio...' : 'Iniciar Transmisión en la Sala'}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border-2 border-emerald-500/30 p-5 rounded-2xl space-y-4 text-center">
                  <div className="inline-block bg-emerald-600 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full animate-pulse">
                    ● Transmitiendo en la red local
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-emerald-200">
                    <div>
                      <span className="block text-[11px] font-bold text-ink/60 uppercase">
                        Dirección IP Local
                      </span>
                      <span className="font-mono text-base font-bold text-ink">
                        {localIp || '192.168.x.x'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-ink/60 uppercase">
                        PIN de Seguridad
                      </span>
                      <span className="font-mono text-base font-black text-paramo break-all">
                        {emitPin}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-ink/70">
                    En el otro computador, entra a <b>"Recibir"</b>, escribe la IP <b>{localIp}</b> y
                    el código <b>{emitPin}</b>. Los datos viajan cifrados; tras 5 intentos
                    incorrectos la transmisión se detiene.
                  </p>

                  <button
                    onClick={handleDetenerEmision}
                    className="bg-white border border-red-300 text-red-600 hover:bg-red-50 px-5 py-2 rounded-full text-xs font-bold transition"
                  >
                    Detener Transmisión
                  </button>
                </div>
              )}

              {mensajeEmision && (
                <p className="text-xs text-center text-ink/70 bg-mist p-2 rounded-lg">
                  {mensajeEmision}
                </p>
              )}
            </div>
          )}

          {/* TAB 2: RECIBIR */}
          {tab === 'recibir' && (
            <form onSubmit={handleRecibirDatos} className="space-y-4">
              <p className="text-xs text-ink/70">
                Ingresa la <b>Dirección IP</b> y el <b>PIN</b> que muestra el computador que está
                emitiendo los datos.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-ink/70 uppercase mb-1">
                  Dirección IP del equipo emisor *
                </label>
                <input
                  type="text"
                  value={targetIp}
                  onChange={(e) => setTargetIp(e.target.value)}
                  placeholder="Ej. 192.168.1.50"
                  className="w-full bg-paper border border-[#E8E0D0] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-terracota focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink/70 uppercase mb-1">
                  Código de 12 caracteres *
                </label>
                <input
                  type="text"
                  value={recibirPin}
                  onChange={(e) => setRecibirPin(e.target.value)}
                  placeholder="Ej. K7PM2XQ9R4TW"
                  className="w-full bg-paper border border-[#E8E0D0] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-terracota focus:bg-white"
                  required
                />
              </div>

              {errorRecepcion && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl font-medium">
                  {errorRecepcion}
                </div>
              )}

              {exitoRecepcion && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl font-bold">
                  {exitoRecepcion}
                </div>
              )}

              <button
                type="submit"
                disabled={cargandoRecepcion}
                className="w-full bg-terracota text-white py-2.5 rounded-full text-xs font-bold hover:bg-[#a65e2a] transition shadow-paper disabled:opacity-50"
              >
                {cargandoRecepcion ? 'Conectando y recibiendo datos...' : '📥 Descargar e Importar Datos'}
              </button>
            </form>
          )}

          {/* TAB 3: RESPALDO POR ARCHIVO / USB */}
          {tab === 'archivo' && (
            <div className="space-y-4">
              <p className="text-xs text-ink/70">
                Ideal si no estás conectado a ninguna red WiFi. Puedes guardar un archivo en tu
                memoria USB para pasarlo manualmente a cualquier computador.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-ink/70 uppercase mb-1">
                  Clave del respaldo *
                </label>
                <input
                  type="password"
                  value={claveArchivo}
                  onChange={(e) => setClaveArchivo(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="off"
                  className="w-full bg-paper border border-[#E8E0D0] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-clay focus:bg-white"
                />
                <p className="text-[11px] text-ink/50 mt-1">
                  El archivo se guarda cifrado. Si olvidas la clave, no se puede recuperar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-paper p-4 rounded-xl border border-[#E8E0D0] flex flex-col justify-between gap-3 text-center">
                  <div>
                    <span className="text-2xl block mb-1">💾</span>
                    <h5 className="font-display font-bold text-xs text-ink">Exportar a archivo</h5>
                    <p className="text-[11px] text-ink/50 mt-1">
                      Crea un archivo .json con tus estudiantes, notas y actividades.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportarArchivo}
                    className="bg-white border border-[#E8E0D0] text-ink font-bold hover:bg-mist text-xs py-2 px-3 rounded-full transition shadow-sm"
                  >
                    Descargar Copia
                  </button>
                </div>

                <div className="bg-paper p-4 rounded-xl border border-[#E8E0D0] flex flex-col justify-between gap-3 text-center">
                  <div>
                    <span className="text-2xl block mb-1">📂</span>
                    <h5 className="font-display font-bold text-xs text-ink">Importar de archivo</h5>
                    <p className="text-[11px] text-ink/50 mt-1">
                      Carga un archivo .json desde tu memoria USB o disco.
                    </p>
                  </div>
                  <label className="cursor-pointer bg-clay text-white font-bold hover:bg-[#8B4513] text-xs py-2 px-3 rounded-full transition shadow-sm block">
                    Seleccionar Archivo
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImportarArchivo(file)
                        e.target.value = ''
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {mensajeArchivo && (
                <div className="bg-mist border border-moss/20 text-paramo text-xs p-3 rounded-xl font-bold text-center">
                  {mensajeArchivo}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className="bg-paper p-4 border-t border-[#E8E0D0] flex items-center justify-between text-[11px] text-ink/50">
          <span>Modo {isDesktop ? 'Escritorio (Nativo)' : 'Web (Simulador)'}</span>
          <button
            type="button"
            onClick={handleCerrar}
            className="text-xs font-bold text-ink/70 hover:text-ink hover:underline"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
