import { enablePush, pushStatus } from './push'

export type PermState = 'granted' | 'ask' | 'blocked' | 'unavailable'
export type Perms = { notifications: PermState; camera: PermState; mic: PermState }

const hasMedia = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

const memo = (n: string) => `youafrika-perm-ok:${n}`
const remembered = (n: string) => { try { return localStorage.getItem(memo(n)) === '1' } catch { return false } }
const remember = (n: string) => { try { localStorage.setItem(memo(n), '1') } catch { /* rien */ } }

async function query(name: 'camera' | 'microphone'): Promise<PermState> {
  if (!hasMedia()) return 'unavailable'
  try {
    const s = await navigator.permissions.query({ name: name as PermissionName })
    return s.state === 'granted' ? 'granted' : s.state === 'denied' ? 'blocked' : 'ask'
  } catch { return remembered(name) ? 'granted' : 'ask' }   // Safari : pas d'API de lecture : on se fie à la dernière autorisation accordée ici
}

export async function getPermissions(): Promise<Perms> {
  const [notifications, camera, mic] = await Promise.all([pushStatus(), query('camera'), query('microphone')])
  return { notifications, camera, mic }
}

/** Demande au navigateur l'accès à un périphérique, puis le relâche aussitôt (rien n'est enregistré ici). */
async function ask(constraints: MediaStreamConstraints): Promise<boolean> {
  if (!hasMedia()) return false
  try {
    const s = await navigator.mediaDevices.getUserMedia(constraints)
    s.getTracks().forEach((t) => t.stop())
    if (constraints.video) remember('camera')
    if (constraints.audio) remember('microphone')
    return true
  } catch { return false }
}
export async function requestCamera(): Promise<PermState> { return (await ask({ video: true })) ? 'granted' : await query('camera') }
export async function requestMic(): Promise<PermState> { return (await ask({ audio: true })) ? 'granted' : await query('microphone') }
/** Caméra et micro en une seule demande (une seule fenêtre du navigateur). */
export async function requestCameraAndMic(): Promise<void> { await ask({ video: true, audio: true }) }
export async function requestNotifications(uid: string): Promise<PermState> {
  const r = await enablePush(uid, 'now')
  if (r === 'granted') return 'granted'
  return r === 'denied' ? await pushStatus() : 'unavailable'
}

export function openAppSettings() { /* le navigateur n'ouvre pas ses réglages : l'aide est affichée à la place */ }
export const blockedHelp = 'Touchez le cadenas à gauche de l’adresse du site, puis autorisez-la.'

const key = (uid: string) => `youafrika-autorisations:${uid}`
export function permissionsSeen(uid: string): boolean { try { return localStorage.getItem(key(uid)) === '1' } catch { return true } }
export function markPermissionsSeen(uid: string) { try { localStorage.setItem(key(uid), '1') } catch { /* rien */ } }
