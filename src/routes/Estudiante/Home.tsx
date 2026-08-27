import { Card } from '../../components/Card'
import { Layout } from '../../components/Layout'

const ACTIVIDADES = [
  {
    id: 'origami',
    title: 'Origami Conejo',
    description: 'Dobla papel y crea un conejo — 9 pasos con tu Portada',
    badge: 'STEAM',
    meta: '10 pasos · Papel reciclado',
    image: `${import.meta.env.BASE_URL}origami/conejo/Portada.jpeg`,
  },
  { id: 'puente', title: 'Puente de papel', description: 'Pronto — estructura y peso', badge: 'Ingeniería', meta: 'Muy pronto' },
]

export function EstudianteHome({ onSelect, onBack }: { onSelect: (id: string) => void; onBack: () => void }) {
  return (
    <Layout title="Actividades" onBack={onBack}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-[18px] text-ink">Talleres STEAM</h3>
        <span className="text-[11px] font-bold tracking-widest uppercase text-ink/40">Toca una tarjeta</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACTIVIDADES.map((a) => (
          <Card key={a.id} title={a.title} description={a.description} badge={a.badge} meta={a.meta} image={(a as any).image} onClick={() => a.id === 'origami' && onSelect(a.id)} />
        ))}
      </div>
      <p className="text-center text-[11px] text-ink/30 mt-6">Más actividades STEAM se agregarán como nuevas tarjetas.</p>
    </Layout>
  )
}
