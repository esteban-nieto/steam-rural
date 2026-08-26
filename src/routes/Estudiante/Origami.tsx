import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { EmotionPicker } from '../../components/EmotionPicker'

const PASOS_EJEMPLO = [
  { img: '/origami/paso1.jpg', desc: 'Dobla el papel a la mitad' },
  { img: '/origami/paso2.jpg', desc: 'Marca bien el doblez' },
  { img: '/origami/paso3.jpg', desc: 'Forma el triángulo base' },
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
    <Layout title="Origami">
      <button onClick={onBack} className="text-sm text-primary mb-4">← Volver</button>

      <div className="bg-white rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">Paso {paso + 1} / {PASOS_EJEMPLO.length}</span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{progreso}% completado</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progreso}%` }} />
        </div>
        <div className="aspect-video bg-gray-50 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
          <img src={PASOS_EJEMPLO[paso].img} alt={`Paso ${paso + 1}`} className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
        </div>
        <p className="text-center text-gray-700 mb-4">{PASOS_EJEMPLO[paso].desc}</p>
        <div className="flex gap-2 justify-center">
          <button disabled={paso === 0} onClick={() => setPaso(paso - 1)} className="px-4 py-2 border rounded-lg disabled:opacity-30">Anterior</button>
          <button onClick={marcar} className="px-6 py-2 bg-primary text-white rounded-lg font-semibold">
            {completados.has(paso) ? '✓ Completado' : 'Marcar completado'}
          </button>
          <button disabled={paso === PASOS_EJEMPLO.length - 1} onClick={() => setPaso(paso + 1)} className="px-4 py-2 border rounded-lg disabled:opacity-30">Siguiente</button>
        </div>
      </div>

      {progreso === 100 && (
        <div className="bg-white rounded-2xl p-6 text-center">
          <h3 className="font-bold mb-2">¡Figura terminada! 🎉</h3>
          <p className="text-sm text-gray-500 mb-3">¿Cómo te sientes al terminar?</p>
          <EmotionPicker value={emocionFin} onSelect={setEmocionFin} />
        </div>
      )}
    </Layout>
  )
}
