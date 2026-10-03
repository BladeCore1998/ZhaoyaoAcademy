export function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function matchesSearch(searchText: string, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return !normalizedQuery || normalizeSearchText(searchText).includes(normalizedQuery);
}
