# Gas Price Finder

Buscador de precios de combustibles con Svelte + Vite. Cliente ligero, API propia en Vercel y cache diaria (reset a las 08:00).

## Stack

- Svelte + Vite (SPA)
- Tailwind CSS + DaisyUI
- API serverless en Vercel (`/api/fuel-prices`)
- Arquitectura Limpia en `src/`

## Estructura

- `src/domain/` entidades y reglas de negocio
- `src/usecases/` casos de uso
- `src/interfaces/` contratos
- `src/infrastructure/` detalles (HTTP, cache, storage)
- `src/ui/` componentes, stores y utilidades
- `api/` endpoints Vercel
- `public/` assets estaticos e iconos

## Comandos

- `npm run dev` - Vite dev server
- `npm run dev:api` - servidor local para `/api`
- `npm run build` - build de produccion
- `npm run preview` - preview del build

## Desarrollo local

En local la API no la sirve Vite. Arranca ambos:

1. `npm run dev:api`
2. `npm run dev`

## Produccion (Vercel)

La API vive en `api/fuel-prices.js` y se despliega como Serverless Function. La UI llama a `/api/fuel-prices`.

## Cache

- Cliente: `localStorage` con expiracion diaria a las 08:00.
- Servidor: cache en memoria por funcion y `s-maxage` hasta el siguiente reset.

## TLS upstream

El upstream usa cadena FNMT. Para evitar errores TLS en Node, se incluye:

- `src/infrastructure/ca/fnmt-chain.pem`
- `undici` con `Agent` y `ca` personalizado

## Instalacion como app

Se soporta instalacion en Chrome y Safari:

- `public/site.webmanifest`
- `public/sw.js`
- metas en `index.html`

## Notas

- No hay variables de entorno necesarias.
- Si cambias el API upstream, revisa CORS/TLS.
