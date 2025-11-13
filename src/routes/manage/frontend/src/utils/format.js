export function formatBoolean(value) {
  return value ? 'true' : 'false';
}

export function formatDateTime(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString('ja-JP', { hour12: false });
}
