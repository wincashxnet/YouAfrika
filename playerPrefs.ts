import { useSyncExternalStore } from 'react'
import { getAppPrefs } from './appPrefs'

/**
 * RÉGLAGES DU LECTEUR, gardés sur l'appareil (qualité, sous-titres, vitesse) : on les règle une fois, ils suivent d'une vidéo à l'autre.
 * La qualité n'a d'effet que pour les vidéos en flux adaptatif (Cloudflare Stream) ; les sous-titres seulement si le créateur en a posé.
 */
export type Quality = 'auto' | '1080' | '720' | '480' | '360' | 'data'
export type CapSize = 's' | 'm' | 'l'
export type PlayerPrefs = { quality: Quality; captions: boolean; capSize: CapSize; speed: number }

export const DEFAULT_PLAYER_PREFS: PlayerPrefs = { quality: 'auto', captions: true, capSize: 'm', speed: 1 }

/** `mbps` : débit annoncé au flux au démarrage (il choisit alors le niveau d'image qui correspond). */
export const QUALITIES: { value: Quality; label: string; hint: string; mbps: number | null }[] = [
  { value: 'auto', label: 'Auto', hint: 'S’adapte à votre connexion', mbps: null },
  { value: '1080', label: '1080p', hint: 'Très nette · beaucoup de données', mbps: 6 },
  { value: '720', label: '720p', hint: 'Nette · idéale en Wi-Fi', mbps: 3 },
  { value: '480', label: '480p', hint: 'Équilibrée', mbps: 1.5 },
  { value: '360', label: '360p', hint: 'Légère', mbps: 0.8 },
  { value: 'data', label: 'Économie de données', hint: 'Qualité minimale', mbps: 0.3 },
]
export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]
export const CAP_SIZES: { value: CapSize; label: string; scale: number }[] = [
  { value: 's', label: 'Petits', scale: 0.85 },
  { value: 'm', label: 'Moyens', scale: 1 },
  { value: 'l', label: 'Grands', scale: 1.3 },
]
export const speedLabel = (s: number) => (s === 1 ? 'Normale' : `${String(s).replace('.', ',')}×`)
export const qualityLabel = (q: Quality) => QUALITIES.find((x) => x.value === q)?.label ?? 'Auto'

const KEY = 'youafrika-lecteur'
function read(): PlayerPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<PlayerPrefs>
    return {
      quality: QUALITIES.some((q) => q.value === raw.quality) ? (raw.quality as Quality) : DEFAULT_PLAYER_PREFS.quality,
      captions: typeof raw.captions === 'boolean' ? raw.captions : DEFAULT_PLAYER_PREFS.captions,
      capSize: CAP_SIZES.some((s) => s.value === raw.capSize) ? (raw.capSize as CapSize) : DEFAULT_PLAYER_PREFS.capSize,
      speed: SPEEDS.includes(Number(raw.speed)) ? Number(raw.speed) : DEFAULT_PLAYER_PREFS.speed,
    }
  } catch { return DEFAULT_PLAYER_PREFS }
}

let current: PlayerPrefs = read()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export const getPlayerPrefs = () => current
export function setPlayerPrefs(patch: Partial<PlayerPrefs>) {
  current = { ...current, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(current)) } catch { /* réglage gardé pour cette visite seulement */ }
  listeners.forEach((l) => l())
}
export const usePlayerPrefs = () => useSyncExternalStore(subscribe, getPlayerPrefs, getPlayerPrefs)

/**
 * Lecture automatique de la suite du Mix : UN seul réglage, lu par la page vidéo ET par le mini-lecteur (avant, la même fonction était copiée aux deux endroits).
 * Jamais choisi : actif, sauf si l'économie de données du profil est active.
 */
export const AUTOPLAY_KEY = 'youafrika-lecture-auto'
export function readAutoplay(): boolean {
  try { const v = localStorage.getItem(AUTOPLAY_KEY); return v === null ? !getAppPrefs().data_saver : v !== 'non' } catch { return !getAppPrefs().data_saver }
}
export function writeAutoplay(on: boolean): void {
  try { localStorage.setItem(AUTOPLAY_KEY, on ? 'oui' : 'non') } catch { /* réglage gardé pour cette visite */ }
}

/** Qualité réellement demandée : « Auto » devient 480p quand l'économie de données est active dans le profil. */
export function effectiveQuality(q: Quality): Quality {
  return q === 'auto' && getAppPrefs().data_saver ? '480' : q
}
export const mbpsOf = (q: Quality) => QUALITIES.find((x) => x.value === q)?.mbps ?? null
