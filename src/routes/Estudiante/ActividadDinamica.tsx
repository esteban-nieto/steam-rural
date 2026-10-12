import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { EmotionPicker } from '../../components/EmotionPicker'
import type { Actividad } from '../../services/db'

interface Props {
  actividad: Actividad
  onBack: () => void
}

export function ActividadDinamica({ actividad, onBack }: Props) {
  const [paso, setPaso] = useState(0)
  const [emocionFin, setEmocionFin] = useState<string>()
  const [completados, setCompletados] = useState<Set<number>>(new Set())

  const pasos = actividad.pasos || []
  const total = actividad.numeroPasos || pasos.length || 1
  const pasoActual = pasos[paso]

  const marcarSiguiente = () => {
    const n = new Set(completados)
    n.add(paso)
    setCompletados(n)
    if (paso < total - 1) {
      setPaso(paso + 1)
    }
  }

  const progreso = total > 0 ? Math.round(((paso + 1) / total) * 100) : 0

  return (
    <Layout title={actividad.nombre} onBack={onBack}>
      <div className="bg-white rounded-paper border border-[#E8E0D0] shadow-paper overflow-hidden paper-texture">
        {/* Header de avance */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-white bg-clay px-2.5 py-1 rounded-full">
            Paso {paso + 1} de {total}
          </span>
          <span className="text-[12px] font-bold text-ink/60">{progreso}%</span>
        </div>
        <div className="px-5">
          <div className="w-full bg-paper border border-[#E8E0D0] rounded-full h-2 overflow-hidden">
            <div
              className="bg-paramo h-2 rounded-full transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        {/* Contenido del paso */}
        <div className="p-5">
          {/* Multimedia */}
          <div className="aspect-[4/3] bg-gradient-to-br from-mist/50 to-white rounded-2xl border border-[#E8E0D0] flex items-center justify-center overflow-hidden relative">
            {pasoActual?.multimedia ? (
              pasoActual.tipoMultimedia === 'video' ? (
                <video
                  src={pasoActual.multimedia}
                  controls
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <img
                  src={pasoActual.multimedia}
                  alt={`Paso ${paso + 1}`}
                  className="w-full h-full object-contain p-2"
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-ink/40">
                <span className="text-4xl">🛠️</span>
                <span className="text-[12px] font-bold tracking-widest uppercase">
                  Paso interactivo
                </span>
              </div>
            )}
          </div>

          {/* Texto del paso */}
          <div className="mt-4 p-4 rounded-xl bg-paper/60 border border-[#E8E0D0]">
            <h3 className="font-display font-bold text-ink text-[17px] mb-1">
              Instrucción del Paso {paso + 1}
            </h3>
            <p className="text-[14px] leading-relaxed text-ink/80">
              {pasoActual?.texto || 'Sigue las instrucciones del profesor.'}
            </p>
          </div>

          {/* Controles de navegación */}
          <div className="flex items-center justify-between gap-3 mt-5">
            <button
              onClick={() => setPaso((p) => Math.max(0, p - 1))}
              disabled={paso === 0}
              className="px-4 py-2.5 rounded-full border border-[#E8E0D0] text-ink/70 font-semibold text-sm hover:bg-paper disabled:opacity-30 disabled:pointer-events-none"
            >
              ← Anterior
            </button>

            {paso < total - 1 ? (
              <button
                onClick={marcarSiguiente}
                className="flex-1 bg-paramo text-white py-2.5 px-5 rounded-full font-bold text-sm hover:bg-[#1e3a0f] transition shadow-paper"
              >
                Completar paso y seguir →
              </button>
            ) : (
              <div className="flex-1 text-center py-2 px-4 bg-moss/20 text-moss font-bold text-sm rounded-full">
                🎉 ¡Has completado todos los pasos!
              </div>
            )}
          </div>

          {/* Registro emocional al completar */}
          {paso === total - 1 && (
            <div className="mt-6 pt-5 border-t border-[#E8E0D0] text-center">
              <h4 className="font-display font-bold text-ink mb-2">
                ¿Cómo te sientes después de completar esta actividad?
              </h4>
              <div className="flex justify-center">
                <EmotionPicker value={emocionFin} onSelect={setEmocionFin} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
