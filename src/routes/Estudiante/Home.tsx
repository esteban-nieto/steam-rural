import { Card } from '../../components/Card'
import { Layout } from '../../components/Layout'

export function EstudianteHome({ onSelect, onBack }: { onSelect: (id: string) => void; onBack: () => void }) {
  return (
    <Layout title="Actividades" onBack={onBack}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <Card
          title="Origami Conejo"
          description="Dobla papel y crea un conejo — 11 pasos"
          badge="STEAM"
          meta="11 pasos · Papel reciclado"
          image={`${import.meta.env.BASE_URL}origami/conejo/Portada.jpeg`}
          onClick={() => onSelect('origami')}
        />
        <Card
          title="Creación de molino + casa"
          description="Construye un molino que enciende la luz de una casa — video por pasos"
          badge="STEAM"
          meta="Video · 20 pasos"
          image={`${import.meta.env.BASE_URL}videos/Portada.png`}
          onClick={() => onSelect('molino')}
        />
      </div>
    </Layout>
  )
}
