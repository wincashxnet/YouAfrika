import { Directory, File, Paths } from 'expo-file-system'
import { fetchIntroMs, forgetIntroMs } from './introOffset'
import { supabase } from './supabase'
import { visitorKey } from './visitor'
import { hostedVideoUrl, thumbOf } from './media'
import { reachable } from './online'
import { DownloadError, OFFLINE_TTL_MS, type DownloadableVideo, type DownloadPhase, type OfflineItem, type OfflineVideo } from './downloadTypes'
export * from './downloadTypes'

/**
 * Vidéos gratuites téléchargées pour le hors-ligne.
 *  - Le fichier vit dans l'espace PRIVÉ de l'application, sous un nom aléatoire : ni galerie, ni gestionnaire de fichiers, aucun bouton « exporter ».
 *    Il ne se lit que dans le lecteur de l'application ; le partage se fait par le lien du site.
 *  - Chaque téléchargement est une licence côté serveur (fonction « download ») : 48 h après le téléchargement, le fichier est effacé de l'appareil,
 *    sans prolongation. À chaque ouverture avec du réseau, `syncDownloads` efface en plus ce que le serveur a retiré (vidéo supprimée, devenue payante…).
 *  - Le temps se compte sur l'heure du serveur (écart gardé à chaque synchronisation) ; un recul de l'horloge du téléphone verrouille la lecture
 *    jusqu'à la prochaine connexion.
 */
export const downloadsSupported = true

const INDEX = 'youafrika-offline-v1'
const SEEN = 'youafrika-offline-seen'
const SKEW = 'youafrika-offline-skew'
const CLOCK_TOLERANCE_MS = 5 * 60 * 1000

type Index = Record<string, OfflineVideo>
type Grant = { state: 'preparing'; pct: number | null } | { state: 'ready'; url: string; ttl_seconds: number; server_time: string }
type Sync = { valid: string[]; revoked: string[]; ttl_seconds: number; server_time: string }

const readIndex = (): Index => { try { return JSON.parse(localStorage.getItem(INDEX) ?? '{}') as Index } catch { return {} } }
const writeIndex = (i: Index) => { try { localStorage.setItem(INDEX, JSON.stringify(i)) } catch { /* stockage indisponible */ } }
const num = (k: string) => { try { return Number(localStorage.getItem(k) ?? 0) || 0 } catch { return 0 } }
const put = (k: string, v: number) => { try { localStorage.setItem(k, String(v)) } catch { /* stockage indisponible */ } }

/** Heure du serveur, déduite de l'horloge du téléphone et de l'écart mesuré à la dernière synchronisation. */
const trustedNow = () => Date.now() + num(SKEW)
function learn(serverTime: string) {
  const s = Date.parse(serverTime)
  if (!Number.isFinite(s)) return
  put(SKEW, s - Date.now())
  put(SEEN, s)
}

function dir(): Directory {
  const d = new Directory(Paths.document, 'offline')
  if (!d.exists) d.create({ intermediates: true, idempotent: true })
  return d
}
function dropFile(name: string) { try { const f = new File(dir(), name); if (f.exists) f.delete() } catch { /* déjà absent */ } }
/** Efface la vidéo et sa miniature. */
function dropEntry(e: OfflineVideo) { dropFile(e.file); if (e.thumb_file) dropFile(e.thumb_file) }

/** Copie la miniature dans l'espace privé : la carte garde son image sans connexion. Sans importance si cela échoue. */
async function saveThumb(url: string | null | undefined, base: string): Promise<string | undefined> {
  if (!url) return undefined
  const name = `${base}.jpg`
  try {
    const f = await File.downloadFileAsync(url, new File(dir(), name))
    if (f.exists && f.size > 0) return name
  } catch { /* la carte s'affichera avec l'adresse distante, ou sans image */ }
  dropFile(name)
  return undefined
}

function statusOf(e: OfflineVideo): { remainingMs: number; locked: boolean } {
  const now = trustedNow()
  const seen = num(SEEN)
  const locked = now + CLOCK_TOLERANCE_MS < seen
  if (!locked && now > seen) put(SEEN, now)
  return { remainingMs: (e.downloadedAt ?? e.syncedAt) + OFFLINE_TTL_MS - now, locked }
}

/** Efface ce qui a expiré (ou dont le fichier a disparu) et renvoie ce qui reste. */
function purge(): Index {
  const idx = readIndex()
  let changed = false
  for (const [id, e] of Object.entries(idx)) {
    const { remainingMs, locked } = statusOf(e)
    let gone = !locked && remainingMs <= 0
    if (!gone) { try { gone = !new File(dir(), e.file).exists } catch { gone = true } }
    if (gone) { dropEntry(e); delete idx[id]; changed = true }
  }
  if (changed) writeIndex(idx)
  return idx
}

export function offlineList(uid: string | null): OfflineItem[] {
  if (!uid) return []
  return Object.values(purge()).filter((e) => e.owner === uid).map((e) => ({ ...e, ...statusOf(e) })).sort((a, b) => b.syncedAt - a.syncedAt)
}
export function offlineGet(id: string, uid: string | null): OfflineItem | null {
  return offlineList(uid).find((e) => e.id === id) ?? null
}
/** Image de la carte : la copie gardée sur l'appareil, sinon l'adresse distante (mise en cache par l'application). */
export function offlineThumb(v: OfflineVideo): string | null {
  if (v.thumb_file) { try { const f = new File(dir(), v.thumb_file); if (f.exists) return f.uri } catch { /* copie absente */ } }
  return v.thumb ?? null
}
/** Complète une vidéo téléchargée avant la v63 (image, chaîne) quand on retrouve du réseau. */
export async function updateOfflineMeta(id: string, meta: { thumb?: string | null; avatar?: string | null }): Promise<void> {
  const idx = readIndex()
  const e = idx[id]
  if (!e) return
  const thumb_file = e.thumb_file ?? await saveThumb(meta.thumb, `${e.file.replace(/\.mp4$/, '')}-t`)
  const next = readIndex()
  if (!next[id]) { if (thumb_file) dropFile(thumb_file); return }
  next[id] = { ...next[id], thumb: meta.thumb ?? next[id].thumb ?? null, avatar: meta.avatar ?? next[id].avatar ?? null, ...(thumb_file ? { thumb_file } : {}) }
  writeIndex(next)
}

/** Adresse interne du fichier, pour le lecteur de l'application seulement. Rien si la licence est expirée ou verrouillée. */
export function offlineUri(v: OfflineVideo): string | null {
  const { remainingMs, locked } = statusOf(v)
  if (locked || remainingMs <= 0) return null
  try { const f = new File(dir(), v.file); return f.exists ? f.uri : null } catch { return null }
}

/** Adresse de lecture (même interface que le web, où elle est préparée de façon asynchrone). */
export async function offlineSource(v: OfflineVideo): Promise<string | null> { return offlineUri(v) }

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
  const name = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}.mp4`
  const target = new File(dir(), name)
  let bytes = 0
  try {
    const file = await File.downloadFileAsync(grant.url, target)
    if (!file.exists || !(file.size > 0)) throw new Error('vide')
    bytes = file.size
  } catch {
    dropFile(name)
    if (!local) void call('release', { video_id: v.id }).catch(() => {})
    throw new DownloadError('Le téléchargement a été interrompu. Vérifiez votre connexion et réessayez.')
  }
  learn(grant.server_time)
  const thumb = thumbOf({ thumbnail_path: v.thumbnail_path ?? null, video_provider: v.video_provider, video_ref: v.video_ref ?? '' })
  const thumb_file = await saveThumb(thumb, `${name.replace(/\.mp4$/, '')}-t`)
  const idx = readIndex()
  if (idx[v.id]) dropEntry(idx[v.id])
  const entry: OfflineVideo = {
    id: v.id, owner: uid, title: v.title, channel_name: v.channel_name, duration: v.duration_seconds, file: name,
    trim_start: v.trim_start ?? 0, trim_end: v.trim_end ?? null, cuts: v.cuts ?? [], intro_ms: introMs, syncedAt: Date.parse(grant.server_time), downloadedAt: Date.parse(grant.server_time),
    thumb, avatar: v.channel_avatar_path ?? null, bytes, ...(thumb_file ? { thumb_file } : {}),
    ...(local ? { local: true } : {}),
  }
  idx[v.id] = entry
  writeIndex(idx)
  return entry
}

export async function removeDownload(id: string): Promise<void> {
  const idx = readIndex()
  const local = !!idx[id]?.local
  if (idx[id]) { dropEntry(idx[id]); delete idx[id]; writeIndex(idx) }
  if (!local) void call('release', { video_id: id }).catch(() => {})
}

/** À l'ouverture de l'application avec du réseau : efface ce que le serveur a retiré. Les 48 h ne sont jamais prolongées. */
export async function syncDownloads(): Promise<void> {
  const idx = purge()
  const ids = Object.entries(idx).filter(([, e]) => !e.local).map(([id]) => id)
  if (!ids.length) return
  if (!(await reachable())) return
  const { data } = await supabase.auth.getSession()
  if (!data.session) return
  try {
    const r = await call<Sync>('sync', { video_ids: ids })
    learn(r.server_time)
    const now = Date.parse(r.server_time)
    const next = readIndex()
    for (const id of r.revoked) if (next[id]) { dropEntry(next[id]); delete next[id] }
    for (const id of r.valid) if (next[id]) next[id] = { ...next[id], downloadedAt: next[id].downloadedAt ?? next[id].syncedAt, syncedAt: now }
    writeIndex(next)
  } catch { /* hors connexion : rien ne change, le compte à rebours continue */ }
}
