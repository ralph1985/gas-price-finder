export const postalCodePattern = /^\d{5}$/;

export const normalizePostalCode = (value) => value.replace(/\D/g, "").slice(0, 5);

export const formatPrice = (value) => {
  if (value == null) return null;
  return `${value.toFixed(3)} EUR`;
};

export const formatUpdateLabel = (dateValue, timeValue) => {
  const parts = [dateValue, timeValue].filter(Boolean);
  if (parts.length === 0) return null;
  return `Actualizado: ${parts.join(" ")}`;
};

export const buildMapsSearchUrl = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const buildFormattedStations = (stations, { fuelLabelById, fuelBadgeClassById }) =>
  [...stations]
    .sort((a, b) => {
      const priceA = a.precio ?? Number.POSITIVE_INFINITY;
      const priceB = b.precio ?? Number.POSITIVE_INFINITY;
      return priceA - priceB;
    })
    .map((station, index) => {
      const info = station.estacion ?? {};
      const title = info.rotulo ?? "Estacion sin nombre";
      const addressParts = [info.direccion, info.municipio, info.provincia].filter(Boolean);
      const address = addressParts.join(" - ") || "Direccion no disponible";
      const mapQuery = addressParts.join(", ");
      const update = formatUpdateLabel(info.fechaPvp, info.horaPvp);
      const price = formatPrice(station.precio) ?? "Sin precio";
      const fuelLabel = station.fuelId ? fuelLabelById.get(station.fuelId) : null;
      const fuelBadgeClass = station.fuelId ? fuelBadgeClassById[station.fuelId] : null;

      return {
        key: `${info.id ?? title}-${station.fuelId ?? "unknown"}-${index}`,
        title,
        address,
        mapUrl: mapQuery ? buildMapsSearchUrl(mapQuery) : null,
        update,
        price,
        schedule: info.horario,
        fuelLabel,
        fuelBadgeClass,
      };
    });

export const calculatePriceStats = (items) => {
  const values = items
    .map((station) => station.precio)
    .filter((value) => typeof value === "number");
  if (values.length === 0) {
    return { min: null, avg: null, max: null };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;

  return { min, avg, max };
};
