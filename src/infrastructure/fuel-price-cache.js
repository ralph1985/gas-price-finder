const fuelPricesCacheResetHour = 8;

export function getFuelPricesCacheBucket() {
  const now = new Date();
  const cacheDate = new Date(now);

  if (now.getHours() < fuelPricesCacheResetHour) {
    cacheDate.setDate(cacheDate.getDate() - 1);
  }

  const year = cacheDate.getFullYear();
  const month = String(cacheDate.getMonth() + 1).padStart(2, "0");
  const day = String(cacheDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getCacheExpirationMs() {
  const now = new Date();
  const reset = new Date(now);
  reset.setHours(fuelPricesCacheResetHour, 0, 0, 0);

  if (now >= reset) {
    reset.setDate(reset.getDate() + 1);
  }

  return reset.getTime() - now.getTime();
}

export function getCacheExpirationSeconds() {
  return Math.max(60, Math.floor(getCacheExpirationMs() / 1000));
}
