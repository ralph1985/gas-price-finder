/**
 * @typedef {"ready" | "error"} FuelPriceSearchStatus
 */

/**
 * @typedef {import("../domain/fuel-price.js").FuelPriceSearchResult} FuelPriceSearchResult
 */

/**
 * @typedef {Object} FuelPriceSearchResponse
 * @property {FuelPriceSearchResult|null} result
 * @property {FuelPriceSearchStatus} status
 */

/**
 * @typedef {import("../domain/fuel-price.js").FuelPriceSearchCriteria} FuelPriceSearchCriteria
 */

/**
 * @typedef {Object} FuelPriceRepository
 * @property {(criteria: FuelPriceSearchCriteria) => Promise<FuelPriceSearchResponse>} searchStations
 */

export const FuelPriceSearchStatus = {
  READY: "ready",
  ERROR: "error",
};
