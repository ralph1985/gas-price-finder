import { FuelPriceSearchStatus } from "../interfaces/fuel-price-repository.js";
import {
  getCacheExpirationMs,
  getFuelPricesCacheBucket,
} from "./fuel-price-cache.js";

const fuelPriceApiUrl =
  "https://geoportalgasolineras.es/geoportal/rest/busquedaEstaciones";
const fuelPricesCachePrefix = "gpf:fuel-prices";

const cache = new Map();

function buildSearchPayload(criteria) {
  const bounds = criteria.bounds ?? {};

  return {
    tipoEstacion: criteria.stationType ?? "EESS",
    idProvincia: criteria.provinceId ?? "",
    idMunicipio: criteria.municipalityId ?? "",
    idProducto: criteria.productId ?? "4",
    rotulo: criteria.brand ?? "",
    eessEconomicas: criteria.economicalStations ?? false,
    conPlanesDescuento: criteria.discountPlans ?? false,
    horarioInicial: criteria.startTime ?? "",
    horarioFinal: criteria.endTime ?? "",
    calle: criteria.street ?? "",
    numero: criteria.streetNumber ?? "",
    codPostal: criteria.postalCode ?? "",
    tipoVenta: criteria.saleType ?? "P",
    tipoServicio: criteria.serviceType ?? null,
    idOperador: criteria.operatorId ?? "",
    nombrePlan: criteria.planName ?? "",
    idTipoDestinatario: criteria.recipientTypeId ?? null,
    x0: bounds.x0 ?? "",
    y0: bounds.y0 ?? "",
    x1: bounds.x1 ?? "",
    y1: bounds.y1 ?? "",
  };
}

function hashString(value) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function getCacheKey(payload) {
  const bucket = getFuelPricesCacheBucket();
  const payloadKey = hashString(JSON.stringify(payload));
  return `${fuelPricesCachePrefix}:${bucket}:${payloadKey}`;
}

function readCache(payload) {
  const cacheKey = getCacheKey(payload);
  const cached = cache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    cache.delete(cacheKey);
    return null;
  }
  return cached.result;
}

function writeCache(payload, result) {
  const cacheKey = getCacheKey(payload);
  cache.set(cacheKey, {
    expiresAt: Date.now() + getCacheExpirationMs(),
    result,
  });
}

async function fetchFuelPrices(payload) {
  console.log("[fuel-prices]", "fetch", {
    postalCode: payload.codPostal,
    productId: payload.idProducto,
  });
  const response = await fetch(fuelPriceApiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(payload),
  });

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

  console.log("[fuel-prices]", "upstream ok", {
    status: response.status,
    contentType: response.headers.get("content-type"),
    stations: data?.estaciones?.length ?? 0,
  });
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
