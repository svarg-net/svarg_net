export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateISO(dateString: string): string {
  return new Date(dateString).toISOString();
}
