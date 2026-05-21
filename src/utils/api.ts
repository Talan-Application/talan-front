export function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const nested = Object.values(data as Record<string, unknown>).find(Array.isArray);
    if (nested) return nested as T[];
  }
  return [];
}
