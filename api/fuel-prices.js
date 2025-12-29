import { getCacheExpirationSeconds } from "../src/infrastructure/fuel-price-cache.js";
import { FuelPriceRepositoryServer } from "../src/infrastructure/fuel-price-repository-server.js";
import { createFuelPriceUsecases } from "../src/usecases/list-fuel-prices.js";

const repository = new FuelPriceRepositoryServer();
const { listFuelPricesUseCase } = createFuelPriceUsecases(repository);

export default async function handler(request, response) {
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  console.log("[fuel-prices]", requestId, "incoming", {
    method: request.method,
    hasBody: Boolean(request.body),
  });

  if (request.method !== "POST") {
    console.warn("[fuel-prices]", requestId, "method not allowed");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const postalCode = String(request.body?.postalCode ?? "").trim();
  const productId = String(request.body?.productId ?? "").trim();

  if (!/^\d{5}$/.test(postalCode)) {
    console.warn("[fuel-prices]", requestId, "invalid postal code", { postalCode });
    response.status(400).json({ error: "Invalid postal code" });
    return;
  }

  if (!productId) {
    console.warn("[fuel-prices]", requestId, "missing product id");
    response.status(400).json({ error: "Missing product id" });
    return;
  }

  try {
    const result = await listFuelPricesUseCase({ postalCode, productId });
    console.log("[fuel-prices]", requestId, "response", {
      status: result?.status,
      stations: result?.result?.estaciones?.length ?? 0,
    });
    response
      .status(200)
      .setHeader("Cache-Control", `s-maxage=${getCacheExpirationSeconds()}`)
      .json(result);
  } catch (error) {
    console.error("[fuel-prices]", requestId, "error", error);
    response.status(500).json({ result: null, status: "error" });
  }
}
