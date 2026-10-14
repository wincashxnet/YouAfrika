import './localStore'
let memory: string | null = null
const KEY = 'youafrika-visitor'

/** Identifiant anonyme de l'appareil : une vue par jour et par vidéo pour un visiteur sans compte, et l'appareil du lecteur protégé. */
export function visitorKey(): string {
  if (memory) return memory
  try {
    const stored = localStorage.getItem(KEY)
    if (stored && /^[a-z0-9-]{16,40}$/.test(stored)) return (memory = stored)
  } catch { /* stockage indisponible */ }
  const fresh = (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`).toLowerCase().slice(0, 36)
  memory = fresh
  try { localStorage.setItem(KEY, fresh) } catch { /* stockage indisponible */ }
  return fresh
}

/** Petite mémoire locale (numéro de paiement, recherches) : jamais d'information sensible. */
export const remember = {
  get: (key: string) => { try { return localStorage.getItem(key) ?? '' } catch { return '' } },
  set: (key: string, value: string) => { try { localStorage.setItem(key, value) } catch { /* stockage indisponible */ } },
}
