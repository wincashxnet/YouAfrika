import { Platform } from 'react-native'
import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { supabase } from './supabase'
import './localStore'

/**
 * Notifications sur le téléphone (Android / iPhone), même application fermée.
 *  - Canal « Ventes » : le son « tchin-tchin » à chaque vente ; canal « YouAfrika » pour le reste.
 *  - Le jeton du téléphone est rangé en base (push_register_expo) ; la fonction serveur « push » envoie par le service Expo.
 * Il faut une application installée (build EAS) : Expo Go ne reçoit plus les notifications à distance sur Android.
 */
export const SALE_CHANNEL = 'ventes'
const ASKED_KEY = 'youafrika-notifications-demandees'

// Application ouverte : la notification s'affiche quand même. Le son du système n'est gardé que pour une vente (« tchin-tchin ») ;
// pour le reste, l'application joue elle-même Pulse ou Connect (SoundBridge, réglages Profil › Sons) : jamais deux sons à la fois.
const isSale = (data: { link?: unknown; kind?: unknown } | undefined) =>
  data?.kind === 'sale' || (typeof data?.link === 'string' && /\/vente\/|[?&]vente=/.test(data.link))
Notifications.setNotificationHandler({
  handleNotification: async (n) => ({
    shouldShowBanner: true, shouldShowList: true, shouldSetBadge: true,
    shouldPlaySound: isSale(n.request.content.data as { link?: unknown; kind?: unknown } | undefined),
  }),
})

async function channels() {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync(SALE_CHANNEL, {
    name: 'Ventes', description: 'Chaque vente de vos ressources, avec le son tchin-tchin',
    importance: Notifications.AndroidImportance.MAX, sound: 'ching.wav', vibrationPattern: [0, 120, 80, 120], lightColor: '#00E5F5',
  })
  await Notifications.setNotificationChannelAsync('default', {
    name: 'YouAfrika', description: 'Nouvelles vidéos, réponses, achats, annonces',
    importance: Notifications.AndroidImportance.HIGH, lightColor: '#00E5F5',
  })
}

/** État des notifications de ce téléphone : « ask » = on peut encore demander l'autorisation, « blocked » = refusée pour de bon (réglages du téléphone). */
export type PushStatus = 'granted' | 'ask' | 'blocked' | 'unavailable'
export async function pushStatus(): Promise<PushStatus> {
  if (Platform.OS === 'web') return 'unavailable'
  try {
    const p = await Notifications.getPermissionsAsync()
    return p.granted ? 'granted' : p.canAskAgain ? 'ask' : 'blocked'
  } catch {
    return 'unavailable'
  }
}

let registered: string | null = null

/** Parité avec la version web : le téléphone n'a pas de message d'échec particulier à montrer. */
export const pushIssue = (): string | null => null

/**
 * Active les notifications de ce téléphone pour la personne connectée.
 * `ask` : on peut afficher la demande d'autorisation (une seule fois par appareil, sauf si la personne le demande elle-même).
 * Renvoie l'état final : « granted », « denied », ou « unavailable » (navigateur, simulateur, application non configurée).
 */
export async function enablePush(uid: string, ask: 'once' | 'now' | 'never' = 'once'): Promise<'granted' | 'denied' | 'unavailable'> {
  if (Platform.OS === 'web') return 'unavailable'
  try {
    await channels()
    let perm = await Notifications.getPermissionsAsync()
    if (!perm.granted && perm.canAskAgain && ask !== 'never') {
      let asked = false
      try { asked = localStorage.getItem(ASKED_KEY) === uid } catch { /* rien */ }
      if (ask === 'now' || !asked) {
        try { localStorage.setItem(ASKED_KEY, uid) } catch { /* rien */ }
        perm = await Notifications.requestPermissionsAsync()
      }
    }
    if (!perm.granted) return 'denied'
    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? Constants.easConfig?.projectId
    if (!projectId) return 'unavailable'
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
    if (registered !== `${uid}:${token}`) {
      const { error } = await supabase.rpc('push_register_expo', { p_token: token, p_platform: Platform.OS })
      if (error) return 'unavailable'
      registered = `${uid}:${token}`
    }
    return 'granted'
  } catch {
    return 'unavailable'
  }
}

/** À la déconnexion : ce téléphone ne reçoit plus les notifications de ce compte. */
export async function disablePush() {
  if (Platform.OS === 'web' || !registered) return
  const token = registered.split(':').slice(1).join(':')
  registered = null
  await supabase.rpc('push_unregister_expo', { p_token: token }).then(() => {}, () => {})
}

/** Lien porté par une notification touchée (« /vente/… », « /v/… »). */
export const linkOf = (r: Notifications.NotificationResponse | null | undefined): string | null => {
  const d = r?.notification.request.content.data as { link?: unknown } | undefined
  return typeof d?.link === 'string' ? d.link : null
}
