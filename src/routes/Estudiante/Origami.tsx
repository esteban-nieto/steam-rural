import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { EmotionPicker } from '../../components/EmotionPicker'

const PASOS_EJEMPLO = [
  { img: '/origami/paso1.jpg', desc: 'Dobla el papel a la mitad formando un triángulo. Marca bien el doblez con la uña.' },
  { img: '/origami/paso2.jpg', desc: 'Abre y dobla las esquinas superiores hacia el centro. Deben encontrarse en la línea del medio.' },
  { img: '/origami/paso3.jpg', desc: 'Pliega la base hacia arriba. Ya tienes la forma inicial de la grulla.' },
]

export function OrigamiDetalle({ onBack }: { onBack: () => void }) {
  const [paso, setPaso] = useState(0)
  const [emocionFin, setEmocionFin] = useState<string>()
  const [completados, setCompletados] = useState<Set<number>>(new Set())

  const marcar = () => {
    const n = new Set(completados)
    n.add(paso)
    setCompletados(n)
    if (paso < PASOS_EJEMPLO.length - 1) setPaso(paso + 1)
  }

  const progreso = PASOS_EJEMPLO.length ? Math.round((completados.size / PASOS_EJEMPLO.length) * 100) : 0

  return (
    <Layout title="Origami · Grulla" onBack={onBack}>
      <div className="bg-white rounded-paper border border-[#E8E0D0] shadow-paper overflow-hidden paper-texture">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-white bg-clay px-2.5 py-1 rounded-full">Paso {paso + 1} de {PASOS_EJEMPLO.length}</span>
          <span className="text-[12px] font-bold text-ink/60">{progreso}%</span>
        </div>
        <div className="px-5">
          <div className="w-full bg-paper border border-[#E8E0D0] rounded-full h-2 overflow-hidden">
            <div className="bg-paramo h-2 rounded-full transition-all duration-500" style={{ width: `${progreso}%` }} />
          </div>
        </div>

        <div className="p-5">
          <div className="aspect-[4/3] bg-gradient-to-br from-mist/50 to-white rounded-2xl border border-[#E8E0D0] flex items-center justify-center overflow-hidden relative tape">
            <img
              src={PASOS_EJEMPLO[paso].img}
              alt={`Paso ${paso + 1}`}
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                ;(e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'
              }}
            />
            <div className="hidden absolute inset-0 items-center justify-center flex-col gap-2">
              <span className="text-4xl">📄</span>
              <span className="text-[11px] font-bold tracking-widest uppercase text-ink/30">Coloca tu imagen en public/origami/paso{paso + 1}.jpg</span>
            </div>
          </div>

          <p className="text-center font-medium text-[14px] leading-relaxed text-ink mt-4 px-2">{PASOS_EJEMPLO[paso].desc}</p>

          <div className="flex gap-2 justify-center mt-5">
            <button disabled={paso === 0} onClick={() => setPaso(paso - 1)} className="px-4 py-2.5 rounded-full border border-[#E8E0D0] bg-white text-[13px] font-semibold disabled:opacity-30 hover:bg-paper">
              ← Anterior
            </button>
            <button onClick={marcar} className={`px-6 py-2.5 rounded-full font-bold text-[13px] tracking-wide transition ${completados.has(paso) ? 'bg-mist text-paramo border border-moss/20' : 'bg-paramo text-white shadow-paper hover:bg-[#1e3a0f]'}`}>
              {completados.has(paso) ? '✓ Completado' : 'Marcar completado'}
            </button>
            <button disabled={paso === PASOS_EJEMPLO.length - 1} onClick={() => setPaso(paso + 1)} className="px-4 py-2.5 rounded-full border border-[#E8E0D0] bg-white text-[13px] font-semibold disabled:opacity-30 hover:bg-paper">
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      {progreso === 100 && (
        <div className="bg-white rounded-paper border border-[#E8E0D0] shadow-paper p-6 mt-4 text-center paper-texture">
          <p className="text-3xl mb-2">🎉</p>
          <h3 className="font-display font-bold text-[18px] text-ink">¡Figura terminada!</h3>
          <p className="text-[13px] text-ink/60 mb-4">¿Cómo te sientes al terminar?</p>
          <EmotionPicker value={emocionFin} onSelect={setEmocionFin} />
          {emocionFin && <p className="text-[12px] font-medium text-paramo mt-3">¡Registrado! Tu profe verá tu progreso.</p>}
        </div>
      )}

      <p className="text-center text-[11px] text-ink/30 mt-4">Tip del profe: marca cada paso solo cuando tu doblez quede bien definido.</p>
    </Layout>
  )
}
