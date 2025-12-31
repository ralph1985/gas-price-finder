const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";

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

  const response = await fetch(`${NOMINATIM_ENDPOINT}?${params}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener la direccion.");
  }

  const payload = await response.json();
  return payload?.address?.postcode ?? null;
};
