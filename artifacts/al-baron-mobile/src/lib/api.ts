const configuredApiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

export function apiUrl(path: string) {
  return `${configuredApiBase}${path}`;
}

export { configuredApiBase };