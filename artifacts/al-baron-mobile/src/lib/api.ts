const configuredApiBaseValue = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

// A previous Vercel deployment contained an invalid Render hostname. Keep the
// deployed app functional while that stale Vercel variable is being replaced.
const configuredApiBase = configuredApiBaseValue.includes('xn----ymcbiygy2lgf.onrender.com')
  ? 'https://al-baron-barber-arara.onrender.com'
  : configuredApiBaseValue;

export function apiUrl(path: string) {
  return `${configuredApiBase}${path}`;
}

export { configuredApiBase };