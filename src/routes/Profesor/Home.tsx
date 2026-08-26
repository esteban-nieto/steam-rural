// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import type { Estudiante } from '../../services/supabase'
import { Layout } from '../../components/Layout'

export function ProfesorHome() {
  const [curso, setCurso] = useState('3A')
  const [cursos, setCursos] = useState<string[]>(['3A', '4B'])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [nombre, setNombre] = useState('')
  const [nuevoCurso, setNuevoCurso] = useState('')

  const cargar = async () => {
    const { data } = await (supabase.from as any)('estudiantes').select('*').eq('curso', curso)
    if (data) setEstudiantes(data as Estudiante[])
  }

  useEffect(() => { cargar() }, [curso])

  const agregar = async () => {
    if (!nombre.trim()) return
    const { data: { user } } = await (supabase.auth as any).getUser()
    const { data } = await (supabase.from as any)('estudiantes').insert({ nombre, curso, profesor_id: user?.id }).select().single()
    if (data) setEstudiantes([...estudiantes, data as Estudiante])
    setNombre('')
  }

  const crearCurso = () => {
    if (!nuevoCurso.trim() || cursos.includes(nuevoCurso)) return
    setCursos([...cursos, nuevoCurso])
    setCurso(nuevoCurso)
    setNuevoCurso('')
  }

  return (
    <Layout title="Panel Profesor">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-white bg-paramo px-2.5 py-1 rounded-full">{estudiantes.length} estudiantes</span>
        <span className="text-[12px] text-ink/50">en</span>
        <span className="font-display font-bold text-ink">{curso}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {cursos.map((c) => (
          <button
            key={c}
            onClick={() => setCurso(c)}
            aria-pressed={curso === c}
            aria-label={`Curso ${c}`}
            className={`px-4 py-2 rounded-full text-[13px] font-bold border transition focus-visible:ring-2 focus-visible:ring-terracota ${curso === c ? 'bg-slateProfesor text-white border-slateProfesor shadow-paper' : 'bg-white text-ink/70 border-[#E8E0D0] hover:border-slateProfesor/30'}`}
          >
            {c}
          </button>
        ))}
        <span className="flex gap-1.5 bg-white border border-[#E8E0D0] rounded-full p-1">
          <input value={nuevoCurso} onChange={(e) => setNuevoCurso(e.target.value)} placeholder="Nuevo curso" className="bg-transparent px-3 text-[13px] w-28 outline-none placeholder:text-ink/30" />
          <button onClick={crearCurso} className="bg-ink text-white rounded-full px-3 text-[12px] font-bold">+ Curso</button>
        </span>
      </div>

      <div className="bg-white rounded-paper border border-[#E8E0D0] shadow-paper p-5 mb-6 paper-texture">
        <h3 className="font-display font-bold text-ink mb-1">Agregar estudiante</h3>
        <p className="text-[12px] text-ink/50 mb-3">Solo nombre y curso — el registro de emociones y progreso se hace en clase.</p>
        <div className="flex gap-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Ana María" className="flex-1 bg-paper border border-[#E8E0D0] rounded-full px-4 py-2.5 text-[14px] outline-none focus:border-paramo/30 focus:bg-white" />
          <button onClick={agregar} className="bg-paramo text-white px-6 rounded-full font-bold text-[13px] tracking-wide hover:bg-[#1e3a0f] transition">Agregar</button>
        </div>
      </div>

      <div className="grid gap-3">
        {estudiantes.map((e) => (
          <div key={e.id} className="group bg-white rounded-2xl border border-[#E8E0D0] p-4 flex items-center gap-4 hover:shadow-paper hover:-translate-y-0.5 transition-all">
            <div className="w-10 h-10 rounded-full bg-mist border border-moss/20 flex items-center justify-center font-display font-bold text-paramo">
              {e.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[14px] text-ink leading-none">{e.nombre}</p>
              <p className="text-[11px] font-bold tracking-widest uppercase text-moss">{e.curso}</p>
            </div>
            <span className="text-[11px] font-semibold text-ink/30 group-hover:text-ink/60">Ver progreso →</span>
          </div>
        ))}
        {estudiantes.length === 0 && (
          <div className="bg-white rounded-paper border border-dashed border-[#E8E0D0] p-10 text-center">
            <p className="text-2xl mb-2">📋</p>
            <p className="font-display font-bold text-ink">Sin estudiantes en {curso}</p>
            <p className="text-[13px] text-ink/50">Agrega el primer nombre arriba.</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
