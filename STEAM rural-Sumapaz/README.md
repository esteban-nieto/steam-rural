# STEAM Rural — Aplicación de escritorio

Software educativo para talleres de robótica creativa con material reciclado en la Provincia del Sumapaz. La aplicación de escritorio se construye con Tauri; React y Vite se usan internamente para su interfaz.

## Requisitos

- Node.js 20 o posterior
- Rust y Cargo
- En Windows: Microsoft C++ Build Tools y WebView2

## Desarrollo

Desde esta carpeta:

```powershell
npm install
npm run tauri:dev
```

## Crear la aplicación de escritorio

```powershell
npm run tauri:build
```

Tauri genera los instaladores en `src-tauri/target/release/bundle`.

## Carpeta para compartir

La carpeta incluye `app.exe` como lanzador y `Instalador STEAM rural-Sumapaz.exe`.
Al abrir el lanzador, este inicia la app instalada; si no está instalada, abre el
instalador que está en la misma carpeta. Mantén juntos esos dos ejecutables al
compartir la carpeta.

`launcher.rs` es el código fuente del lanzador. Para regenerar `app.exe` en
Windows con Rust instalado:

```powershell
rustc .\launcher.rs -O -o .\app.exe
```

Para volver a compilar el proyecto, instala las dependencias con `npm ci` y
ejecuta `npm run tauri:build`.

## Configuración

Si se utilizan los servicios de Supabase, copia `.env.example` a `.env` y configura allí las variables requeridas. No publiques ese archivo ni sus credenciales.
