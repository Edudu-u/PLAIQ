# PLAIQ

Aplicación de escritorio de coaching personalizado para League of Legends.

## Funcionalidades actuales

- Panel de objetivos de entrenamiento.
- Navegación Resumen / Perfiles / Objetivos / Partidas.
- Identidad visual de centro táctico.
- Búsqueda de Riot ID mediante API-PLAIQ.
- Detalle de perfil tipo OP.GG: icono, nivel, ligas ranked y maestrías.
- Perfiles guardados por instalación.
- Historial de búsquedas.
- Sincronización de partidas recientes (Match-v5) desde un perfil guardado.
- Comunicación HTTP tipada con el backend.
- Base segura de Electron con aislamiento de contexto.
- Captura local de Live Client desde el proceso principal de Electron.
- Historial de sesiones capturadas con curvas temporales y métricas postpartida.
- Explorador de timeline Match-V5 por partida con hitos de minuto 5/10/15 y eventos destacados.
- Skill model agregado con cobertura por timeline disponible, tendencia entre bloques y seis dimensiones de entrenamiento.
- Coach IA con salida estructurada y referencias métricas.

## Inicio local

Primero configura y levanta API-PLAIQ. Después:

```bash
npm install
cp .env.example .env
npm run dev
```

La búsqueda inicial utiliza `Jøy Đ Bøy#NPM` como ejemplo editable y `LA2` como región.

## Persistencia

El cliente crea un UUID aleatorio en el almacenamiento local. API-PLAIQ utiliza este identificador para separar perfiles e historial hasta que incorporemos autenticación por correo. El PUUID y las claves permanecen únicamente en el backend.

## Requisitos

La visión completa del producto está en [`docs/REQUISITOS.md`](docs/REQUISITOS.md).

## Seguridad

Este repositorio no contiene claves de Riot ni OpenAI. React tampoco tiene acceso directo a las integraciones locales o secretos del proceso principal.

---

PLAIQ no está respaldado por Riot Games y no refleja las opiniones de Riot Games ni de ninguna persona involucrada oficialmente en la producción o administración de sus propiedades. Riot Games y todas las propiedades asociadas son marcas comerciales o marcas registradas de Riot Games, Inc.


## Coaching real

La vista **Coaching** ya no utiliza objetivos demo: consume el perfil activo y muestra un diagnóstico calculado sobre sus últimas partidas Ranked Solo, incluyendo métricas, tendencias, focos y objetivos medibles.

La interfaz separa visualmente los datos calculados de las recomendaciones generadas por IA para que cada conclusión tenga una fuente trazable.

## En vivo

**En vivo** conecta el cliente local de League con un collector aislado en Electron. Captura snapshots propios durante la partida, los persiste en API-PLAIQ y, al terminar, intenta enlazar la sesión con Match-v5 para recuperar resultado, cola y parche.

## Timeline y skill model

En **Perfiles → Historial de partidas**, abre una partida y selecciona **Sincronizar timeline** para importar los frames/eventos de Match-V5. Los datos persistidos permiten visualizar CS/oro a lo largo de la partida, diferenciales contra el rival de línea y eventos relevantes.

En **Coaching → Perfil de habilidades**, el botón **Sincronizar hasta 5 timelines** procesa un pequeño lote de ranked recientes. Las dimensiones (economía, control de línea, supervivencia temprana, combate, objetivos y visión) se calculan en la API; los datos insuficientes se muestran como N/D.

Los scores (0–100) son heurísticas transparentes de entrenamiento, no representan MMR, ELO ni una predicción de rango.

## Coach IA

El coach IA no recibe datos crudos para “adivinar” estadísticas. API-PLAIQ calcula primero las señales y luego entrega al modelo un contexto estructurado. La salida se valida con Structured Outputs + Zod, se registra con uso de tokens y se cachea por huella del contexto.