export const fuelProductCatalog = [
  { id: "4", label: "Diesel A" },
  { id: "5", label: "Diesel A Premium" },
  { id: "1", label: "Gasolina 95" },
  { id: "3", label: "Gasolina 98" },
];

export const fuelBadgeClassById = {
  "1": "badge-success",
  "3": "badge-info",
  "4": "badge-neutral",
  "5": "badge-warning",
};

export const fuelLabelById = new Map(
  fuelProductCatalog.map((item) => [item.id, item.label])
);

export const fuelProductIds = fuelProductCatalog.map((item) => item.id);
