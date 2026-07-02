import { FuelPriceRepositoryImpl } from "../infrastructure/fuel-price-repository.js";
import { fetchPostalCodeFromCoordinates } from "../infrastructure/postal-code-locator.js";
import { createLocatePostalCodeUseCase } from "../usecases/locate-postal-code.js";
import { createFuelPriceUsecases } from "../usecases/list-fuel-prices.js";

const fuelPriceRepository = new FuelPriceRepositoryImpl();
const postalCodeLocator = { fetchPostalCodeFromCoordinates };

export const { listFuelPricesUseCase, listFuelPricesBatchUseCase } =
  createFuelPriceUsecases(fuelPriceRepository);

export const locatePostalCodeUseCase =
  createLocatePostalCodeUseCase(postalCodeLocator);
