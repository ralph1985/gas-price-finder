const POSTAL_CODE_LENGTH = 5;
const postalCodePattern = /^\d{5}$/;

function normalizePostalCode(value) {
  const normalized = String(value ?? "").replace(/\D/g, "").slice(0, POSTAL_CODE_LENGTH);
  return normalized.length === POSTAL_CODE_LENGTH ? normalized : null;
}

export function createLocatePostalCodeUseCase(postalCodeLocator) {
  return async ({ latitude, longitude, signal }) => {
    const rawPostalCode = await postalCodeLocator.fetchPostalCodeFromCoordinates({
      latitude,
      longitude,
      signal,
    });

    return normalizePostalCode(rawPostalCode);
  };
}

export function createFindPostalCodeByLocationQueryUseCase(postalCodeLocator) {
  return async ({ query, signal }) => {
    const trimmedQuery = query.trim();
    if (postalCodePattern.test(trimmedQuery)) return trimmedQuery;

    const rawPostalCode = await postalCodeLocator.fetchPostalCodeFromLocationQuery({
      query: trimmedQuery,
      signal,
    });

    return normalizePostalCode(rawPostalCode);
  };
}
