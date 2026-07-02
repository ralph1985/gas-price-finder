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
    calculatePriceStatsByFuel,
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
  $: priceStatsByFuel = calculatePriceStatsByFuel(stations, {
    fuelLabelById,
    fuelBadgeClassById,
    selectedProductIds: $fuelSearch.selectedProductIds,
  });
  $: selectedFuelLabels = $fuelSearch.selectedProductIds
    .map((productId) => fuelLabelById.get(productId))
    .filter(Boolean);
  $: selectedFuelLabel =
    selectedFuelLabels.length > 0
      ? selectedFuelLabels.join(", ")
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
    <header class="flex items-start gap-3">
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
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs uppercase tracking-[0.35em] gpf-muted">Gas Price Finder</p>
        <div class="flex items-center justify-between gap-3">
          <h1 class="text-2xl font-semibold md:text-3xl">Busca el mejor precio cerca</h1>
          <button
            class="btn btn-ghost btn-sm"
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
        </div>
        <p class="text-sm gpf-muted">
          Consulta precios actualizados por código postal.
        </p>
      </div>
    </header>

    <section class="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div class="card border border-base-200 bg-base-100/90 shadow-xl backdrop-blur">
        <div class="card-body gap-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold">Búsqueda rápida</h2>
              <p class="text-xs gpf-muted">
                Rellena el código postal y elige uno o varios combustibles.
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
                CP: {$fuelSearch.postalCode || "Sin código"}
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
              <span class="text-sm font-medium">Código postal</span>
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
              <span id="postal-help" class="text-xs gpf-muted">
                5 dígitos. Si no lo sabes, usa las opciones de ubicación.
              </span>
            </label>
            {#if $fuelSearch.detectedPostalCodeMessage}
              <div class="alert alert-success py-2" role="status">
                <span>{$fuelSearch.detectedPostalCodeMessage}</span>
              </div>
            {/if}
            {#if $fuelSearch.locationError}
              <div class="alert alert-warning" role="alert">
                <span>{$fuelSearch.locationError}</span>
                <button
                  class="btn btn-ghost btn-xs"
                  type="button"
                  aria-label="Cerrar aviso"
                  on:click={fuelSearch.clearLocationError}
                >
                  ✕
                </button>
              </div>
            {/if}

            <details class="collapse collapse-arrow border border-base-200 bg-base-200/40">
              <summary class="collapse-title text-sm font-medium">
                No se mi código postal
              </summary>
              <div class="collapse-content space-y-3">
                <p class="text-xs gpf-muted">
                  Usa tu ubicación o escribe una ciudad, zona o dirección.
                </p>
                <button
                  class="btn btn-outline w-full"
                  type="button"
                  disabled={$fuelSearch.isLocating}
                  on:click={fuelSearch.locatePostalCode}
                >
                  {$fuelSearch.isLocating ? "Buscando código postal..." : "Usar mi ubicación"}
                </button>
                <label class="form-control gap-2">
                  <span class="text-sm font-medium">Ciudad, zona o dirección</span>
                  <input
                    type="text"
                    id="location-query"
                    placeholder="Valencia centro"
                    autocomplete="street-address"
                    aria-describedby="location-query-help"
                    class="input input-bordered w-full"
                    value={$fuelSearch.locationQuery}
                    on:input={(event) => {
                      fuelSearch.setLocationQuery(event.target.value);
                    }}
                    on:keydown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        fuelSearch.findPostalCodeByLocationQuery();
                      }
                    }}
                  />
                </label>
                <p id="location-query-help" class="text-xs gpf-muted">
                  Cuanto más concreta sea la dirección, más probable es detectar un código postal.
                </p>
                <button
                  class="btn btn-outline w-full"
                  type="button"
                  disabled={$fuelSearch.isSearchingLocationQuery}
                  on:click={fuelSearch.findPostalCodeByLocationQuery}
                >
                  {$fuelSearch.isSearchingLocationQuery ? "Buscando código postal..." : "Buscar por ubicación"}
                </button>
                {#if $fuelSearch.locationQueryError}
                  <div class="alert alert-warning" role="alert">
                    <span>{$fuelSearch.locationQueryError}</span>
                    <button
                      class="btn btn-ghost btn-xs"
                      type="button"
                      aria-label="Cerrar aviso"
                      on:click={fuelSearch.clearLocationQueryError}
                    >
                      ✕
                    </button>
                  </div>
                {/if}
              </div>
            </details>

            <fieldset class="space-y-2">
              <legend class="text-sm font-medium">Combustibles</legend>
              {#each fuelProductCatalog as option}
                <label class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="fuel-product"
                    class="checkbox checkbox-sm"
                    checked={$fuelSearch.selectedProductIds.includes(option.id)}
                    on:change={() => fuelSearch.toggleSelectedProductId(option.id)}
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
          Estaciones: <span class="font-semibold">{formattedStations.length}</span>
        </div>
        <p class="text-xs gpf-muted">Ordenados por el más barato.</p>
        <div class="overflow-x-auto rounded-box border border-base-200 bg-base-100 shadow">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Combustible</th>
                <th class="text-right">Mínimo</th>
                <th class="text-right">Promedio</th>
                <th class="text-right">Máximo</th>
              </tr>
            </thead>
            <tbody>
              {#if priceStatsByFuel.length === 0}
                <tr>
                  <td class="gpf-muted" colspan="4">Sin precios para calcular estadísticas.</td>
                </tr>
              {:else}
                {#each priceStatsByFuel as fuelStats}
                  <tr>
                    <td>
                      <span class={`badge ${fuelStats.fuelBadgeClass}`}>
                        {fuelStats.fuelLabel}
                      </span>
                    </td>
                    <td class="text-right">
                      {fuelStats.min != null ? fuelStats.min.toFixed(3) : "--"}
                    </td>
                    <td class="text-right">
                      {fuelStats.avg != null ? fuelStats.avg.toFixed(3) : "--"}
                    </td>
                    <td class="text-right">
                      {fuelStats.max != null ? fuelStats.max.toFixed(3) : "--"}
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
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
            <span>No hay resultados todavía.</span>
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
                </div>
                <div class="flex flex-wrap items-center gap-2 text-sm">
                  {#each station.prices as priceItem}
                    <span class="badge gap-2 border-base-300 py-3">
                      {#if priceItem.fuelLabel}
                        <span class={`badge badge-sm ${priceItem.fuelBadgeClass ?? "badge-outline"}`}>
                          {priceItem.fuelLabel}
                        </span>
                      {/if}
                      <span>{priceItem.price}</span>
                    </span>
                  {/each}
                </div>
                <div class="flex flex-wrap items-center gap-3 text-sm">
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
                Guarda el código postal y la selección actual de combustibles.
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
