export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesSearch(text: string, query: string): boolean {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return true;
  }

  return text.toLowerCase().includes(normalizedQuery);
}
