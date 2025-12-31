<script>
  import { onMount } from "svelte";

  import {
    fuelBadgeClassById,
    fuelLabelById,
    fuelProductCatalog,
  } from "../infrastructure/fuel-catalog.js";
  import { fuelSearch } from "./stores/fuel-search-store.js";
  import {
    buildFormattedStations,
    calculatePriceStats,
  } from "./utils/fuel-format.js";
  import CookieConsent from "./components/CookieConsent.svelte";

  let isSearchCollapsed = false;
  let wasLoading = false;
  let theme = "light";

  onMount(() => {
    fuelSearch.init();
    theme = document.documentElement.getAttribute("data-theme") || "light";
  });

  $: stations = $fuelSearch.response?.result?.estaciones ?? [];
  $: formattedStations = buildFormattedStations(stations, {
    fuelLabelById,
    fuelBadgeClassById,
  });
  $: priceStats = calculatePriceStats(stations);
  $: selectedFuelLabel = $fuelSearch.selectedProductId
    ? fuelLabelById[$fuelSearch.selectedProductId] ?? "Combustible"
    : "Sin combustible";
  $: {
    if (wasLoading && !$fuelSearch.isLoading) {
      isSearchCollapsed = true;
    }
    wasLoading = $fuelSearch.isLoading;
  }
</script>

<main class="min-h-screen bg-base-100 text-base-content">
  <div
    class="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--gpf-accent)/0.25),transparent_70%)]"
  ></div>
  <div class="mx-auto max-w-5xl px-4 py-6 md:py-10">
    <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <div class="grid h-12 w-12 place-items-center rounded-2xl bg-base-200">
          <img
            src="/logo-64.png"
            srcset="/logo-64.png 64w, /logo-128.png 128w"
            sizes="32px"
            alt="Gas Price Finder"
            class="h-8 w-8"
            width="32"
            height="32"
            loading="eager"
          />
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.35em] gpf-muted">Gas Price Finder</p>
          <h1 class="text-2xl font-semibold md:text-3xl">Busca el mejor precio cerca</h1>
          <p class="text-sm gpf-muted">
            Consulta precios actualizados por codigo postal.
          </p>
        </div>
      </div>
      <button
        class="btn btn-ghost btn-sm ml-auto"
        type="button"
        aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        on:click={() => {
          theme = theme === "dark" ? "light" : "dark";
          document.documentElement.setAttribute("data-theme", theme);
          try {
            localStorage.setItem("gpf-theme", theme);
          } catch {
            // ignore storage access
          }
        }}
      >
        {#if theme === "dark"}
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="M4.93 4.93l1.41 1.41"></path>
            <path d="M17.66 17.66l1.41 1.41"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="M4.93 19.07l1.41-1.41"></path>
            <path d="M17.66 6.34l1.41-1.41"></path>
          </svg>
          <span class="sr-only">Modo claro</span>
        {:else}
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"></path>
          </svg>
          <span class="sr-only">Modo oscuro</span>
        {/if}
      </button>
    </header>

    <section class="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div class="card border border-base-200 bg-base-100/90 shadow-xl backdrop-blur">
        <div class="card-body gap-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold">Busqueda rapida</h2>
              <p class="text-xs gpf-muted">
                Rellena el codigo postal y elige combustible.
              </p>
            </div>
            <button
              class="btn btn-ghost btn-sm md:hidden"
              type="button"
              aria-expanded={isSearchCollapsed}
              aria-controls="search-panel"
              on:click={() => {
                isSearchCollapsed = !isSearchCollapsed;
              }}
            >
              {isSearchCollapsed ? "Editar" : "Minimizar"}
            </button>
          </div>

          <div
            class={`rounded-2xl border border-base-200 bg-base-200/40 p-3 md:hidden ${
              isSearchCollapsed ? "block" : "hidden"
            }`}
          >
            <p class="text-xs uppercase tracking-[0.2em] gpf-muted">
              Filtros aplicados
            </p>
            <div class="mt-2 flex flex-wrap gap-2 text-xs">
              <span class="badge badge-outline">
                CP: {$fuelSearch.postalCode || "Sin codigo"}
              </span>
              <span class="badge badge-outline">{selectedFuelLabel}</span>
            </div>
          </div>

          <div
            id="search-panel"
            class={`space-y-4 ${isSearchCollapsed ? "hidden md:block" : ""}`}
          >
            {#if $fuelSearch.favorites.length > 0}
              <div class="space-y-3">
                <p class="text-xs uppercase tracking-[0.2em] gpf-muted">
                  Favoritos
                </p>
                <div class="flex flex-wrap gap-2">
                  {#each $fuelSearch.favorites as favorite}
                    <div class="flex items-center gap-2 rounded-full border border-base-200 px-3 py-1">
                      <button
                        class="text-xs font-semibold"
                        type="button"
                        on:click={() => fuelSearch.selectFavorite(favorite)}
                      >
                        {favorite.name} - {favorite.postalCode}
                      </button>
                      <button
                        class="text-xs gpf-muted"
                        type="button"
                        aria-label={`Quitar favorito ${favorite.name} ${favorite.postalCode}`}
                        on:click={() => fuelSearch.removeFavorite(favorite)}
                      >
                        Quitar
                      </button>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <label class="form-control gap-2">
              <span class="text-sm font-medium">Codigo postal</span>
              <input
                type="text"
                id="postal-code"
                placeholder="28001"
                inputmode="numeric"
                autocomplete="postal-code"
                aria-describedby="postal-help"
                class="input input-bordered w-full"
                value={$fuelSearch.postalCode}
                on:input={(event) => {
                  fuelSearch.setPostalCode(event.target.value);
                }}
              />
            </label>
            <div
              id="postal-help"
              class="rounded-2xl border border-base-200 bg-base-200/40 p-3"
            >
              <p class="text-xs uppercase tracking-[0.2em] gpf-muted">
                Ayuda
              </p>
              <p class="mt-2 text-xs gpf-muted">
                El codigo postal debe tener 5 digitos.
              </p>
            </div>

            <fieldset class="space-y-2">
              <legend class="text-sm font-medium">Combustibles</legend>
              {#each fuelProductCatalog as option}
                <label class="flex items-center gap-3">
                  <input
                    type="radio"
                    name="fuel-product"
                    class="radio radio-sm"
                    checked={$fuelSearch.selectedProductId === option.id}
                    on:change={() => fuelSearch.setSelectedProductId(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              {/each}
            </fieldset>

            <button class="btn btn-ghost w-full" type="button" on:click={fuelSearch.clear}>
              Limpiar
            </button>
            <button
              class="btn btn-primary w-full"
              type="button"
              class:loading={$fuelSearch.isLoading}
              disabled={$fuelSearch.isLoading}
              on:click={fuelSearch.search}
            >
              Buscar precios
            </button>
            <button
              class="btn btn-outline w-full"
              type="button"
              on:click={fuelSearch.openFavoriteModal}
            >
              Guardar
            </button>
          </div>

        </div>
      </div>

      <div class="space-y-4" aria-busy={$fuelSearch.isLoading}>
        <div class="text-sm gpf-muted" aria-live="polite">
          Resultados: <span class="font-semibold">{stations.length}</span>
        </div>
        <p class="text-xs gpf-muted">Ordenados por el más barato.</p>
        <div class="stats stats-horizontal border border-base-200 bg-base-100 shadow">
          <div class="stat">
            <div class="stat-title gpf-muted">Minimo</div>
            <div class="stat-value text-primary">
              {priceStats.min != null ? priceStats.min.toFixed(3) : "--"}
            </div>
          </div>
          <div class="stat">
            <div class="stat-title gpf-muted">Promedio</div>
            <div class="stat-value">
              {priceStats.avg != null ? priceStats.avg.toFixed(3) : "--"}
            </div>
          </div>
          <div class="stat">
            <div class="stat-title gpf-muted">Maximo</div>
            <div class="stat-value text-secondary">
              {priceStats.max != null ? priceStats.max.toFixed(3) : "--"}
            </div>
          </div>
        </div>

        {#if $fuelSearch.isLoading}
          <div class="grid gap-3">
            {#each Array(3) as _}
              <article class="card border border-base-200 bg-base-100/95 shadow">
                <div class="card-body gap-3">
                  <div class="skeleton h-5 w-3/4"></div>
                  <div class="skeleton h-4 w-full"></div>
                  <div class="flex gap-3">
                    <div class="skeleton h-4 w-24"></div>
                    <div class="skeleton h-4 w-20"></div>
                  </div>
                </div>
              </article>
            {/each}
          </div>
        {:else if $fuelSearch.errorMessage}
          <div class="alert alert-error" role="alert">
            <span>{$fuelSearch.errorMessage}</span>
          </div>
        {:else if $fuelSearch.response.status === "ready" && formattedStations.length === 0}
          <div class="alert alert-info" role="status">
            <span>No hay resultados todavia.</span>
          </div>
        {/if}

        <div class="grid gap-3">
          {#each formattedStations as station}
            <article class="card border border-base-200 bg-base-100/95 shadow">
              <div class="card-body gap-2">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <h3 class="text-lg font-semibold">{station.title}</h3>
                    {#if station.mapUrl}
                      <a
                        class="text-sm gpf-muted underline underline-offset-4"
                        href={station.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {station.address}
                      </a>
                    {:else}
                      <p class="text-sm gpf-muted">{station.address}</p>
                    {/if}
                  </div>
                  {#if station.fuelLabel}
                    <span class={`badge ${station.fuelBadgeClass ?? "badge-outline"}`}>
                      {station.fuelLabel}
                    </span>
                  {/if}
                </div>
                <div class="flex flex-wrap items-center gap-3 text-sm">
                  <span class="badge badge-neutral">{station.price}</span>
                  {#if station.update}
                    <span class="gpf-muted">{station.update}</span>
                  {/if}
                  {#if station.schedule}
                    <span class="gpf-muted">{station.schedule}</span>
                  {/if}
                </div>
              </div>
            </article>
          {/each}
        </div>
      </div>
    </section>
  </div>

  {#if $fuelSearch.isFavoriteModalOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="card w-full max-w-md border border-base-200 bg-base-100 shadow-xl">
        <div class="card-body gap-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-lg font-semibold">Guardar favorito</div>
              <p class="text-sm gpf-muted">
                Guarda el codigo postal y la seleccion actual de combustibles.
              </p>
            </div>
            <button class="btn btn-ghost btn-sm" type="button" on:click={fuelSearch.closeFavoriteModal}>
              Cerrar
            </button>
          </div>

          <label class="form-control gap-2">
            <span class="text-sm font-medium">Nombre</span>
            <input
              type="text"
              class="input input-bordered w-full"
              value={$fuelSearch.favoriteName}
              on:input={(event) => {
                fuelSearch.setFavoriteName(event.target.value);
              }}
            />
          </label>

          {#if $fuelSearch.favoriteError}
            <div class="alert alert-error">
              <span>{$fuelSearch.favoriteError}</span>
            </div>
          {/if}

          <div class="flex justify-end gap-2">
            <button class="btn btn-ghost btn-sm" type="button" on:click={fuelSearch.closeFavoriteModal}>
              Cancelar
            </button>
            <button class="btn btn-primary btn-sm" type="button" on:click={fuelSearch.saveFavorite}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</main>

<CookieConsent />
