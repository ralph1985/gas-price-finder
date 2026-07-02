# Repository Guidelines

## Project Structure & Module Organization

Proyecto Svelte + Vite (SPA) con API serverless mínima en Vercel y enfoque de Arquitectura Limpia. Mantiene dependencias hacia dentro:

- `src/domain/` entidades y reglas de negocio puras (sin framework).
- `src/application/` composition root y ensamblaje de casos de uso con implementaciones concretas.
- `src/usecases/` casos de uso que orquestan el dominio.
- `src/interfaces/` contratos y adaptadores (mappers, DTOs, ports).
- `src/infrastructure/` detalles técnicos (fetch, cache, storage).
- `src/ui/` componentes Svelte, stores de UI y estilos.
- `api/` funciones serverless de Vercel usadas como proxy técnico cuando el navegador no puede llamar al upstream directamente.
- `public/` assets estáticos servidos tal cual.
- `index.html` punto de entrada de la SPA.

Si introduces nuevas carpetas (e.g. `src/services/`, `src/stores/`), documenta brevemente el propósito.

## Rendering Strategy (SPA + Serverless API)

La aplicación se renderiza en cliente como SPA; evita SSR. Las consultas de precios pasan por `/api/fuel-prices`, una función serverless de Vercel que actúa como proxy técnico hacia el upstream del Geoportal, incluyendo el manejo TLS/FNMT y caché compartida.

Mantener el consumo de CPU en Vercel bajo:

- No introduzcas SSR ni renderizado dinámico de páginas.
- No añadas nuevas funciones serverless salvo que haya una razón técnica clara (CORS, TLS, secretos o normalización imprescindible).
- Cachea en cliente con `localStorage` cuando aplique.
- Mantén la caché serverless hasta el siguiente reset diario para evitar llamadas repetidas al upstream.
- La UI debe llamar a casos de uso; los detalles de `/api` y del upstream pertenecen a infraestructura.

## Build, Test, and Development Commands

- `npm run dev` - servidor de desarrollo Vite.
- `npm run dev:api` - servidor local para `/api/fuel-prices` en `localhost:8787`.
- `npm run build` - build de producción.
- `npm run preview` - preview del build.

## Coding Style & Naming Conventions

- Indentación: 2 espacios.
- Componentes Svelte en `PascalCase.svelte` dentro de `src/ui/`.
- Archivos JS en `kebab-case` o `camelCase`, pero se consistente.
- Al instalar dependencias, usa versiones fijas sin el prefijo `^` en `package.json`.

## Clean Architecture Notes

- El dominio no puede depender de Svelte, stores ni API externas.
- Los casos de uso solo conocen interfaces (ports) y entidades del dominio.
- La infraestructura implementa interfaces y puede usar `fetch`, `localStorage`, caches o la función `/api/fuel-prices`.
- La UI solo llama a casos de uso; evita lógica de negocio en componentes.

## Styling & UI

- Tailwind CSS + DaisyUI para el estilo base.
- Configuración en `tailwind.config.cjs` y `postcss.config.cjs`.
- Estilos globales en `src/app.css`.

## Testing Guidelines

No hay framework de pruebas configurado. Si se añade:

- Nombra los tests con `.spec` y documenta el comando en `package.json`.
- Mantén los tests cerca de `src/` o en `tests/`.

## Commit & Pull Request Guidelines

Usa Conventional Commits (`feat:`, `fix:`, `chore:`). Los mensajes de commit deben estar en inglés. En PRs: resumen claro y pasos de prueba.
Si el usuario pide varias cosas diferentes, separa los cambios en commits distintos.

## Security & Configuration Tips

No subas `.env`. Documenta variables de entorno en `README.md` si aparecen.

## Gestión de tareas y horas

- Al empezar, identifica el `projectId` en `../../dashboard/data/projects.json`.
- Busca si ya existe una tarea "En curso" en `../../dashboard/data/projects-tasks.json` para ese `projectId`.
- Si existe, registra el tiempo en `../../dashboard/data/task-entries.json` con `taskId`, `date` (`dd/mm/aaaa`), `hours` y `note`; añade siempre una nota en `../../dashboard/data/task-notes.json`.
- Si no existe, crea una nueva tarea (recomendado: `node ../../dashboard/scripts/add-task.js` desde el monorepo) o edita a mano en `projects-tasks.json` con `id` incremental, `title`, `projectId`, `phase`, `status`, `ownerId`, `startDate`, `endDate`, y luego añade la entrada de horas en `task-entries.json`.
- El `ownerId` debe existir en `../../dashboard/data/people.json`.
- Proyecto de referencia para este repo: `gas-price-finder`.
