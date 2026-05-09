# Aurora · Sentir el Espacio

> Estación de Monitoreo Geofísico — Seguimiento en tiempo real del viento atmosférico, predicción de auroras y el cielo nocturno.

[![Demo en vivo](https://img.shields.io/badge/demo-en%20vivo-50FFB0?style=flat-square)](https://astro-monitor.vercel.app)

## Demo en vivo

**URL:** https://astro-monitor.vercel.app

**Credenciales de demo:**
- Usuario: `emilys`
- Contraseña: `emilyspass`

## Track elegido

- [x] Track A — SPA Declarativa (React Router + JWT cliente + i18n cliente)
- [ ] Track B — Framework Mode SSR

## Qué hace la aplicación

Aurora es un dashboard contemplativo-científico que permite "sentir el espacio":

- 🌍 **Viento Atmosférico** — datos de viento en tiempo real para 10 ciudades globales sobre un globo 3D interactivo, con animación de partículas de viento y sonificación (escucha el viento según su velocidad real)
- 🌌 **Predicción de Auroras** — índice Kp en vivo, forecast 72h, alertas activas, historial de 7 días y visibilidad por países
- ⭐ **Stellarium 3D** — cúpula estelar interactiva con posiciones reales de estrellas, líneas de constelaciones y Vía Láctea, sincronizada con tu ubicación y hora actual
- 📊 **Dashboard** — vista general estilo Pinterest con partículas de viento animadas, mini cúpula estelar y resumen de auroras

## APIs utilizadas

| API | Dominio | Datos | Refresco |
|---|---|---|---|
| **Open-Meteo** | Meteorología | Viento horario (velocidad, dirección, ráfagas) por coordenadas | React Query, staleTime 10min, cache por ciudad |
| **NOAA SWPC** | Clima espacial | Kp actual, forecast 72h, alertas, historial 7 días | React Query, refetchInterval 60s |

Ambas APIs son públicas y no requieren API key.

## Stack tecnológico

- React 19 + Vite 8
- React Router 7 (SPA Declarativa)
- TanStack Query 5
- Tailwind CSS v4
- Three.js + react-globe.gl (globo 3D + cúpula estelar)
- Tone.js (sonificación del viento)
- Recharts (gráficos de series temporales)
- Canvas 2D (partículas de viento + mini stellarium)
- Framer Motion (transiciones de página)
- Desplegado en Vercel

## Arquitectura

- **Routing:** `BrowserRouter` con prefijo `/:lang/*` para i18n. El locale se sincroniza desde los parámetros de URL.
- **Auth:** JWT via dummyjson, almacenado en `localStorage`. `AuthContext` expone `login/logout/user`. `ProtectedRoute` redirige usuarios anónimos.
- **Datos:** Capa React Query. Cada API tiene un `services/*.js` con el fetcher + `hooks/*.js` con cache keys tipadas, staleTime y polling.
- **i18n:** Sistema propio basado en Context. EN + ES, todas las cadenas en `src/locales/*.json`. El switch actualiza la URL sin recargar.
- **Sonificación:** Tone.js `Noise` → `Filter` (frecuencia mapeada a velocidad de viento) → `Volume` → `Destination`. Requiere gesto del usuario por política de audio del navegador.
- **Visualizaciones:** Three.js para globo 3D y cúpula estelar. Canvas 2D para campo de partículas de viento y mini stellarium. Recharts para datos temporales.

## Instalación local

```bash
npm install
npm run dev
```

No se requieren variables de entorno — ambas APIs son gratuitas y sin key.

```bash
npm run build    # compilar para producción
npm run preview  # previsualizar el build
```

## Declaración de uso de IA

Este proyecto fue desarrollado con asistencia de IA (Claude — Anthropic).

**La IA se usó para:**
- Scaffolding de servicios de API (Open-Meteo + normalización de NOAA)
- Patrones de React Query (cache keys, staleTime, intervalos de polling)
- Setup de Three.js para cúpula estelar y globo 3D
- Cadena de sonificación Tone.js (Noise → Filter → Volume)
- Algoritmo de campo de partículas de viento en Canvas 2D
- Arquitectura del sistema i18n
- Conversión de mockups HTML de Stitch a componentes React JSX
- Sistema de tokens de diseño en Tailwind v4 desde los tokens de Stitch
- Debugging del formato de arrays de NOAA (cabecera en fila 0)
- Generación de strings de localización EN/ES

**Decisiones y verificación humana:**
- Todo el diseño visual y dirección estética (mockups de Stitch)
- Selección de APIs y concepto del dominio (viento + auroras + stellarium)
- Nombre del producto, narrativa y decisiones de UX
- Todo el código leído, comprendido y probado por el autor
- Flujo de auth verificado manualmente contra dummyjson
- React Query verificado con DevTools
- Sonificación probada en Chrome y Firefox
- Configuración de despliegue en Vercel

**Declaración inline:** las funciones con contribución significativa de IA están marcadas con `// @ai-assisted` en el código fuente.

## Limitaciones conocidas

- La probabilidad de aurora basada en Kp es una heurística, no un modelo científico
- Las posiciones de estrellas son de un catálogo Hipparcos simplificado (no efemérides en tiempo real)
- El globo 3D carga la textura terrestre desde CDN unpkg (requiere internet)
- El layout está optimizado para escritorio
- El bundle es grande (~2.8MB) debido a Three.js y react-globe.gl

## Licencia

MIT