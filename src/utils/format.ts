function toDate(value: number | string): Date {
  if (typeof value === 'string') return new Date(value);
  return new Date(value > 1e12 ? value : value * 1000);
}

export function formatDate(value: number | string): string {
  return toDate(value).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value: number | string): string {
  return toDate(value).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
