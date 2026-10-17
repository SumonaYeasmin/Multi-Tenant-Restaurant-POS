// Tenant-scoped persistence adapter for non-sensitive preferences and mock data.
// Never store passwords, payment secrets or activation credentials here.

const PREFIX = "rpos:v1";

const hasStorage = () => typeof window !== "undefined" && !!window.localStorage;

export const storageKey = (scope: string, tenantId?: string) =>
  tenantId ? `${PREFIX}:t:${tenantId}:${scope}` : `${PREFIX}:${scope}`;

export function readJson<T>(key: string): T | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode — ignore */
  }
}

export function removeKey(key: string) {
  if (hasStorage()) window.localStorage.removeItem(key);
}
