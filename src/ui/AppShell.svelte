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

  onMount(() => {
    fuelSearch.init();
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

<main data-theme="light" class="min-h-screen bg-base-100 text-base-content">
  <div
    class="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--gpf-accent)/0.25),transparent_70%)]"
  ></div>
  <div class="mx-auto max-w-5xl px-4 py-6 md:py-10">
    <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <div class="grid h-12 w-12 place-items-center rounded-2xl bg-base-200">
          <img src="/logo.png" alt="Gas Price Finder" class="h-8 w-8" />
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-base-content/60">Gas Price Finder</p>
          <h1 class="text-2xl font-semibold md:text-3xl">Busca el mejor precio cerca</h1>
          <p class="text-sm text-base-content/70">
            Consulta precios actualizados por codigo postal.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-sm text-base-content/60">
          Resultados: <span class="font-semibold">{stations.length}</span>
        </div>
        <button class="btn btn-ghost btn-sm" type="button" on:click={fuelSearch.clear}>
          Limpiar
        </button>
      </div>
    </header>

    <section class="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div class="card border border-base-200 bg-base-100/90 shadow-xl backdrop-blur">
        <div class="card-body gap-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold">Busqueda rapida</h2>
              <p class="text-xs text-base-content/60">
                Rellena el codigo postal y elige combustible.
              </p>
            </div>
            <button
              class="btn btn-ghost btn-sm md:hidden"
              type="button"
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
            <p class="text-xs uppercase tracking-[0.2em] text-base-content/60">
              Filtros aplicados
            </p>
            <div class="mt-2 flex flex-wrap gap-2 text-xs">
              <span class="badge badge-outline">
                CP: {$fuelSearch.postalCode || "Sin codigo"}
              </span>
              <span class="badge badge-outline">{selectedFuelLabel}</span>
            </div>
          </div>

          <div class={`space-y-4 ${isSearchCollapsed ? "hidden md:block" : ""}`}>
            {#if $fuelSearch.favorites.length > 0}
              <div class="space-y-3">
                <p class="text-xs uppercase tracking-[0.2em] text-base-content/60">
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
                        class="text-xs text-base-content/60"
                        type="button"
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
                placeholder="28001"
                inputmode="numeric"
                class="input input-bordered w-full"
                value={$fuelSearch.postalCode}
                on:input={(event) => {
                  fuelSearch.setPostalCode(event.target.value);
                }}
              />
            </label>
            <div class="rounded-2xl border border-base-200 bg-base-200/40 p-3">
              <p class="text-xs uppercase tracking-[0.2em] text-base-content/60">
                Ayuda
              </p>
              <p class="mt-2 text-xs text-base-content/60">
                El codigo postal debe tener 5 digitos.
              </p>
            </div>

            <div class="space-y-2">
              <p class="text-sm font-medium">Combustibles</p>
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
            </div>

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

      <div class="space-y-4">
        <div class="stats stats-horizontal border border-base-200 bg-base-100 shadow">
          <div class="stat">
            <div class="stat-title">Minimo</div>
            <div class="stat-value text-primary">
              {priceStats.min != null ? priceStats.min.toFixed(3) : "--"}
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">Promedio</div>
            <div class="stat-value">
              {priceStats.avg != null ? priceStats.avg.toFixed(3) : "--"}
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">Maximo</div>
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
          <div class="alert alert-error">
            <span>{$fuelSearch.errorMessage}</span>
          </div>
        {:else if $fuelSearch.response.status === "ready" && formattedStations.length === 0}
          <div class="alert alert-info">
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
                        class="text-sm text-base-content/60 underline-offset-4 hover:underline"
                        href={station.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {station.address}
                      </a>
                    {:else}
                      <p class="text-sm text-base-content/60">{station.address}</p>
                    {/if}
                  </div>
                  {#if station.fuelLabel}
                    <span class={`badge badge-outline ${station.fuelBadgeClass ?? ""}`}>
                      {station.fuelLabel}
                    </span>
                  {/if}
                </div>
                <div class="flex flex-wrap items-center gap-3 text-sm">
                  <span class="badge badge-neutral">{station.price}</span>
                  {#if station.update}
                    <span class="text-base-content/70">{station.update}</span>
                  {/if}
                  {#if station.schedule}
                    <span class="text-base-content/60">{station.schedule}</span>
                  {/if}
                </div>
                <div class="card-actions justify-end pt-2">
                  {#if station.mapUrl}
                    <a
                      class="btn btn-sm btn-ghost"
                      href={station.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver ruta
                    </a>
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
              <p class="text-sm text-base-content/60">
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
