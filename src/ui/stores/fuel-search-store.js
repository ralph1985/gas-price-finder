import { get, writable } from "svelte/store";

import {
  findPostalCodeByLocationQueryUseCase,
  listFuelPricesBatchUseCase,
  locatePostalCodeUseCase,
} from "../../application/usecases.js";
import { fuelLabelById, fuelProductIds } from "../../infrastructure/fuel-catalog.js";
import {
  normalizePostalCode,
  postalCodePattern,
} from "../utils/fuel-format.js";

const fuelSelectionStorageKey = "gpf:fuelSelection";
const lastPostalCodeStorageKey = "gpf:lastPostalCode";
const fuelFavoritesStorageKey = "gpf:fuelFavorites";
const defaultProductId = fuelProductIds.includes("4") ? "4" : fuelProductIds[0];
const defaultProductIds = [defaultProductId];

const initialState = {
  postalCode: "",
  selectedProductIds: defaultProductIds,
  response: { status: "ready", result: null },
  isLoading: false,
  errorMessage: null,
  favorites: [],
  isFavoriteModalOpen: false,
  favoriteName: "",
  favoriteError: null,
  favoriteSuccessMessage: null,
  hasHydrated: false,
  isLocating: false,
  locationError: null,
  locationQuery: "",
  isSearchingLocationQuery: false,
  locationQueryError: null,
  detectedPostalCodeMessage: null,
};

const canUseStorage = () => typeof localStorage !== "undefined";
const getPostalPrefix = (postalCode) => postalCode.slice(0, 2);

const sanitizeProductIds = (values) => {
  const productIds = Array.isArray(values) ? values : [values];
  return productIds.filter(
    (value, index) =>
      typeof value === "string" &&
      fuelProductIds.includes(value) &&
      productIds.indexOf(value) === index
  );
};

const getFavoriteKey = ({ postalCode, productIds }) =>
  `${postalCode}:${sanitizeProductIds(productIds).sort().join(",")}`;

const trackSearchEvent = ({ postalCode, productIds, resultCount }) => {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  if (!postalCodePattern.test(postalCode)) return;

  window.gtag("event", "search_postal_code", {
    postal_prefix: getPostalPrefix(postalCode),
    fuel_ids: productIds,
    fuel_labels: productIds.map((productId) => fuelLabelById.get(productId)).filter(Boolean),
    fuel_count: productIds.length,
    results_count: resultCount,
  });
};

const trackFavoriteEvent = ({ postalCode, productIds, nameLength }) => {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  if (!postalCodePattern.test(postalCode)) return;

  window.gtag("event", "favorite_saved", {
    postal_prefix: getPostalPrefix(postalCode),
    fuel_ids: productIds,
    fuel_labels: productIds.map((productId) => fuelLabelById.get(productId)).filter(Boolean),
    fuel_count: productIds.length,
    name_length: nameLength,
  });
};

export const fuelSearch = (() => {
  const store = writable(initialState);
  const { subscribe, update } = store;

  const persistSelection = (productIds) => {
    if (!canUseStorage()) return;
    localStorage.setItem(fuelSelectionStorageKey, JSON.stringify(productIds));
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
      if (typeof parsed === "string") {
        const sanitized = sanitizeProductIds(parsed);
        return sanitized.length > 0 ? sanitized : null;
      }
      if (Array.isArray(parsed)) {
        const sanitized = sanitizeProductIds(parsed);
        return sanitized;
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
          const productIds = sanitizeProductIds(value.productIds);
          const legacyProductIds = sanitizeProductIds(value.productId);
          return {
            ...value,
            productIds:
              productIds.length > 0
                ? productIds
                : legacyProductIds.length > 0
                  ? legacyProductIds
                  : defaultProductIds,
          };
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
      selectedProductIds: selection ?? state.selectedProductIds,
      favorites,
      hasHydrated: true,
    }));

    void search();
  };

  const setPostalCode = (value) => {
    const normalized = normalizePostalCode(value);
    update((state) => {
      const nextState = {
        ...state,
        postalCode: normalized,
        detectedPostalCodeMessage: null,
        favoriteSuccessMessage: null,
      };
      if (state.hasHydrated && postalCodePattern.test(normalized)) {
        persistPostalCode(normalized);
      }
      return nextState;
    });
  };

  const setLocationQuery = (value) => {
    update((state) => ({
      ...state,
      locationQuery: value,
      locationQueryError: null,
    }));
  };

  const toggleSelectedProductId = (value) => {
    if (!fuelProductIds.includes(value)) return;
    update((state) => {
      const selectedProductIds = state.selectedProductIds.includes(value)
        ? state.selectedProductIds.filter((productId) => productId !== value)
        : [...state.selectedProductIds, value];
      if (state.hasHydrated) {
        persistSelection(selectedProductIds);
      }
      return { ...state, selectedProductIds, favoriteSuccessMessage: null };
    });
  };

  const openFavoriteModal = () => {
    const state = get(store);
    if (!postalCodePattern.test(state.postalCode) || state.selectedProductIds.length === 0) {
      update((current) => ({
        ...current,
        favoriteError: "Busca con un código postal válido antes de guardar.",
        favoriteSuccessMessage: null,
      }));
      return;
    }

    update((state) => ({
      ...state,
      favoriteError: null,
      favoriteSuccessMessage: null,
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
    update((state) => ({
      ...state,
      favoriteName: value,
      favoriteError: null,
      favoriteSuccessMessage: null,
    }));
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
        favoriteError: "Código postal inválido.",
      }));
      return;
    }
    if (state.selectedProductIds.length === 0) {
      update((current) => ({
        ...current,
        favoriteError: "Selecciona al menos un combustible.",
      }));
      return;
    }

    const favoriteKey = getFavoriteKey({
      postalCode: trimmedPostalCode,
      productIds: state.selectedProductIds,
    });
    const hasDuplicate = state.favorites.some(
      (favorite) => getFavoriteKey(favorite) === favoriteKey
    );
    if (hasDuplicate) {
      update((current) => ({
        ...current,
        favoriteError: "Ya tienes guardada esta búsqueda.",
        favoriteSuccessMessage: null,
      }));
      return;
    }

    const nextFavorites = [
      ...state.favorites,
      {
        id: `${trimmedPostalCode}-${Date.now()}`,
        name: trimmedName,
        postalCode: trimmedPostalCode,
        productIds: state.selectedProductIds,
      },
    ];
    persistFavorites(nextFavorites);
    trackFavoriteEvent({
      postalCode: trimmedPostalCode,
      productIds: state.selectedProductIds,
      nameLength: trimmedName.length,
    });
    update((current) => ({
      ...current,
      favorites: nextFavorites,
      favoriteName: "",
      favoriteError: null,
      favoriteSuccessMessage: "Favorito guardado.",
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
      selectedProductIds:
        favorite.productIds?.length > 0 ? favorite.productIds : state.selectedProductIds,
      favoriteSuccessMessage: null,
    }));
    await search();
  };

  const clear = () => {
    update((state) => ({
      ...state,
      postalCode: "",
      selectedProductIds: defaultProductIds,
      response: { status: "ready", result: null },
      errorMessage: null,
      favoriteError: null,
      favoriteSuccessMessage: null,
      locationError: null,
      locationQueryError: null,
      detectedPostalCodeMessage: null,
    }));
  };

  const search = async () => {
    const state = get(store);
    const trimmedPostalCode = state.postalCode.trim();

    if (!postalCodePattern.test(trimmedPostalCode)) {
      update((current) => ({
        ...current,
        errorMessage: "Código postal inválido.",
        response: { status: "ready", result: null },
      }));
      return;
    }
    if (state.selectedProductIds.length === 0) {
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
      state.selectedProductIds
    );

    trackSearchEvent({
      postalCode: trimmedPostalCode,
      productIds: state.selectedProductIds,
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
        locationError: "La geolocalización no está disponible en este navegador.",
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
            throw new Error("No se ha encontrado un código postal válido.");
          }

          setPostalCode(postalCode);
          persistPostalCode(postalCode);
          await search();
          update((state) => ({
            ...state,
            isLocating: false,
            locationError: null,
            detectedPostalCodeMessage: `Código postal detectado: ${postalCode}`,
          }));
        } catch {
          update((state) => ({
            ...state,
            isLocating: false,
            locationError:
              "No se ha podido obtener el código postal desde la ubicación.",
          }));
        } finally {
          clearTimeout(timeout);
        }
      },
      (error) => {
        clearTimeout(timeout);
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Permiso de ubicación denegado."
            : error.code === error.TIMEOUT
              ? "Tiempo de espera agotado al obtener la ubicación."
              : "No se ha podido acceder a la ubicación.";

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

  const findPostalCodeByLocationQuery = async () => {
    const state = get(store);
    const query = state.locationQuery.trim();
    if (!query) {
      update((current) => ({
        ...current,
        locationQueryError: "Escribe una ciudad, zona o dirección.",
      }));
      return;
    }

    update((current) => ({
      ...current,
      isSearchingLocationQuery: true,
      locationQueryError: null,
    }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const postalCode = await findPostalCodeByLocationQueryUseCase({
        query,
        signal: controller.signal,
      });

      if (!postalCode) {
        throw new Error("No se ha encontrado un código postal válido.");
      }

      setPostalCode(postalCode);
      persistPostalCode(postalCode);
      await search();
      update((current) => ({
        ...current,
        isSearchingLocationQuery: false,
        locationQueryError: null,
        detectedPostalCodeMessage: `Código postal detectado: ${postalCode}`,
      }));
    } catch {
      update((current) => ({
        ...current,
        isSearchingLocationQuery: false,
        locationQueryError:
          "No se ha encontrado un código postal. Prueba con una dirección más concreta.",
      }));
    } finally {
      clearTimeout(timeout);
    }
  };

  const clearLocationError = () => {
    update((state) => ({ ...state, locationError: null }));
  };

  const clearLocationQueryError = () => {
    update((state) => ({ ...state, locationQueryError: null }));
  };

  return {
    subscribe,
    init,
    setPostalCode,
    setLocationQuery,
    toggleSelectedProductId,
    openFavoriteModal,
    closeFavoriteModal,
    setFavoriteName,
    saveFavorite,
    removeFavorite,
    selectFavorite,
    clear,
    search,
    locatePostalCode,
    findPostalCodeByLocationQuery,
    clearLocationError,
    clearLocationQueryError,
  };
})();
