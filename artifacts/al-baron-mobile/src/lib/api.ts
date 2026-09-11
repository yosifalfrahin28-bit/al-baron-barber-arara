const configuredApiBaseValue = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

// A previous Vercel deployment contained an invalid Render hostname. Keep the
// deployed app functional while that stale Vercel variable is being replaced.
const configuredApiBase = configuredApiBaseValue.includes('xn----ymcbiygy2lgf.onrender.com')
  ? 'https://al-baron-barber-arara.onrender.com'
  : configuredApiBaseValue;

export function apiUrl(path: string) {
  return `${configuredApiBase}${path}`;
}

/**
 * Barber photos may be stored in Replit Object Storage in development, but
 * external deployments (Render/Vercel) should be able to use a durable
 * externally-hosted image URL instead.
 */
export function barberPhotoUrl(photoPath: string | null | undefined) {
  if (!photoPath) return undefined;
  if (/^https?:\/\//i.test(photoPath)) return photoPath;
  return apiUrl(`/api/storage${photoPath}`);
}

export { configuredApiBase };