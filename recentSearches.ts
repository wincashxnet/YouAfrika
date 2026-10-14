/** Recherches récentes : gardées sur cet appareil seulement, six au plus. */
const KEY = 'youafrika-recherches'
export function recentSearches(): string[] {
  try { const list = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown; return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string').slice(0, 6) : [] } catch { return [] }
}
function write(list: string[]) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 6))) } catch { /* stockage indisponible */ } }
export function rememberSearch(query: string) {
  const q = query.trim().slice(0, 80)
  if (q.length < 2) return
  write([q, ...recentSearches().filter((x) => x.toLowerCase() !== q.toLowerCase())])
}
export function forgetSearch(query: string) { write(recentSearches().filter((x) => x !== query)) }
export function clearSearches() { write([]) }
