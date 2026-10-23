import { useState, useEffect } from 'react'
import { Card } from '../../components/Card'
import { Layout } from '../../components/Layout'
import { obtenerActividadesLocales, eliminarActividadLocal, type Actividad } from '../../services/db'

export function EstudianteHome({
  onSelectOrigami,
  onSelectMolino,
  onSelectHistoria,
  onSelectActividadDinamica,
  onBack,
}: {
  onSelectOrigami?: () => void
  onSelectMolino?: () => void
  onSelectHistoria?: () => void
  onSelectActividadDinamica?: (actividad: Actividad) => void
  onBack: () => void
}) {
  const [actividadesExtra, setActividadesExtra] = useState<Actividad[]>([])

  const cargarActividades = () => {
    obtenerActividadesLocales().then((acts) => {
      setActividadesExtra(acts)
    })
  }

  useEffect(() => {
    cargarActividades()
  }, [])

  const eliminarActividad = async (e: React.MouseEvent, id: string, nombre: string) => {
    e.stopPropagation()
    if (confirm(`¿Estás seguro de que deseas eliminar la actividad "${nombre}"?`)) {
      await eliminarActividadLocal(id)
      cargarActividades()
    }
  }

  return (
    <Layout title="Actividades" onBack={onBack}>
      {/* Banner Historia de Pueblo Soleado */}
      <div className="max-w-2xl mx-auto mb-6">
        <button
          onClick={onSelectHistoria}
          className="group text-left w-full bg-gradient-to-r from-clay/90 to-terracota text-white rounded-paper p-5 sm:p-6 shadow-paper hover:shadow-lift transition-all duration-300 flex items-center justify-between gap-4 border border-white/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition">
              🎬
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase bg-white/20 px-2.5 py-0.5 rounded-full text-white inline-block mb-1">
                Historia Animada
              </span>
              <h3 className="font-display font-extrabold text-[20px] sm:text-[22px] leading-tight text-white">
                Historia de Pueblo Soleado
              </h3>
              <p className="text-[13px] text-white/90 mt-0.5">
                Mira las aventuras en video: Parte 1 (El Molino) y Parte 2 (El Tractor).
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white text-terracota font-bold text-lg shadow shrink-0 group-hover:translate-x-1 transition">
            ▶
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <Card
          title="Origami Conejo"
          description="Dobla papel y crea un conejo — 11 pasos"
          badge="STEAM"
          meta="11 pasos · Papel reciclado"
          image={`${import.meta.env.BASE_URL}origami/conejo/Portada.jpeg`}
          onClick={onSelectOrigami}
        />
        <Card
          title="Creación de molino + casa"
          description="Construye un molino que enciende la luz de una casa — video por pasos"
          badge="STEAM"
          meta="Video · 20 pasos"
          image={`${import.meta.env.BASE_URL}videos/Portada.png`}
          onClick={onSelectMolino}
        />

        {actividadesExtra.map((act) => (
          <div key={act.id} className="relative group">
            <Card
              title={act.nombre}
              description={`Actividad creada por el profesor con ${act.numeroPasos} pasos interactivos.`}
              badge="Personalizada"
              meta={`${act.numeroPasos} pasos · Práctica`}
              image={
                act.portada ||
                act.pasos.find((p) => p.multimedia && p.tipoMultimedia !== 'video')?.multimedia ||
                `${import.meta.env.BASE_URL}origami/conejo/Portada.jpeg`
              }
              onClick={() => onSelectActividadDinamica && onSelectActividadDinamica(act)}
            />
            <button
              type="button"
              onClick={(e) => eliminarActividad(e, act.id, act.nombre)}
              title="Eliminar esta actividad"
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center shadow-md font-bold text-xs transition hover:scale-110"
              aria-label={`Eliminar ${act.nombre}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </Layout>
  )
}

