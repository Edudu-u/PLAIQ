# PLAIQ

Aplicación de escritorio de coaching personalizado para League of Legends.

## Responsabilidades

- Mostrar el panel del jugador y sus objetivos.
- Ejecutar un HUD mínimo y configurable.
- Recopilar datos locales disponibles durante una partida.
- Enviar sesiones agrupadas a API-PLAIQ.
- Mostrar análisis y progreso calculados por el backend.

## Stack

- Electron
- React
- TypeScript
- Vite

## Inicio local

Primero levanta API-PLAIQ en el puerto 3000. Después:

```bash
npm install
cp .env.example .env
npm run dev
```

## Compilación

```bash
npm run typecheck
npm run build
```

## Arquitectura

El proceso principal de Electron será responsable de las integraciones locales. React nunca tendrá acceso directo a claves, credenciales del cliente ni APIs privadas. La API remota se ocupa de Riot Web API, persistencia, estadísticas e IA.

## Estado

Primera base técnica con comunicación HTTP real y datos demostrativos desde API-PLAIQ.

---

PLAIQ no está respaldado por Riot Games y no refleja las opiniones de Riot Games ni de ninguna persona involucrada oficialmente en la producción o administración de sus propiedades. Riot Games y todas las propiedades asociadas son marcas comerciales o marcas registradas de Riot Games, Inc.
