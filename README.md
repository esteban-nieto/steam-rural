# STEAM Rural — Software educativo

Plataforma web para talleres de robótica creativa con material reciclado (Provincia Sur del Sumapaz). Funciona en GitHub Pages + Supabase, con soporte **offline** (PWA) y sincronización al reconectar.

## Stack
React + Vite + TypeScript + Tailwind + Zustand + Dexie (IndexedDB) + Supabase + vite-plugin-pwa

## Estructura
- `src/routes/Auth` — Login / Registro profesor (Supabase Auth)
- `src/routes/Profesor/Home` — Múltiples cursos por profesor, CRUD estudiantes (nombre + curso)
- `src/routes/Estudiante/Home` — Tarjetas de actividades (ej. Origami) + registro emociones (emoji inicio)
- `src/routes/Estudiante/Origami` — Paso a paso con tus imágenes + progreso + emoción final
- `src/services/sync.ts` — Cola offline → Supabase al recuperar conexión

## Requisitos
Node 20+

## Desarrollo local
```bash
cd "F:\Esteban\Opcion de grado\app"
npm install
cp .env.example .env  # y rellena VITE_SUPABASE_URL / ANON_KEY
npm run dev           # http://localhost:5173
npm run build         # genera dist/
```

## Supabase (obligatorio para login multi-profesor)
1. Crea proyecto en https://supabase.com
2. Auth → habilita Email/Password
3. SQL Editor → ejecuta:
```sql
create table estudiantes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  curso text not null,
  profesor_id uuid references auth.users(id),
  created_at timestamp default now()
);
create table progresos (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid references estudiantes(id),
  actividad_id text,
  estado text,
  pasos_completados int[],
  emocion_inicio text,
  emocion_fin text,
  fecha timestamp default now()
);
alter table estudiantes enable row level security;
alter table progresos enable row level security;
-- políticas: cada profesor solo ve sus estudiantes
create policy "profesor ve sus estudiantes" on estudiantes for all using (profesor_id = auth.uid());
```
4. Copia URL y anon key a `.env` y a los Secrets del repo (`Settings → Secrets → Actions`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

## Deploy a GitHub Pages
```bash
git add .
git commit -m "init: STEAM Rural PWA"
# crea repo en GitHub y luego:
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```
Activa Pages: `Settings → Pages → Source: GitHub Actions`. El workflow `.github/workflows/deploy.yml` publica `dist/` automáticamente en cada push a `main`.

Luego será app de escritorio: `npm run build` y envolver `dist/` con Tauri/Electron sin reescribir código.

## Origami
Coloca tus imágenes en `public/origami/paso1.jpg`, `paso2.jpg`... El componente las carga desde `/origami/`. Cada figura es una entrada en `ACTIVIDADES_PREDETERMINADAS` (ver `src/services/supabase.ts`).

## Siguientes pasos
- Conectar Supabase real (reemplazar placeholder en `.env`)
- Añadir más tarjetas STEAM (ciencia, tecnología, etc.)
- Informe por curso / exportación CSV
