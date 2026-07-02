import { FuelPriceSearchStatus } from "../interfaces/fuel-price-repository.js";
import { getCacheExpirationMs } from "./fuel-price-cache.js";
import {
  buildSearchPayload,
  getFuelPricesCacheKey,
} from "./fuel-price-request.js";

const fuelPriceApiUrl = "/api/fuel-prices";

function readCachedResult(payload) {
  if (typeof localStorage === "undefined") return null;
  const cacheKey = getFuelPricesCacheKey(payload);
  const cachedRaw = localStorage.getItem(cacheKey);
  if (!cachedRaw) return null;

  try {
    const cached = JSON.parse(cachedRaw);
    if (!cached || typeof cached !== "object") return null;
    const expiresAt = Number(cached.expiresAt ?? 0);
    if (Number.isNaN(expiresAt) || Date.now() > expiresAt) return null;
    return cached.result ?? null;
  } catch {
    return null;
  }
}

function writeCachedResult(payload, result) {
  if (typeof localStorage === "undefined") return;
  const cacheKey = getFuelPricesCacheKey(payload);
  const expiresAt = Date.now() + getCacheExpirationMs();
  const payloadValue = JSON.stringify({ expiresAt, result });
  localStorage.setItem(cacheKey, payloadValue);
}

async function fetchFuelPrices(payload) {
  const response = await fetch(fuelPriceApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      postalCode: payload.codPostal,
      productId: payload.idProducto,
    }),
  });

  if (!response.ok) {
    throw new Error(`Fuel prices request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data?.result ?? null;
}

export class FuelPriceRepositoryImpl {
  async searchStations(criteria) {
    try {
      const payload = buildSearchPayload(criteria);
      const cached = readCachedResult(payload);
      if (cached) {
        return { result: cached, status: FuelPriceSearchStatus.READY };
      }

      const result = await fetchFuelPrices(payload);
      if (!result) {
        return { result: null, status: FuelPriceSearchStatus.ERROR };
      }
      writeCachedResult(payload, result);

      return { result, status: FuelPriceSearchStatus.READY };
    } catch {
      return { result: null, status: FuelPriceSearchStatus.ERROR };
    }
  }
}
