// Service de montage YouAfrika : boucle qui prend les tâches de la fonction « stream », colle l'intro devant la vidéo et renvoie le résultat à Stream.
//
// Variables d'environnement :
//   STREAM_FUNCTION_URL  https://<projet>.supabase.co/functions/v1/stream
//   MONTAGE_SECRET       le même secret que dans Supabase → Edge Functions → Secrets
//   SUPABASE_ANON_KEY    clé « anon » (la fonction exige un en-tête apikey)
//   WORK_DIR             dossier de travail (défaut /tmp/montage) ; prévoir 3 × la taille de la plus grosse vidéo
//   POLL_SECONDS         attente quand la file est vide (défaut 10) · X264_PRESET / X264_CRF : réglages d'encodage
//   RUN_ONCE=1           une seule passe : traite les tâches en attente puis s'arrête (GitHub Actions, planificateur). Sans cela, le service tourne sans fin.
import { mkdir, rm, stat } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import path from 'node:path'
import { assemble, probe } from './assemble.mjs'
import { tusUpload } from './tus.mjs'

const URL_ = process.env.STREAM_FUNCTION_URL
const SECRET = process.env.MONTAGE_SECRET
const ANON = process.env.SUPABASE_ANON_KEY || ''
const WORK = process.env.WORK_DIR || '/tmp/montage'
const POLL = Number(process.env.POLL_SECONDS || 10) * 1000
const ONCE = process.env.RUN_ONCE === '1'
if (!URL_ || !SECRET) { console.error('STREAM_FUNCTION_URL et MONTAGE_SECRET sont obligatoires.'); process.exit(1) }

const log = (...a) => console.log(new Date().toISOString(), ...a)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function call(action, args = {}) {
  const res = await fetch(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-montage-secret': SECRET, ...(ANON ? { apikey: ANON, Authorization: `Bearer ${ANON}` } : {}) },
    body: JSON.stringify({ action, ...args }),
    signal: AbortSignal.timeout(60_000),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${action} : ${body.error ?? res.status}`)
  return body
}

async function download(url, file) {
  const res = await fetch(url, { signal: AbortSignal.timeout(2 * 3600_000) })
  if (!res.ok || !res.body) throw new Error(`Téléchargement impossible (${res.status}).`)
  await pipeline(Readable.fromWeb(res.body), createWriteStream(file))
}

async function process_(job) {
  const dir = path.join(WORK, job.id)
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
  const src = path.join(dir, 'source.mp4'), out = path.join(dir, 'final.mp4')
  try {
    // 1. Fichier d'origine (Stream le prépare : on attend qu'il soit prêt)
    let url = null
    for (let i = 0; i < 180 && !url; i++) {
      const s = await call('job_source', { job_id: job.id })
      if (s.status === 'ready') url = s.url
      else await sleep(10_000)
    }
    if (!url) throw new Error("Stream n'a pas préparé le fichier d'origine à temps.")
    await download(url, src)
    log(job.id, 'téléchargé', Math.round((await stat(src)).size / 1e6), 'Mo')

    // 2. Montage
    const info = await probe(src)
    let last = 0
    const res = await assemble({ src, out, info, onProgress: (p) => { if (p - last > 0.2) { last = p; log(job.id, 'montage', Math.round(p * 100), '%') } } })
    const size = (await stat(out)).size
    const final = await probe(out)
    const expected = info.duration + res.introMs / 1000
    if (Math.abs(final.duration - expected) > 1.5) throw new Error(`Durée inattendue après montage : ${final.duration.toFixed(1)} s au lieu de ${expected.toFixed(1)} s.`)

    // 3. Envoi à Stream (reprenable), puis attente de son traitement
    const { location } = await call('job_tus', { job_id: job.id, size })
    await tusUpload(location, out, size, { onProgress: (p) => log(job.id, 'envoi', Math.round(p * 100), '%') })
    let ready = false
    for (let i = 0; i < 360 && !ready; i++) {
      const c = await call('job_check', { job_id: job.id })
      if (c.state === 'error') throw new Error(`Stream n'a pas pu traiter le fichier monté : ${c.error ?? ''}`)
      if (c.state === 'ready') ready = true
      else await sleep(10_000)
    }
    if (!ready) throw new Error('Stream est trop long à traiter le fichier monté.')

    // 4. Bascule : la vidéo change d'identifiant et reçoit son décalage
    await call('job_done', { job_id: job.id, intro_ms: res.introMs })
    log(job.id, 'terminé')
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

async function main() {
  log('service de montage démarré')
  for (;;) {
    let job = null
    try { job = (await call('job_claim')).job } catch (e) { log('file inaccessible :', e.message); if (ONCE) process.exit(1); await sleep(30_000); continue }
    if (!job) { if (ONCE) { log('file vide : fin de la passe'); process.exit(0) } await sleep(POLL); continue }
    log(job.id, 'prise en charge', job.uid)
    try { await process_(job) }
    catch (e) {
      log(job.id, 'échec :', e.message)
      await call('job_fail', { job_id: job.id, error: e.message }).catch((x) => log('job_fail impossible :', x.message))
    }
  }
}
process.on('SIGTERM', () => process.exit(0))
main()
