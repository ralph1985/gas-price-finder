import { fetchPostalCodeFromCoordinates } from "../infrastructure/postal-code-locator.js";

const POSTAL_CODE_LENGTH = 5;

export const locatePostalCodeUseCase = async ({ latitude, longitude, signal }) => {
  const rawPostalCode = await fetchPostalCodeFromCoordinates({
    latitude,
    longitude,
    signal,
  });

  if (!rawPostalCode) return null;

  const normalized = rawPostalCode.replace(/\D/g, "").slice(0, POSTAL_CODE_LENGTH);
  return normalized.length === POSTAL_CODE_LENGTH ? normalized : null;
};
