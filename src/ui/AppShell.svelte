<script>
  import { onMount, tick } from "svelte";
  import {
    fuelBadgeClassById,
    fuelLabelById,
    fuelProductCatalog,
    fuelProductIds,
  } from "../infrastructure/fuel-catalog.js";
  import { listFuelPricesBatchUseCase } from "../usecases/list-fuel-prices.js";

  const postalCodePattern = /^\d{5}$/;
  const fuelSelectionStorageKey = "gpf:fuelSelection";
  const lastPostalCodeStorageKey = "gpf:lastPostalCode";
  const fuelFavoritesStorageKey = "gpf:fuelFavorites";
  const defaultProductIds = ["4", "1"].filter((id) => fuelProductIds.includes(id));

  let postalCode = "";
  let selectedProductIds = [...defaultProductIds];
  let response = { status: "ready", result: null };
  let isLoading = false;
  let errorMessage = null;
  let hasHydrated = false;
  let favorites = [];
  let isFavoriteModalOpen = false;
  let favoriteName = "";
  let favoriteError = null;

  const normalizePostalCode = (value) => value.replace(/\D/g, "").slice(0, 5);

  const formatPrice = (value) => {
    if (value == null) return null;
    return `${value.toFixed(3)} EUR`;
  };

  const formatUpdateLabel = (dateValue, timeValue) => {
    const parts = [dateValue, timeValue].filter(Boolean);
    if (parts.length === 0) return null;
    return `Actualizado: ${parts.join(" ")}`;
  };

  const buildMapsSearchUrl = (query) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  const loadFuelSelection = () => {
    const stored = localStorage.getItem(fuelSelectionStorageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;
      const sanitized = parsed.filter((value) => fuelProductIds.includes(value));
      if (sanitized.length > 0) {
        selectedProductIds = sanitized;
      }
    } catch {
      return;
    }
  };

  const persistFuelSelection = (selection) => {
    localStorage.setItem(fuelSelectionStorageKey, JSON.stringify(selection));
  };

  const loadFavorites = () => {
    const stored = localStorage.getItem(fuelFavoritesStorageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;
      favorites = parsed
        .filter(
          (value) =>
            value &&
            typeof value === "object" &&
            typeof value.id === "string" &&
            typeof value.name === "string" &&
            typeof value.postalCode === "string"
        )
        .map((value) => {
          const productIds = Array.isArray(value.productIds)
            ? value.productIds.filter((id) => fuelProductIds.includes(id))
            : [];
          return { ...value, productIds };
        });
    } catch {
      return;
    }
  };

  const persistFavorites = () => {
    localStorage.setItem(fuelFavoritesStorageKey, JSON.stringify(favorites));
  };

  const triggerSearch = async () => {
    if (!postalCodePattern.test(postalCode)) {
      return;
    }
    if (selectedProductIds.length === 0) {
      return;
    }
    await handleSearch();
  };

  onMount(() => {
    const storedPostalCode = localStorage.getItem(lastPostalCodeStorageKey);
    if (storedPostalCode && postalCodePattern.test(storedPostalCode)) {
      postalCode = storedPostalCode;
    }
    loadFuelSelection();
    loadFavorites();
    hasHydrated = true;
    void triggerSearch();
  });

  $: if (hasHydrated) {
    persistFuelSelection(selectedProductIds);
  }

  $: if (hasHydrated && postalCodePattern.test(postalCode)) {
    localStorage.setItem(lastPostalCodeStorageKey, postalCode);
  }

  $: if (hasHydrated) {
    persistFavorites();
  }

  $: stations = response.result?.estaciones ?? [];

  $: formattedStations = [...stations]
    .sort((a, b) => {
      const priceA = a.precio ?? Number.POSITIVE_INFINITY;
      const priceB = b.precio ?? Number.POSITIVE_INFINITY;
      return priceA - priceB;
    })
    .map((station, index) => {
      const info = station.estacion ?? {};
      const title = info.rotulo ?? "Estacion sin nombre";
      const addressParts = [info.direccion, info.municipio, info.provincia].filter(Boolean);
      const address = addressParts.join(" - ") || "Direccion no disponible";
      const mapQuery = addressParts.join(", ");
      const update = formatUpdateLabel(info.fechaPvp, info.horaPvp);
      const price = formatPrice(station.precio) ?? "Sin precio";
      const fuelLabel = station.fuelId ? fuelLabelById.get(station.fuelId) : null;
      const fuelBadgeClass = station.fuelId ? fuelBadgeClassById[station.fuelId] : null;

      return {
        key: `${info.id ?? title}-${station.fuelId ?? "unknown"}-${index}`,
        title,
        address,
        mapUrl: mapQuery ? buildMapsSearchUrl(mapQuery) : null,
        update,
        price,
        schedule: info.horario,
        fuelLabel,
        fuelBadgeClass,
      };
    });

  const calculatePriceStats = (items) => {
    const values = items
      .map((station) => station.precio)
      .filter((value) => typeof value === "number");
    if (values.length === 0) {
      return { min: null, avg: null, max: null };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;

    return { min, avg, max };
  };

  $: priceStats = calculatePriceStats(stations);

  const toggleFuelSelection = (id) => {
    if (selectedProductIds.includes(id)) {
      selectedProductIds = selectedProductIds.filter((value) => value !== id);
      return;
    }
    selectedProductIds = [...selectedProductIds, id];
  };

  const handleClear = () => {
    postalCode = "";
    selectedProductIds = [...defaultProductIds];
    response = { status: "ready", result: null };
    errorMessage = null;
  };

  const handleOpenFavoriteModal = () => {
    favoriteError = null;
    favoriteName = "";
    isFavoriteModalOpen = true;
  };

  const handleSaveFavorite = () => {
    const trimmedName = favoriteName.trim();
    const trimmedPostalCode = postalCode.trim();

    if (!trimmedName) {
      favoriteError = "Pon un nombre para el favorito.";
      return;
    }
    if (!postalCodePattern.test(trimmedPostalCode)) {
      favoriteError = "Codigo postal invalido.";
      return;
    }

    favorites = [
      ...favorites,
      {
        id: `${trimmedPostalCode}-${Date.now()}`,
        name: trimmedName,
        postalCode: trimmedPostalCode,
        productIds: [...selectedProductIds],
      },
    ];
    favoriteName = "";
    favoriteError = null;
    isFavoriteModalOpen = false;
  };

  const handleSelectFavorite = async (favorite) => {
    postalCode = favorite.postalCode;
    if (Array.isArray(favorite.productIds) && favorite.productIds.length > 0) {
      selectedProductIds = favorite.productIds.filter((id) => fuelProductIds.includes(id));
    }
    await tick();
    await triggerSearch();
  };

  const handleRemoveFavorite = (favorite) => {
    favorites = favorites.filter((item) => item.id !== favorite.id);
  };

  const handleSearch = async () => {
    const trimmedPostalCode = postalCode.trim();

    if (!postalCodePattern.test(trimmedPostalCode)) {
      errorMessage = "Codigo postal invalido.";
      response = { status: "ready", result: null };
      return;
    }
    if (selectedProductIds.length === 0) {
      errorMessage = "Selecciona al menos un combustible.";
      response = { status: "ready", result: null };
      return;
    }

    isLoading = true;
    errorMessage = null;

    const nextResponse = await listFuelPricesBatchUseCase(
      { postalCode: trimmedPostalCode },
      selectedProductIds
    );

    response = nextResponse;
    if (nextResponse.status !== "ready") {
      errorMessage = "No se han podido cargar los precios ahora mismo.";
    }
    isLoading = false;
  };
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
            Consulta precios actualizados por codigo postal.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-sm text-base-content/60">
          Resultados: <span class="font-semibold">{stations.length}</span>
        </div>
        <button class="btn btn-ghost btn-sm" type="button" on:click={handleClear}>
          Limpiar
        </button>
      </div>
    </header>

    <section class="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div class="card border border-base-200 bg-base-100/90 shadow-xl backdrop-blur">
        <div class="card-body gap-4">
          <div>
            <h2 class="text-lg font-semibold">Busqueda rapida</h2>
            <p class="text-xs text-base-content/60">
              Rellena el codigo postal y elige combustible.
            </p>
          </div>

          <label class="form-control gap-2">
            <span class="text-sm font-medium">Codigo postal</span>
            <input
              type="text"
              placeholder="28001"
              inputmode="numeric"
              class="input input-bordered w-full"
              value={postalCode}
              on:input={(event) => {
                postalCode = normalizePostalCode(event.target.value);
              }}
            />
          </label>

          <div class="space-y-2">
            <p class="text-sm font-medium">Combustibles</p>
            {#each fuelProductCatalog as option}
              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  checked={selectedProductIds.includes(option.id)}
                  on:change={() => toggleFuelSelection(option.id)}
                />
                <span>{option.label}</span>
              </label>
            {/each}
          </div>

          <button
            class="btn btn-primary w-full"
            type="button"
            class:loading={isLoading}
            disabled={isLoading}
            on:click={handleSearch}
          >
            Buscar precios
          </button>
          <button class="btn btn-outline w-full" type="button" on:click={handleOpenFavoriteModal}>
            Guardar
          </button>

          <div class="rounded-2xl border border-base-200 bg-base-200/40 p-3">
            <p class="text-xs uppercase tracking-[0.2em] text-base-content/60">Ayuda</p>
            <p class="mt-2 text-xs text-base-content/60">
              El codigo postal debe tener 5 digitos.
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        {#if favorites.length > 0}
          <div class="flex flex-wrap gap-2">
            {#each favorites as favorite}
              <div class="flex items-center gap-2 rounded-full border border-base-200 px-3 py-1">
                <button
                  class="text-xs font-semibold"
                  type="button"
                  on:click={() => handleSelectFavorite(favorite)}
                >
                  {favorite.name} - {favorite.postalCode}
                </button>
                <button
                  class="text-xs text-base-content/60"
                  type="button"
                  on:click={() => handleRemoveFavorite(favorite)}
                >
                  Quitar
                </button>
              </div>
            {/each}
          </div>
        {/if}
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

        {#if isLoading}
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
        {:else if errorMessage}
          <div class="alert alert-error">
            <span>{errorMessage}</span>
          </div>
        {:else if response.status === "ready" && formattedStations.length === 0}
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

  {#if isFavoriteModalOpen}
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
            <button class="btn btn-ghost btn-sm" type="button" on:click={() => (isFavoriteModalOpen = false)}>
              Cerrar
            </button>
          </div>

          <label class="form-control gap-2">
            <span class="text-sm font-medium">Nombre</span>
            <input
              type="text"
              class="input input-bordered w-full"
              value={favoriteName}
              on:input={(event) => {
                favoriteName = event.target.value;
              }}
            />
          </label>

          {#if favoriteError}
            <div class="alert alert-error">
              <span>{favoriteError}</span>
            </div>
          {/if}

          <div class="flex justify-end gap-2">
            <button class="btn btn-ghost btn-sm" type="button" on:click={() => (isFavoriteModalOpen = false)}>
              Cancelar
            </button>
            <button class="btn btn-primary btn-sm" type="button" on:click={handleSaveFavorite}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</main>
