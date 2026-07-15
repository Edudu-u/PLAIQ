# PLAIQ

Aplicación de escritorio de coaching personalizado para League of Legends.

## Responsabilidades

- Mostrar el panel del jugador y sus objetivos de entrenamiento.
- Ejecutar un HUD mínimo y no invasivo.
- Recopilar datos disponibles localmente durante una partida.
- Enviar sesiones normalizadas a API-PLAIQ.
- Mostrar análisis y progreso recibidos desde la API.

## Stack inicial

- Electron
- React
- TypeScript
- Vite

## Inicio local

```bash
npm install
npm run dev
```

Copia `.env.example` como `.env` si necesitas cambiar la URL de la API.

## Seguridad

Este repositorio no debe contener claves de Riot ni OpenAI. Todas las credenciales privadas pertenecen al backend.

## Estado

Primera base técnica. La integración con el cliente de League se añadirá después de validar el flujo aplicación → API → aplicación.

---

PLAIQ no está respaldado por Riot Games y no refleja las opiniones de Riot Games ni de ninguna persona involucrada oficialmente en la producción o administración de sus propiedades. Riot Games y todas las propiedades asociadas son marcas comerciales o marcas registradas de Riot Games, Inc.
