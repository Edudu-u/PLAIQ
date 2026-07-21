# Requisitos de producto — PLAIQ (escritorio)

Ver también el documento completo en `API-PLAIQ/docs/REQUISITOS.md`. Este archivo resume lo que debe hacer la aplicación de escritorio.

## Rol del cliente

PLAIQ Desktop es un cliente liviano:

1. Mostrar coaching, objetivos y progreso.
2. Vincular / buscar Riot ID vía API-PLAIQ.
3. Recopilar datos locales de Live Client (`127.0.0.1:2999`) durante la partida.
4. Enviar sesiones/snapshots a la API al terminar (o por lotes).
5. Opcionalmente mostrar un HUD no invasivo solo con metas predefinidas.

## Lo que NO debe hacer

- Guardar Riot API Key u OpenAI API Key.
- Pedir o mostrar PUUID.
- Dar instrucciones tácticas en tiempo real.
- Cubrir minimapa/habilidades o imitar overlays invasivos tipo “copiloto”.

## Navegación prevista

| Vista | Propósito |
|---|---|
| Resumen | Enfoque del día, mensaje del coach, estado de conexión |
| Perfiles | Búsqueda Riot ID, perfiles guardados, historial de búsquedas |
| Objetivos | Metas de entrenamiento activas y progreso |
| Partidas | Historial sincronizado y punto de entrada al análisis |

## Identidad visual

Centro táctico propio de PLAIQ (no dashboard SaaS genérico):

- Marca **PLAIQ** como señal hero.
- Atmósfera con profundidad (rejilla / radar), tipografía expresiva.
- Acentos por rol cuando exista perfil de entrenamiento.
- Animaciones cortas al completar objetivos y al cambiar de vista.

## Fases del escritorio

1. Panel + búsqueda de perfiles + objetivos demo — hecho.
2. Vista Partidas con sync Match-v5 — en curso.
3. Recopilador Live Client + envío de `game-sessions`.
4. HUD mínimo de objetivos.
5. Auth por correo y suscripción.
