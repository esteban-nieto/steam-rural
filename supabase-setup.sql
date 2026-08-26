-- Ejecuta en Supabase → SQL Editor → New query → Run
-- Crea tablas para STEAM Rural (profesor con N cursos, estudiante con emociones y progreso)

-- 1. Estudiantes
create table if not exists estudiantes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  curso text not null,
  profesor_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- 2. Progresos (incluye emociones inicio/fin)
create table if not exists progresos (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid references estudiantes(id) on delete cascade,
  actividad_id text not null,
  estado text check (estado in ('pendiente','en_progreso','completado')) default 'pendiente',
  pasos_completados int[] default '{}',
  emocion_inicio text,
  emocion_fin text,
  fecha timestamp with time zone default now()
);

-- Índices
create index if not exists idx_estudiantes_profesor on estudiantes(profesor_id);
create index if not exists idx_estudiantes_curso on estudiantes(curso);
create index if not exists idx_progresos_estudiante on progresos(estudiante_id);

-- RLS
alter table estudiantes enable row level security;
alter table progresos enable row level security;

-- Permite a cada profesor ver/crear solo sus estudiantes
drop policy if exists "profesor_ve_sus_estudiantes" on estudiantes;
create policy "profesor_ve_sus_estudiantes" on estudiantes
  for all using (profesor_id = auth.uid()) with check (profesor_id = auth.uid());

drop policy if exists "profesor_gestiona_progresos" on progresos;
create policy "profesor_gestiona_progresos" on progresos
  for all using (
    exists (select 1 from estudiantes where estudiantes.id = progresos.estudiante_id and estudiantes.profesor_id = auth.uid())
  ) with check (
    exists (select 1 from estudiantes where estudiantes.id = progresos.estudiante_id and estudiantes.profesor_id = auth.uid())
  );

-- Verifica
select 'Tablas creadas OK' as estado;
