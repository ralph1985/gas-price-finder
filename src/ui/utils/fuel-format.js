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

const getStationKey = (station, index) => {
  const info = station.estacion ?? {};
  if (info.id != null) return `id:${info.id}`;

  const addressParts = [info.rotulo, info.direccion, info.municipio, info.provincia]
    .filter(Boolean)
    .join("|");
  return addressParts || `unknown:${index}`;
};

const buildFormattedStation = (stationGroup) => {
  const firstStation = stationGroup.stations[0];
  const info = firstStation.estacion ?? {};
  const title = info.rotulo ?? "Estacion sin nombre";
  const addressParts = [info.direccion, info.municipio, info.provincia].filter(Boolean);
  const address = addressParts.join(" - ") || "Direccion no disponible";
  const mapQuery = addressParts.join(", ");
  const update = formatUpdateLabel(info.fechaPvp, info.horaPvp);
  const minPrice = Math.min(
    ...stationGroup.prices.map((price) => price.rawPrice ?? Number.POSITIVE_INFINITY)
  );

  return {
    key: stationGroup.key,
    title,
    address,
    mapUrl: mapQuery ? buildMapsSearchUrl(mapQuery) : null,
    update,
    schedule: info.horario,
    prices: stationGroup.prices,
    minPrice,
  };
};

export const buildFormattedStations = (stations, { fuelLabelById, fuelBadgeClassById }) => {
  const groupedStations = new Map();

  stations.forEach((station, index) => {
    const stationKey = getStationKey(station, index);
    const stationGroup = groupedStations.get(stationKey) ?? {
      key: stationKey,
      stations: [],
      prices: [],
    };
    const fuelLabel = station.fuelId ? fuelLabelById.get(station.fuelId) : null;
    const fuelBadgeClass = station.fuelId ? fuelBadgeClassById[station.fuelId] : null;

    stationGroup.stations.push(station);
    stationGroup.prices.push({
      key: `${stationKey}-${station.fuelId ?? "unknown"}-${index}`,
      rawPrice: station.precio,
      price: formatPrice(station.precio) ?? "Sin precio",
      fuelLabel,
      fuelBadgeClass,
    });
    groupedStations.set(stationKey, stationGroup);
  });

  return [...groupedStations.values()]
    .map((stationGroup) => ({
      ...stationGroup,
      prices: stationGroup.prices.sort((a, b) => {
        const priceA = a.rawPrice ?? Number.POSITIVE_INFINITY;
        const priceB = b.rawPrice ?? Number.POSITIVE_INFINITY;
        return priceA - priceB;
      }),
    }))
    .map(buildFormattedStation)
    .sort((a, b) => a.minPrice - b.minPrice);
};

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
