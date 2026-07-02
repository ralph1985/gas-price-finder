import { readFileSync } from "node:fs";
import { Agent } from "undici";

import { FuelPriceSearchStatus } from "../interfaces/fuel-price-repository.js";
import { getCacheExpirationMs } from "./fuel-price-cache.js";
import {
  buildSearchPayload,
  getFuelPricesCacheKey,
} from "./fuel-price-request.js";

const fuelPriceApiUrl =
  "https://geoportalgasolineras.es/geoportal/rest/busquedaEstaciones";

const cache = new Map();
const caBundle = readFileSync(new URL("./ca/fnmt-chain.pem", import.meta.url), "utf8");
const dispatcher = new Agent({
  connect: {
    ca: caBundle,
  },
});

function readCache(payload) {
  const cacheKey = getFuelPricesCacheKey(payload);
  const cached = cache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    cache.delete(cacheKey);
    return null;
  }
  return cached.result;
}

function writeCache(payload, result) {
  const cacheKey = getFuelPricesCacheKey(payload);
  cache.set(cacheKey, {
    expiresAt: Date.now() + getCacheExpirationMs(),
    result,
  });
}

async function fetchFuelPrices(payload) {
  let response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    response = await fetch(fuelPriceApiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json; charset=UTF-8",
        Origin: "https://geoportalgasolineras.es",
        Referer: "https://geoportalgasolineras.es/geoportal-instalaciones/Inicio",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      dispatcher,
    });

    clearTimeout(timeoutId);
  } catch (error) {
    console.error("[fuel-prices]", "upstream fetch failed", {
      error: error?.message ?? String(error),
      name: error?.name,
      code: error?.cause?.code,
    });
    throw error;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("[fuel-prices]", "upstream error", {
      status: response.status,
      contentType: response.headers.get("content-type"),
      body: text.slice(0, 500),
    });
    throw new Error(`Fuel prices request failed with status ${response.status}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    const text = await response.text().catch(() => "");
    console.error("[fuel-prices]", "upstream json error", {
      error: error?.message ?? String(error),
      contentType: response.headers.get("content-type"),
      body: text.slice(0, 500),
    });
    throw error;
  }

  return data;
}

export class FuelPriceRepositoryServer {
  async searchStations(criteria) {
    try {
      const payload = buildSearchPayload(criteria);
      const cached = readCache(payload);
      if (cached) {
        return { result: cached, status: FuelPriceSearchStatus.READY };
      }

      const result = await fetchFuelPrices(payload);
      writeCache(payload, result);
      return { result, status: FuelPriceSearchStatus.READY };
    } catch (error) {
      console.error("[fuel-prices]", "search error", {
        error: error?.message ?? String(error),
      });
      return { result: null, status: FuelPriceSearchStatus.ERROR };
    }
  }
}
