import { useState } from 'react'
import { Card } from '../../components/Card'
import { EmotionPicker } from '../../components/EmotionPicker'
import { Layout } from '../../components/Layout'

const ACTIVIDADES = [
  { id: 'origami', title: 'Origamis', description: 'Crea figuras con papel', image: '/origami/cover.jpg' },
]

export function EstudianteHome({ onSelect }: { onSelect: (id: string) => void }) {
  const [emocion, setEmocion] = useState<string>()

  return (
    <Layout title="Zona Estudiante">
      <div className="bg-white rounded-2xl p-6 mb-6 text-center">
        <h2 className="font-bold text-lg mb-2">¿Cómo te sientes hoy?</h2>
        <EmotionPicker value={emocion} onSelect={setEmocion} />
        {emocion && <p className="text-sm text-gray-500 mt-2">¡Gracias por compartir cómo te sientes!</p>}
      </div>

      <h3 className="font-bold mb-3">Actividades STEAM</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {ACTIVIDADES.map((a) => (
          <Card key={a.id} title={a.title} description={a.description} onClick={() => onSelect(a.id)} />
        ))}
      </div>
    </Layout>
  )
}
