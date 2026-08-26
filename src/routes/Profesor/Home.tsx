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
    const { data } = await supabase.from('estudiantes').select('*').eq('curso', curso)
    if (data) setEstudiantes(data as Estudiante[])
  }

  useEffect(() => { cargar() }, [curso])

  const agregar = async () => {
    if (!nombre.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('estudiantes').insert({ nombre, curso, profesor_id: user?.id }).select().single()
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
      <div className="flex flex-wrap gap-2 mb-4">
        {cursos.map((c) => (
          <button key={c} onClick={() => setCurso(c)} className={`px-4 py-2 rounded-full text-sm font-semibold ${curso === c ? 'bg-primary text-white' : 'bg-white border'}`}>{c}</button>
        ))}
        <span className="flex gap-1">
          <input value={nuevoCurso} onChange={(e) => setNuevoCurso(e.target.value)} placeholder="Nuevo curso" className="border rounded-full px-3 py-2 text-sm w-32" />
          <button onClick={crearCurso} className="bg-secondary text-white rounded-full px-3 text-sm">+ Curso</button>
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <h3 className="font-bold mb-3">Agregar estudiante — {curso}</h3>
        <div className="flex gap-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del estudiante" className="flex-1 border rounded-lg px-3 py-2" />
          <button onClick={agregar} className="bg-primary text-white px-6 rounded-lg font-semibold">Agregar</button>
        </div>
      </div>

      <div className="grid gap-2">
        {estudiantes.map((e) => (
          <div key={e.id} className="bg-white rounded-xl p-4 flex justify-between items-center border">
            <span className="font-medium">{e.nombre}</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{e.curso}</span>
          </div>
        ))}
        {estudiantes.length === 0 && <p className="text-center text-gray-400 py-8">Sin estudiantes en {curso}</p>}
      </div>
    </Layout>
  )
}
