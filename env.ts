/**
 * Adresse et clé PUBLIQUE du projet Supabase. La clé « publishable » est faite pour être dans l'application ;
 * les clés secrètes (PVit, Stream…) restent dans les secrets des fonctions serveur, jamais ici.
 */
const FALLBACK_URL = 'https://uhuozemjoeyzlwrgifgj.supabase.co'
const FALLBACK_KEY = 'sb_publishable_gFiDV0WYrrAUZlkPOzILGw_E-F6wAA7'

export const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || FALLBACK_URL).replace(/\/+$/, '')
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || FALLBACK_KEY
/**
 * Worker de fichiers YouAfrika sur Cloudflare R2 (images, avatars, bannières, couvertures).
 * Vide (par défaut) = tout reste dans le stockage Supabase, exactement comme avant.
 * À renseigner dans EXPO_PUBLIC_FILES_URL une fois le Worker déployé et les fichiers migrés.
 */
export const FILES_URL = (process.env.EXPO_PUBLIC_FILES_URL?.trim() ?? '').replace(/\/+$/, '')
/** Site web public (liens de partage). */
export const SITE_URL = 'https://eduafriquee.netlify.app'
/**
 * Domaine des liens COURTS de partage (https://…/s/Ab3xK9). Par défaut le site ; pour un domaine encore plus court
 * (ex. https://yaf.link), le pointer vers le même site Netlify puis renseigner EXPO_PUBLIC_SHORT_URL.
 */
export const SHORT_URL = (process.env.EXPO_PUBLIC_SHORT_URL?.trim() || SITE_URL).replace(/\/+$/, '')

/** Hôtes dont les adresses sont des liens YouAfrika : ils s'ouvrent DANS l'application (jamais dans le navigateur). */
export const LINK_HOSTS: string[] = [...new Set([SITE_URL, SHORT_URL].map((u) => { try { return new URL(u).hostname.toLowerCase() } catch { return '' } }).filter(Boolean))]
