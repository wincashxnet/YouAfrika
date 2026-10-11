// Assemblage : [intro] + [vidéo] → un seul MP4. Aucune dépendance : ffmpeg et ffprobe seulement.
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const INTRO_DIR = process.env.INTRO_DIR || path.join(here, '..', 'intro')
export const FPS = 30
const MAX_LONG = 1920, MAX_SHORT = 1080 // 1080p au plus (Stream propose ensuite ses propres qualités)

function run(cmd, args, { onLine } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = '', err = ''
    p.stdout.on('data', (d) => { out += d; onLine?.(String(d)) })
    p.stderr.on('data', (d) => { err = (err + d).slice(-4000) })
    p.on('error', reject)
    p.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} a échoué (code ${code}) : ${err.trim().split('\n').slice(-4).join(' | ')}`))))
  })
}

/** Taille d'affichage (rotation prise en compte), durée et présence d'une piste son. */
export async function probe(file) {
  const j = JSON.parse(await run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file]))
  const v = j.streams.find((s) => s.codec_type === 'video' && s.disposition?.attached_pic !== 1)
  if (!v) throw new Error("Aucune piste image dans le fichier d'origine.")
  let w = Number(v.width), h = Number(v.height)
  const rot = Math.abs(Number(v.tags?.rotate ?? v.side_data_list?.find((d) => 'rotation' in d)?.rotation ?? 0)) % 180
  if (rot === 90) [w, h] = [h, w]
  const sar = (v.sample_aspect_ratio || '1:1').split(':').map(Number)
  if (sar[0] > 0 && sar[1] > 0 && sar[0] !== sar[1]) w = Math.round((w * sar[0]) / sar[1])
  const duration = Number(j.format?.duration) || Number(v.duration) || 0
  if (!(w > 0 && h > 0)) throw new Error('Dimensions de la vidéo illisibles.')
  return { w, h, duration, hasAudio: j.streams.some((s) => s.codec_type === 'audio') }
}

const even = (n) => Math.max(2, Math.round(n / 2) * 2)
/** Taille de sortie : celle de la vidéo, ramenée à 1080p au plus (jamais agrandie), dimensions paires. */
export function outputSize(w, h) {
  const long = Math.max(w, h), short = Math.min(w, h)
  const k = Math.min(1, MAX_LONG / long, MAX_SHORT / short)
  return { W: even(w * k), H: even(h * k) }
}

/** Intro à utiliser : verticale si la vidéo est plus haute que large. */
export const introFor = (w, h) => path.join(INTRO_DIR, h > w ? 'intro-v.mp4' : 'intro-h.mp4')
export async function introMs() { return JSON.parse(await readFile(path.join(INTRO_DIR, 'intro.json'), 'utf8')).durationMs }

/**
 * Construit le fichier final. L'image de la vidéo est amenée à 30 i/s constants et au format de sortie, le son à 48 kHz stéréo,
 * puis les deux morceaux sont mis bout à bout. La vidéo démarre en fondu depuis le noir (l'intro finit sur le noir) :
 * c'est le seul traitement visible, sur 0,3 s. Les temps du contenu sont décalés d'exactement `introMs`.
 */
export async function assemble({ src, out, info, onProgress }) {
  const { W, H } = outputSize(info.w, info.h)
  const introFile = introFor(info.w, info.h)
  const ims = await introMs()
  const secs = ims / 1000
  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-nostats', '-progress', 'pipe:1', '-i', introFile, '-i', src]
  if (!info.hasAudio) args.push('-f', 'lavfi', '-t', info.duration.toFixed(3), '-i', 'anullsrc=r=48000:cl=stereo')
  const f = [
    // Intro : à la taille de la vidéo (bandes de la couleur de l'intro si le format diffère)
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=${FPS},format=yuv420p[iv]`,
    `[0:a]aresample=48000,aformat=channel_layouts=stereo,atrim=duration=${secs},apad=whole_dur=${secs},asetpts=PTS-STARTPTS[ia]`,
    // Vidéo : taille de sortie, 30 i/s constants, fondu d'entrée depuis le noir
    `[1:v:0]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=${FPS},format=yuv420p,fade=t=in:st=0:d=0.3,setpts=PTS-STARTPTS[vv]`,
    `${info.hasAudio ? '[1:a:0]' : '[2:a:0]'}aresample=48000:async=1,aformat=channel_layouts=stereo,asetpts=PTS-STARTPTS[va]`,
    '[iv][ia][vv][va]concat=n=2:v=1:a=1[v][a]',
  ].join(';')
  args.push('-filter_complex', f, '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', process.env.X264_PRESET || 'veryfast', '-crf', process.env.X264_CRF || '18', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-g', String(FPS * 2), '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out)
  // Sans piste son dans l'original, un silence (entrée 2) la remplace
  await run('ffmpeg', args, {
    onLine: (t) => {
      const m = t.match(/out_time_us=(\d+)/g)
      if (m && onProgress) onProgress(Math.min(1, Number(m.at(-1).split('=')[1]) / 1e6 / (info.duration + secs)))
    },
  })
  return { introMs: ims, W, H }
}
