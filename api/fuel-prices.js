import { getCacheExpirationSeconds } from "../src/infrastructure/fuel-price-cache.js";
import { FuelPriceRepositoryServer } from "../src/infrastructure/fuel-price-repository-server.js";
import { createFuelPriceUsecases } from "../src/usecases/list-fuel-prices.js";

export const config = {
  runtime: "edge",
};

const repository = new FuelPriceRepositoryServer();
const { listFuelPricesUseCase } = createFuelPriceUsecases(repository);

const jsonResponse = (payload, status = 200, headers = {}) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });

export default async function handler(request) {
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const contentLength = request.headers.get("content-length");
  const contentType = request.headers.get("content-type");
  console.log("[fuel-prices]", requestId, "incoming", {
    method: request.method,
    contentLength,
    contentType,
  });

  if (request.method !== "POST") {
    console.warn("[fuel-prices]", requestId, "method not allowed");
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body = null;
  try {
    body = await request.json();
  } catch (error) {
    console.warn("[fuel-prices]", requestId, "invalid json body", {
      error: error?.message ?? String(error),
    });
  }

  const postalCode = String(body?.postalCode ?? "").trim();
  const productId = String(body?.productId ?? "").trim();

  if (!/^\d{5}$/.test(postalCode)) {
    console.warn("[fuel-prices]", requestId, "invalid postal code", { postalCode });
    return jsonResponse({ error: "Invalid postal code" }, 400);
  }

  if (!productId) {
    console.warn("[fuel-prices]", requestId, "missing product id");
    return jsonResponse({ error: "Missing product id" }, 400);
  }

  try {
    const result = await listFuelPricesUseCase({ postalCode, productId });
    console.log("[fuel-prices]", requestId, "response", {
      status: result?.status,
      stations: result?.result?.estaciones?.length ?? 0,
    });
    return jsonResponse(result, 200, {
      "Cache-Control": `s-maxage=${getCacheExpirationSeconds()}`,
    });
  } catch (error) {
    console.error("[fuel-prices]", requestId, "error", error);
    return jsonResponse({ result: null, status: "error" }, 500);
  }
}
