import { Card } from '../../components/Card'
import { Layout } from '../../components/Layout'

export function EstudianteHome({ onSelect, onBack }: { onSelect: (id: string) => void; onBack: () => void }) {
  return (
    <Layout title="Origami Conejo" onBack={onBack}>
      <div className="max-w-md mx-auto">
        <Card
          title="Origami Conejo"
          description="Dobla papel y crea un conejo — 11 pasos"
          badge="STEAM"
          meta="11 pasos · Papel reciclado"
          image={`${import.meta.env.BASE_URL}origami/conejo/Portada.jpeg`}
          onClick={() => onSelect('origami')}
        />
      </div>
    </Layout>
  )
}
