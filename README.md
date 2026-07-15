# PLAIQ

Aplicación de escritorio de coaching personalizado para League of Legends.

## Funcionalidades actuales

- Panel de objetivos de entrenamiento.
- Búsqueda de Riot ID mediante API-PLAIQ.
- Perfiles guardados por instalación.
- Historial de búsquedas.
- Comunicación HTTP tipada con el backend.
- Base segura de Electron con aislamiento de contexto.

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

## Seguridad

Este repositorio no contiene claves de Riot ni OpenAI. React tampoco tiene acceso directo a las integraciones locales o secretos del proceso principal.

---

PLAIQ no está respaldado por Riot Games y no refleja las opiniones de Riot Games ni de ninguna persona involucrada oficialmente en la producción o administración de sus propiedades. Riot Games y todas las propiedades asociadas son marcas comerciales o marcas registradas de Riot Games, Inc.
