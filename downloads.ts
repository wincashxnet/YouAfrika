import { supabase } from './supabase'
import { fetchIntroMs, forgetIntroMs } from './introOffset'
import { visitorKey } from './visitor'
import { hostedVideoUrl, thumbOf } from './media'
import { reachable } from './online'
import { DownloadError, OFFLINE_TTL_MS, type DownloadableVideo, type DownloadPhase, type OfflineItem, type OfflineVideo } from './downloadTypes'
export * from './downloadTypes'

/**
 * Web (navigateur et application installée) : vidéos téléchargées pour le hors-ligne, sans forfait internet.
 *  - Le fichier est rangé dans le stockage PRIVÉ du site (Cache Storage), sous un nom aléatoire : ni dossier « Téléchargements », ni bouton « enregistrer sous ».
 *    Il ne se lit que dans le lecteur de YouAfrika ; le partage envoie le lien du site, jamais le fichier.
 *  - 48 h après le téléchargement, le fichier est effacé (heure du serveur ; un recul de l'horloge verrouille la lecture jusqu'à la prochaine connexion).
 *  - Même licence côté serveur (fonction « download ») que sur téléphone.
 * Limite : un navigateur peut libérer de la place de lui-même ; une vidéo disparue est alors retirée de la liste et se télécharge de nouveau.
 */
export const downloadsSupported = typeof caches !== 'undefined' && typeof indexedDB !== 'undefined'

const CACHE = 'youafrika-offline-media'
const INDEX = 'youafrika-offline-v1'
const SEEN = 'youafrika-offline-seen'
const SKEW = 'youafrika-offline-skew'
const CLOCK_TOLERANCE_MS = 5 * 60 * 1000
const keyOf = (name: string) => `/__offline__/${name}`

type Index = Record<string, OfflineVideo>
type Grant = { state: 'preparing'; pct: number | null } | { state: 'ready'; url: string; ttl_seconds: number; server_time: string }
type Sync = { valid: string[]; revoked: string[]; ttl_seconds: number; server_time: string }

const readIndex = (): Index => { try { return JSON.parse(localStorage.getItem(INDEX) ?? '{}') as Index } catch { return {} } }
const writeIndex = (i: Index) => { try { localStorage.setItem(INDEX, JSON.stringify(i)) } catch { /* stockage indisponible */ } }
const num = (k: string) => { try { return Number(localStorage.getItem(k) ?? 0) || 0 } catch { return 0 } }
const put = (k: string, v: number) => { try { localStorage.setItem(k, String(v)) } catch { /* stockage indisponible */ } }

const trustedNow = () => Date.now() + num(SKEW)
function learn(serverTime: string) {
  const s = Date.parse(serverTime)
  if (!Number.isFinite(s)) return
  put(SKEW, s - Date.now())
  put(SEEN, s)
}
function statusOf(e: OfflineVideo): { remainingMs: number; locked: boolean } {
  const now = trustedNow()
  const seen = num(SEEN)
  const locked = now + CLOCK_TOLERANCE_MS < seen
  if (!locked && now > seen) put(SEEN, now)
  return { remainingMs: (e.downloadedAt ?? e.syncedAt) + OFFLINE_TTL_MS - now, locked }
}
async function dropFile(name: string) { try { const c = await caches.open(CACHE); await c.delete(keyOf(name)) } catch { /* déjà absent */ } }

/** Efface ce qui a expiré et renvoie ce qui reste. */
function purge(): Index {
  const idx = readIndex()
  let changed = false
  for (const [id, e] of Object.entries(idx)) {
    const { remainingMs, locked } = statusOf(e)
    if (!locked && remainingMs <= 0) { void dropFile(e.file); delete idx[id]; changed = true }
  }
  if (changed) writeIndex(idx)
  return idx
}

export function offlineList(uid: string | null): OfflineItem[] {
  if (!uid || !downloadsSupported) return []
  return Object.values(purge()).filter((e) => e.owner === uid).map((e) => ({ ...e, ...statusOf(e) })).sort((a, b) => b.syncedAt - a.syncedAt)
}
export function offlineGet(id: string, uid: string | null): OfflineItem | null {
  return offlineList(uid).find((e) => e.id === id) ?? null
}
/** Image de la carte (sur le web : l'adresse distante, gardée par le cache du navigateur). */
export const offlineThumb = (v: OfflineVideo): string | null => v.thumb ?? null
/** Complète une vidéo téléchargée avant la v63 (image, chaîne). */
export async function updateOfflineMeta(id: string, meta: { thumb?: string | null; avatar?: string | null }): Promise<void> {
  const idx = readIndex()
  if (!idx[id]) return
  idx[id] = { ...idx[id], thumb: meta.thumb ?? idx[id].thumb ?? null, avatar: meta.avatar ?? idx[id].avatar ?? null }
  writeIndex(idx)
}
/** Sur le web la lecture passe par `offlineSource` (adresse temporaire, préparée à la demande). */
export const offlineUri = (_v: OfflineVideo): string | null => null

/** Adresse de lecture temporaire (blob:) du fichier, pour le lecteur de YouAfrika seulement. Rien si le téléchargement est expiré ou verrouillé. À libérer avec URL.revokeObjectURL. */
export async function offlineSource(v: OfflineVideo): Promise<string | null> {
  const { remainingMs, locked } = statusOf(v)
  if (locked || remainingMs <= 0 || !downloadsSupported) return null
  try {
    const c = await caches.open(CACHE)
    const hit = await c.match(keyOf(v.file))
    if (!hit) return null
    const blob = await hit.blob()
    return URL.createObjectURL(blob.type ? blob : new Blob([blob], { type: 'video/mp4' }))
  } catch { return null }
}

async function call<T>(action: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('download', { body: { action, device_id: visitorKey(), ...args } })
  if (error) {
    const ctx = (error as { context?: Response }).context
    let message = ''
    try { message = ctx && typeof ctx.json === 'function' ? ((await ctx.json()) as { error?: string }).error ?? '' : '' } catch { /* rien */ }
    throw new DownloadError(message || 'Le service n’est pas joignable. Vérifiez votre connexion.')
  }
  if (data && typeof data === 'object' && 'error' in data) throw new DownloadError(String((data as { error: unknown }).error))
  return data as T
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function downloadVideo(v: DownloadableVideo, uid: string, onPhase?: (p: DownloadPhase, pct?: number | null) => void): Promise<OfflineVideo> {
  if (!downloadsSupported) throw new DownloadError('Ce navigateur ne peut pas garder de vidéo hors connexion. Installez l’application YouAfrika.')
  onPhase?.('asking')
  const started = Date.now()
  // Vidéo hébergée par Supabase (phase de test) : fichier public, pas besoin de l'autorisation du serveur.
  const local = v.video_provider === 'supabase' && !!v.video_ref
  let grant: Extract<Grant, { state: 'ready' }> | null = local
    ? { state: 'ready', url: hostedVideoUrl(v.video_ref as string), ttl_seconds: OFFLINE_TTL_MS / 1000, server_time: new Date().toISOString() }
    : null
  while (!grant) {
    const r = await call<Grant>('grant', { video_id: v.id })
    if (r.state === 'ready') { grant = r; break }
    onPhase?.('preparing', r.pct)
    if (Date.now() - started > 4 * 60 * 1000) throw new DownloadError('La préparation prend plus de temps que prévu. Réessayez dans quelques minutes.')
    await sleep(4000)
  }
  // Décalage relu juste avant le fichier : il doit correspondre à la version du fichier téléchargé (montage possible entre-temps).
  forgetIntroMs(v.id)
  const introMs = await fetchIntroMs(v.id)
  onPhase?.('downloading')
  // Demande au navigateur de ne pas libérer ce stockage de lui-même (sans effet s'il refuse)
  void navigator.storage?.persist?.().catch(() => {})
  const name = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}.mp4`
  let bytes = 0
  try {
    const res = await fetch(grant.url)
    if (!res.ok || !res.body) throw new Error('réponse')
    const cache = await caches.open(CACHE)
    await cache.put(keyOf(name), new Response(res.body, { headers: { 'Content-Type': res.headers.get('Content-Type') || 'video/mp4' } }))
    const check = await cache.match(keyOf(name))
    bytes = check ? (await check.blob()).size : 0
    if (!(bytes > 0)) throw new Error('vide')
  } catch (e) {
    await dropFile(name)
    if (!local) void call('release', { video_id: v.id }).catch(() => {})
    const quota = (e as { name?: string })?.name === 'QuotaExceededError'
    throw new DownloadError(quota ? 'Il n’y a plus assez de place sur cet appareil. Supprimez des téléchargements ou libérez de l’espace.' : 'Le téléchargement a été interrompu. Vérifiez votre connexion et réessayez.')
  }
  learn(grant.server_time)
  const idx = readIndex()
  if (idx[v.id]) await dropFile(idx[v.id].file)
  const entry: OfflineVideo = {
    id: v.id, owner: uid, title: v.title, channel_name: v.channel_name, duration: v.duration_seconds, file: name,
    trim_start: v.trim_start ?? 0, trim_end: v.trim_end ?? null, cuts: v.cuts ?? [], intro_ms: introMs, syncedAt: Date.parse(grant.server_time), downloadedAt: Date.parse(grant.server_time),
    thumb: thumbOf({ thumbnail_path: v.thumbnail_path ?? null, video_provider: v.video_provider, video_ref: v.video_ref ?? '' }), avatar: v.channel_avatar_path ?? null, bytes,
    ...(local ? { local: true } : {}),
  }
  idx[v.id] = entry
  writeIndex(idx)
  return entry
}

export async function removeDownload(id: string): Promise<void> {
  const idx = readIndex()
  const local = !!idx[id]?.local
  if (idx[id]) { await dropFile(idx[id].file); delete idx[id]; writeIndex(idx) }
  if (!local) void call('release', { video_id: id }).catch(() => {})
}

/** Avec du réseau : retire ce que le navigateur a libéré ou que le serveur a retiré. Sans réseau : seul le délai de 48 h compte. */
export async function syncDownloads(): Promise<void> {
  if (!downloadsSupported) return
  const idx = purge()
  // Un fichier que le navigateur a libéré ne doit plus figurer dans la liste
  try {
    const c = await caches.open(CACHE)
    const next = readIndex()
    let changed = false
    for (const [id, e] of Object.entries(idx)) if (!(await c.match(keyOf(e.file)))) { delete next[id]; changed = true }
    if (changed) writeIndex(next)
  } catch { /* stockage indisponible */ }
  const ids = Object.entries(readIndex()).filter(([, e]) => !e.local).map(([id]) => id)
  if (!ids.length) return
  if (!(await reachable())) return
  const { data } = await supabase.auth.getSession()
  if (!data.session) return
  try {
    const r = await call<Sync>('sync', { video_ids: ids })
    learn(r.server_time)
    const now = Date.parse(r.server_time)
    const next = readIndex()
    for (const id of r.revoked) if (next[id]) { await dropFile(next[id].file); delete next[id] }
    for (const id of r.valid) if (next[id]) next[id] = { ...next[id], downloadedAt: next[id].downloadedAt ?? next[id].syncedAt, syncedAt: now }
    writeIndex(next)
  } catch { /* hors connexion : rien ne change, le compte à rebours continue */ }
}
