import { get, writable } from "svelte/store";

import { fuelLabelById, fuelProductIds } from "../../infrastructure/fuel-catalog.js";
import { listFuelPricesBatchUseCase } from "../../usecases/list-fuel-prices.js";
import { locatePostalCodeUseCase } from "../../usecases/locate-postal-code.js";
import {
  normalizePostalCode,
  postalCodePattern,
} from "../utils/fuel-format.js";

const fuelSelectionStorageKey = "gpf:fuelSelection";
const lastPostalCodeStorageKey = "gpf:lastPostalCode";
const fuelFavoritesStorageKey = "gpf:fuelFavorites";
const defaultProductId = fuelProductIds.includes("4") ? "4" : fuelProductIds[0];

const initialState = {
  postalCode: "",
  selectedProductId: defaultProductId,
  response: { status: "ready", result: null },
  isLoading: false,
  errorMessage: null,
  favorites: [],
  isFavoriteModalOpen: false,
  favoriteName: "",
  favoriteError: null,
  hasHydrated: false,
  isLocating: false,
  locationError: null,
};

const canUseStorage = () => typeof localStorage !== "undefined";
const getPostalPrefix = (postalCode) => postalCode.slice(0, 2);

const trackSearchEvent = ({ postalCode, productId, resultCount }) => {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  if (!postalCodePattern.test(postalCode)) return;

  window.gtag("event", "search_postal_code", {
    postal_prefix: getPostalPrefix(postalCode),
    fuel_id: productId,
    fuel_label: fuelLabelById.get(productId) ?? null,
    results_count: resultCount,
  });
};

const trackFavoriteEvent = ({ postalCode, productId, nameLength }) => {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  if (!postalCodePattern.test(postalCode)) return;

  window.gtag("event", "favorite_saved", {
    postal_prefix: getPostalPrefix(postalCode),
    fuel_id: productId,
    fuel_label: fuelLabelById.get(productId) ?? null,
    name_length: nameLength,
  });
};

export const fuelSearch = (() => {
  const store = writable(initialState);
  const { subscribe, update } = store;

  const persistSelection = (productId) => {
    if (!canUseStorage()) return;
    localStorage.setItem(fuelSelectionStorageKey, JSON.stringify(productId));
  };

  const persistFavorites = (favorites) => {
    if (!canUseStorage()) return;
    localStorage.setItem(fuelFavoritesStorageKey, JSON.stringify(favorites));
  };

  const persistPostalCode = (postalCode) => {
    if (!canUseStorage()) return;
    localStorage.setItem(lastPostalCodeStorageKey, postalCode);
  };

  const loadSelection = () => {
    if (!canUseStorage()) return null;
    const stored = localStorage.getItem(fuelSelectionStorageKey);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed === "string" && fuelProductIds.includes(parsed)) {
        return parsed;
      }
      if (Array.isArray(parsed)) {
        const sanitized = parsed.filter((value) => fuelProductIds.includes(value));
        return sanitized[0] ?? null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const loadFavorites = () => {
    if (!canUseStorage()) return [];
    const stored = localStorage.getItem(fuelFavoritesStorageKey);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed
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
          const productId =
            typeof value.productId === "string" && fuelProductIds.includes(value.productId)
              ? value.productId
              : productIds[0] ?? defaultProductId;
          return { ...value, productId };
        });
    } catch {
      return [];
    }
  };

  const init = () => {
    const storedPostalCode = canUseStorage()
      ? localStorage.getItem(lastPostalCodeStorageKey)
      : null;
    const nextPostalCode =
      storedPostalCode && postalCodePattern.test(storedPostalCode) ? storedPostalCode : "";
    const selection = loadSelection();
    const favorites = loadFavorites();

    update((state) => ({
      ...state,
      postalCode: nextPostalCode,
      selectedProductId: selection ?? state.selectedProductId,
      favorites,
      hasHydrated: true,
    }));

    void search();
  };

  const setPostalCode = (value) => {
    const normalized = normalizePostalCode(value);
    update((state) => {
      const nextState = { ...state, postalCode: normalized };
      if (state.hasHydrated && postalCodePattern.test(normalized)) {
        persistPostalCode(normalized);
      }
      return nextState;
    });
  };

  const setSelectedProductId = (value) => {
    if (!fuelProductIds.includes(value)) return;
    update((state) => {
      if (state.hasHydrated) {
        persistSelection(value);
      }
      return { ...state, selectedProductId: value };
    });
  };

  const openFavoriteModal = () => {
    update((state) => ({
      ...state,
      favoriteError: null,
      favoriteName: "",
      isFavoriteModalOpen: true,
    }));
  };

  const closeFavoriteModal = () => {
    update((state) => ({
      ...state,
      isFavoriteModalOpen: false,
      favoriteError: null,
    }));
  };

  const setFavoriteName = (value) => {
    update((state) => ({ ...state, favoriteName: value }));
  };

  const saveFavorite = () => {
    const state = get(store);
    const trimmedName = state.favoriteName.trim();
    const trimmedPostalCode = state.postalCode.trim();

    if (!trimmedName) {
      update((current) => ({
        ...current,
        favoriteError: "Pon un nombre para el favorito.",
      }));
      return;
    }
    if (!postalCodePattern.test(trimmedPostalCode)) {
      update((current) => ({
        ...current,
        favoriteError: "Codigo postal invalido.",
      }));
      return;
    }

    const nextFavorites = [
      ...state.favorites,
      {
        id: `${trimmedPostalCode}-${Date.now()}`,
        name: trimmedName,
        postalCode: trimmedPostalCode,
        productId: state.selectedProductId,
      },
    ];
    persistFavorites(nextFavorites);
    trackFavoriteEvent({
      postalCode: trimmedPostalCode,
      productId: state.selectedProductId,
      nameLength: trimmedName.length,
    });
    update((current) => ({
      ...current,
      favorites: nextFavorites,
      favoriteName: "",
      favoriteError: null,
      isFavoriteModalOpen: false,
    }));
  };

  const removeFavorite = (favorite) => {
    update((state) => {
      const nextFavorites = state.favorites.filter((item) => item.id !== favorite.id);
      persistFavorites(nextFavorites);
      return { ...state, favorites: nextFavorites };
    });
  };

  const selectFavorite = async (favorite) => {
    update((state) => ({
      ...state,
      postalCode: favorite.postalCode,
      selectedProductId: favorite.productId ?? state.selectedProductId,
    }));
    await search();
  };

  const clear = () => {
    update((state) => ({
      ...state,
      postalCode: "",
      selectedProductId: defaultProductId,
      response: { status: "ready", result: null },
      errorMessage: null,
    }));
  };

  const search = async () => {
    const state = get(store);
    const trimmedPostalCode = state.postalCode.trim();

    if (!postalCodePattern.test(trimmedPostalCode)) {
      update((current) => ({
        ...current,
        errorMessage: "Codigo postal invalido.",
        response: { status: "ready", result: null },
      }));
      return;
    }
    if (!state.selectedProductId) {
      update((current) => ({
        ...current,
        errorMessage: "Selecciona al menos un combustible.",
        response: { status: "ready", result: null },
      }));
      return;
    }

    update((current) => ({
      ...current,
      isLoading: true,
      errorMessage: null,
    }));

    const nextResponse = await listFuelPricesBatchUseCase(
      { postalCode: trimmedPostalCode },
      [state.selectedProductId]
    );

    trackSearchEvent({
      postalCode: trimmedPostalCode,
      productId: state.selectedProductId,
      resultCount: nextResponse?.result?.estaciones?.length ?? 0,
    });

    update((current) => ({
      ...current,
      response: nextResponse,
      isLoading: false,
      errorMessage:
        nextResponse.status === "ready"
          ? null
          : "No se han podido cargar los precios ahora mismo.",
    }));
  };

  const locatePostalCode = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      update((state) => ({
        ...state,
        locationError: "La geolocalizacion no esta disponible en este navegador.",
      }));
      return;
    }

    update((state) => ({
      ...state,
      isLocating: true,
      locationError: null,
    }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const postalCode = await locatePostalCodeUseCase({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            signal: controller.signal,
          });

          if (!postalCode) {
            throw new Error("No se ha encontrado un codigo postal valido.");
          }

          setPostalCode(postalCode);
          await search();
          update((state) => ({
            ...state,
            isLocating: false,
            locationError: null,
          }));
        } catch {
          update((state) => ({
            ...state,
            isLocating: false,
            locationError:
              "No se ha podido obtener el codigo postal desde la ubicacion.",
          }));
        } finally {
          clearTimeout(timeout);
        }
      },
      (error) => {
        clearTimeout(timeout);
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Permiso de ubicacion denegado."
            : error.code === error.TIMEOUT
              ? "Tiempo de espera agotado al obtener la ubicacion."
              : "No se ha podido acceder a la ubicacion.";

        update((state) => ({
          ...state,
          isLocating: false,
          locationError: message,
        }));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000,
      }
    );
  };

  return {
    subscribe,
    init,
    setPostalCode,
    setSelectedProductId,
    openFavoriteModal,
    closeFavoriteModal,
    setFavoriteName,
    saveFavorite,
    removeFavorite,
    selectFavorite,
    clear,
    search,
    locatePostalCode,
  };
})();
