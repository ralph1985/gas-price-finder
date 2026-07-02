import { getFuelPricesCacheBucket } from "./fuel-price-cache.js";

const fuelPricesCachePrefix = "gpf:fuel-prices";

export function buildSearchPayload(criteria) {
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

export function getFuelPricesCacheKey(payload) {
  const bucket = getFuelPricesCacheBucket();
  const payloadKey = hashString(JSON.stringify(payload));
  return `${fuelPricesCachePrefix}:${bucket}:${payloadKey}`;
}
