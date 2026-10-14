import { Linking } from 'react-native'
import { Camera } from 'expo-camera'
import { enablePush, pushStatus } from './push'
import './localStore'

/**
 * Autorisations de l'appareil dont YouAfrika a besoin : notifications, caméra, micro.
 * « ask » = on peut encore demander ; « blocked » = refusée pour de bon (réglages) ; « unavailable » = impossible ici.
 */
export type PermState = 'granted' | 'ask' | 'blocked' | 'unavailable'
export type Perms = { notifications: PermState; camera: PermState; mic: PermState }

const from = (p: { granted: boolean; canAskAgain: boolean }): PermState => (p.granted ? 'granted' : p.canAskAgain ? 'ask' : 'blocked')

export async function getPermissions(): Promise<Perms> {
  const [notifications, camera, mic] = await Promise.all([
    pushStatus(),
    Camera.getCameraPermissionsAsync().then(from, () => 'unavailable' as PermState),
    Camera.getMicrophonePermissionsAsync().then(from, () => 'unavailable' as PermState),
  ])
  return { notifications, camera, mic }
}

export async function requestCamera(): Promise<PermState> { try { return from(await Camera.requestCameraPermissionsAsync()) } catch { return 'unavailable' } }
export async function requestMic(): Promise<PermState> { try { return from(await Camera.requestMicrophonePermissionsAsync()) } catch { return 'unavailable' } }
/** Caméra puis micro (deux fenêtres du système). */
export async function requestCameraAndMic(): Promise<void> { await requestCamera(); await requestMic() }
export async function requestNotifications(uid: string): Promise<PermState> {
  const r = await enablePush(uid, 'now')
  if (r === 'granted') return 'granted'
  return r === 'denied' ? await pushStatus() : 'unavailable'
}

/** Réglages du téléphone (pour une autorisation refusée pour de bon). */
export function openAppSettings() { void Linking.openSettings().catch(() => {}) }
/** Aide à afficher quand l'autorisation est bloquée. */
export const blockedHelp = 'Ouvrez les réglages du téléphone, puis autorisez-la pour YouAfrika.'

// Étape d'accueil « Autorisations » : montrée une fois à chaque personne, sur chaque appareil
const key = (uid: string) => `youafrika-autorisations:${uid}`
export function permissionsSeen(uid: string): boolean { try { return localStorage.getItem(key(uid)) === '1' } catch { return true } }
export function markPermissionsSeen(uid: string) { try { localStorage.setItem(key(uid), '1') } catch { /* rien */ } }
