import { FuelPriceSearchStatus } from "../interfaces/fuel-price-repository.js";

const fuelPriceApiUrl =
  "https://geoportalgasolineras.es/geoportal/rest/busquedaEstaciones";
const fuelPricesCacheSeconds = 60 * 60 * 24;
const fuelPricesCacheResetHour = 8;
const fuelPricesCachePrefix = "gpf:fuel-prices";

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

function getFuelPricesCacheBucket() {
  const now = new Date();
  const cacheDate = new Date(now);

  if (now.getHours() < fuelPricesCacheResetHour) {
    cacheDate.setDate(cacheDate.getDate() - 1);
  }

  const year = cacheDate.getFullYear();
  const month = String(cacheDate.getMonth() + 1).padStart(2, "0");
  const day = String(cacheDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function readCachedResult(payload) {
  if (typeof localStorage === "undefined") return null;
  const cacheKey = getCacheKey(payload);
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
  const cacheKey = getCacheKey(payload);
  const expiresAt = Date.now() + fuelPricesCacheSeconds * 1000;
  const payloadValue = JSON.stringify({ expiresAt, result });
  localStorage.setItem(cacheKey, payloadValue);
}

async function fetchFuelPrices(payload) {
  const response = await fetch(fuelPriceApiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Fuel prices request failed with status ${response.status}`);
  }

  return response.json();
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
      writeCachedResult(payload, result);

      return { result, status: FuelPriceSearchStatus.READY };
    } catch {
      return { result: null, status: FuelPriceSearchStatus.ERROR };
    }
  }
}
