import { useState, useEffect } from 'react'
import { Card } from '../../components/Card'
import { Layout } from '../../components/Layout'
import { obtenerActividadesLocales, type Actividad } from '../../services/db'

export function EstudianteHome({
  onSelect,
  onBack,
}: {
  onSelect: (id: string, actividadObj?: Actividad) => void
  onBack: () => void
}) {
  const [actividadesExtra, setActividadesExtra] = useState<Actividad[]>([])

  useEffect(() => {
    obtenerActividadesLocales().then((acts) => {
      setActividadesExtra(acts)
    })
  }, [])

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

        {actividadesExtra.map((act) => (
          <Card
            key={act.id}
            title={act.nombre}
            description={`Actividad creada por el profesor con ${act.numeroPasos} pasos interactivos.`}
            badge="Personalizada"
            meta={`${act.numeroPasos} pasos · Práctica`}
            image={
              act.pasos.find((p) => p.multimedia && p.tipoMultimedia !== 'video')?.multimedia ||
              `${import.meta.env.BASE_URL}origami/conejo/Portada.jpeg`
            }
            onClick={() => onSelect(act.id, act)}
          />
        ))}
      </div>
    </Layout>
  )
}
