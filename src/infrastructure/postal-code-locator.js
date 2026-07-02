const NOMINATIM_REVERSE_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_SEARCH_ENDPOINT = "https://nominatim.openstreetmap.org/search";

export const fetchPostalCodeFromCoordinates = async ({
  latitude,
  longitude,
  signal,
}) => {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: latitude.toString(),
    lon: longitude.toString(),
    addressdetails: "1",
    "accept-language": "es",
    zoom: "18",
  });

  const response = await fetch(`${NOMINATIM_REVERSE_ENDPOINT}?${params}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener la direccion.");
  }

  const payload = await response.json();
  return payload?.address?.postcode ?? null;
};

export const fetchPostalCodeFromLocationQuery = async ({ query, signal }) => {
  const params = new URLSearchParams({
    format: "jsonv2",
    q: query,
    addressdetails: "1",
    "accept-language": "es",
    countrycodes: "es",
    limit: "5",
  });

  const response = await fetch(`${NOMINATIM_SEARCH_ENDPOINT}?${params}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error("No se pudo buscar la ubicacion.");
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) return null;

  return payload.find((item) => item?.address?.postcode)?.address?.postcode ?? null;
};
