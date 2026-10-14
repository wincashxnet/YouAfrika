import './localStore'

/**
 * Qui a téléchargé quoi, sans connexion. Hors ligne, la session expirée ne peut pas être renouvelée : l'application ne sait plus qui est connecté.
 * On garde donc l'identifiant (jamais un jeton) de la dernière personne connectée sur cet appareil, pour qu'elle retrouve SES téléchargements.
 * Effacé à la déconnexion volontaire.
 */
const KEY = 'youafrika-offline-owner'

export function rememberOwner(uid: string) { try { localStorage.setItem(KEY, uid) } catch { /* stockage indisponible */ } }
export function forgetOwner() { try { localStorage.removeItem(KEY) } catch { /* stockage indisponible */ } }
export function lastOwner(): string | null {
  try { const v = localStorage.getItem(KEY); return v && /^[0-9a-f-]{36}$/i.test(v) ? v : null } catch { return null }
}
