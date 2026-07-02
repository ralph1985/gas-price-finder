const POSTAL_CODE_LENGTH = 5;

export function createLocatePostalCodeUseCase(postalCodeLocator) {
  return async ({ latitude, longitude, signal }) => {
    const rawPostalCode = await postalCodeLocator.fetchPostalCodeFromCoordinates({
      latitude,
      longitude,
      signal,
    });

    if (!rawPostalCode) return null;

    const normalized = rawPostalCode.replace(/\D/g, "").slice(0, POSTAL_CODE_LENGTH);
    return normalized.length === POSTAL_CODE_LENGTH ? normalized : null;
  };
}
