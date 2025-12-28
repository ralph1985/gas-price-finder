<script>
  const stations = [
    {
      name: "Alfa Energia",
      address: "Av. Norte 12",
      price: "1.579",
      fuel: "Diesel A",
      distance: "2.4 km",
      updated: "hace 18 min",
    },
    {
      name: "Ruta 24",
      address: "Ctra. Comarcal 5",
      price: "1.612",
      fuel: "Gasolina 95",
      distance: "3.1 km",
      updated: "hace 22 min",
    },
    {
      name: "Sol y Rueda",
      address: "Calle Mayor 82",
      price: "1.648",
      fuel: "Gasolina 98",
      distance: "4.6 km",
      updated: "hace 35 min",
    },
  ];
</script>

<main data-theme="light" class="min-h-screen bg-base-100 text-base-content">
  <div
    class="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--gpf-accent)/0.25),transparent_70%)]"
  ></div>
  <div class="mx-auto max-w-5xl px-4 py-6 md:py-10">
    <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <div class="grid h-12 w-12 place-items-center rounded-2xl bg-neutral text-neutral-content">
          GPF
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-base-content/60">Gas Price Finder</p>
          <h1 class="text-2xl font-semibold md:text-3xl">Busca el mejor precio cerca</h1>
          <p class="text-sm text-base-content/70">
            Consulta precios actualizados y guarda tus busquedas favoritas.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn btn-ghost btn-sm">Avisos</button>
        <button class="btn btn-neutral btn-sm">Guardar busqueda</button>
      </div>
    </header>

    <section class="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div class="card border border-base-200 bg-base-100/90 shadow-xl backdrop-blur">
        <div class="card-body gap-4">
          <div>
            <h2 class="text-lg font-semibold">Busqueda rapida</h2>
            <p class="text-xs text-base-content/60">Rellena el codigo postal y elige combustible.</p>
          </div>

          <label class="form-control gap-2">
            <span class="text-sm font-medium">Codigo postal</span>
            <input
              type="text"
              placeholder="28001"
              inputmode="numeric"
              class="input input-bordered w-full"
            />
          </label>

          <label class="form-control gap-2">
            <span class="text-sm font-medium">Radio de busqueda</span>
            <select class="select select-bordered w-full">
              <option>5 km</option>
              <option>10 km</option>
              <option>25 km</option>
              <option>50 km</option>
            </select>
          </label>

          <div class="space-y-2">
            <p class="text-sm font-medium">Combustibles</p>
            <label class="flex items-center gap-3">
              <input type="checkbox" class="checkbox checkbox-sm" checked />
              <span>Diesel A</span>
            </label>
            <label class="flex items-center gap-3">
              <input type="checkbox" class="checkbox checkbox-sm" />
              <span>Diesel Premium</span>
            </label>
            <label class="flex items-center gap-3">
              <input type="checkbox" class="checkbox checkbox-sm" checked />
              <span>Gasolina 95</span>
            </label>
            <label class="flex items-center gap-3">
              <input type="checkbox" class="checkbox checkbox-sm" />
              <span>Gasolina 98</span>
            </label>
          </div>

          <label class="form-control gap-2">
            <span class="text-sm font-medium">Ordenar por</span>
            <select class="select select-bordered w-full">
              <option>Precio mas bajo</option>
              <option>Mas cercano</option>
              <option>Mas reciente</option>
            </select>
          </label>

          <button class="btn btn-primary w-full">Buscar precios</button>

          <div class="rounded-2xl border border-base-200 bg-base-200/40 p-3">
            <p class="text-xs uppercase tracking-[0.2em] text-base-content/60">Busquedas recientes</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <span class="badge badge-outline">28001</span>
              <span class="badge badge-outline">28880</span>
              <span class="badge badge-outline">02006</span>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="stats stats-vertical border border-base-200 bg-base-100 shadow md:stats-horizontal">
          <div class="stat">
            <div class="stat-title">Minimo</div>
            <div class="stat-value text-primary">1.579</div>
            <div class="stat-desc">Diesel A</div>
          </div>
          <div class="stat">
            <div class="stat-title">Promedio</div>
            <div class="stat-value">1.621</div>
            <div class="stat-desc">Ultimas 12 estaciones</div>
          </div>
          <div class="stat">
            <div class="stat-title">Maximo</div>
            <div class="stat-value text-secondary">1.702</div>
            <div class="stat-desc">Gasolina 98</div>
          </div>
        </div>

        <div class="grid gap-3">
          {#each stations as station}
            <article class="card border border-base-200 bg-base-100/95 shadow">
              <div class="card-body gap-2">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-lg font-semibold">{station.name}</h3>
                    <p class="text-sm text-base-content/60">{station.address}</p>
                  </div>
                  <span class="badge badge-primary badge-outline">{station.fuel}</span>
                </div>
                <div class="flex flex-wrap items-center gap-3 text-sm">
                  <span class="badge badge-neutral">EUR {station.price}</span>
                  <span class="text-base-content/70">{station.distance}</span>
                  <span class="text-base-content/60">{station.updated}</span>
                </div>
                <div class="card-actions justify-between pt-2">
                  <button class="btn btn-sm btn-ghost">Ver ruta</button>
                  <button class="btn btn-sm btn-neutral">Guardar</button>
                </div>
              </div>
            </article>
          {/each}
        </div>
      </div>
    </section>
  </div>
</main>
