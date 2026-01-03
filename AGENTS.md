# Repository Guidelines

## Project Structure & Module Organization

Proyecto Svelte + Vite (SPA, client-only) con enfoque de Arquitectura Limpia. Mantiene dependencias hacia dentro:

- `src/domain/` entidades y reglas de negocio puras (sin framework).
- `src/usecases/` casos de uso que orquestan el dominio.
- `src/interfaces/` contratos y adaptadores (mappers, DTOs, ports).
- `src/infrastructure/` detalles tecnicos (fetch, cache, storage).
- `src/ui/` componentes Svelte, stores de UI y estilos.
- `public/` assets estaticos servidos tal cual.
- `index.html` punto de entrada de la SPA.

Si introduces nuevas carpetas (e.g. `src/services/`, `src/stores/`), documenta brevemente el proposito.

## Rendering Strategy (Client-only)

Las consultas deben ejecutarse en el cliente para evitar consumo de CPU en Vercel. Evita SSR y funciones server; usa `fetch` directo desde el navegador y cacheado en cliente cuando aplique.

## Build, Test, and Development Commands

- `npm run dev` - servidor de desarrollo Vite.
- `npm run build` - build de produccion.
- `npm run preview` - preview del build.

## Coding Style & Naming Conventions

- Indentacion: 2 espacios.
- Componentes Svelte en `PascalCase.svelte` dentro de `src/ui/`.
- Archivos JS en `kebab-case` o `camelCase`, pero se consistente.
- Al instalar dependencias, usa versiones fijas sin el prefijo `^` en `package.json`.

## Clean Architecture Notes

- El dominio no puede depender de Svelte, stores ni API externas.
- Los casos de uso solo conocen interfaces (ports) y entidades del dominio.
- La infraestructura implementa interfaces y puede usar `fetch`, `localStorage` o caches.
- La UI solo llama a casos de uso; evita logica de negocio en componentes.

## Styling & UI

- Tailwind CSS + DaisyUI para el estilo base.
- Configuracion en `tailwind.config.cjs` y `postcss.config.cjs`.
- Estilos globales en `src/app.css`.

## Testing Guidelines

No hay framework de pruebas configurado. Si se anade:

- Nombra los tests con `.spec` y documenta el comando en `package.json`.
- Manten los tests cerca de `src/` o en `tests/`.

## Commit & Pull Request Guidelines

Usa Conventional Commits (`feat:`, `fix:`, `chore:`). Los mensajes de commit deben estar en inglés. En PRs: resumen claro y pasos de prueba.
Si el usuario pide varias cosas diferentes, separa los cambios en commits distintos.

## Security & Configuration Tips

No subas `.env`. Documenta variables de entorno en `README.md` si aparecen.

## Gestion de tareas y horas

- Al empezar, identifica el `projectId` en `../../dashboard/data/projects.json`.
- Busca si ya existe una tarea "En curso" en `../../dashboard/data/projects-tasks.json` para ese `projectId`.
- Si existe, registra el tiempo en `../../dashboard/data/task-entries.json` con `taskId`, `date` (`dd/mm/aaaa`), `hours` y `note`; añade siempre una nota en `../../dashboard/data/task-notes.json`.
- Si no existe, crea una nueva tarea (recomendado: `node ../../dashboard/scripts/add-task.js` desde el monorepo) o edita a mano en `projects-tasks.json` con `id` incremental, `title`, `projectId`, `phase`, `status`, `ownerId`, `startDate`, `endDate`, y luego añade la entrada de horas en `task-entries.json`.
- El `ownerId` debe existir en `../../dashboard/data/people.json`.
- Proyecto de referencia para este repo: `gas-price-finder`.
