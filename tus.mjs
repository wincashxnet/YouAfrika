// Envoi reprenable (protocole tus 1.0) vers l'adresse donnée par Cloudflare Stream : par morceaux, avec reprise après une coupure.
import { open } from 'node:fs/promises'

const CHUNK = 52_428_800 // 50 Mo : multiple de 256 Kio, comme Stream l'exige

export async function tusUpload(location, file, size, { onProgress, retries = 6 } = {}) {
  const fh = await open(file, 'r')
  try {
    let offset = await headOffset(location)
    let failures = 0
    while (offset < size) {
      // Le morceau est relu à chaque tour : après une coupure ou un décalage, on repart exactement d'où Stream en est
      const len = Math.min(CHUNK, size - offset)
      const buf = Buffer.alloc(len)
      await fh.read(buf, 0, len, offset)
      try {
        const res = await fetch(location, {
          method: 'PATCH',
          headers: { 'Tus-Resumable': '1.0.0', 'Upload-Offset': String(offset), 'Content-Type': 'application/offset+octet-stream' },
          body: buf,
          signal: AbortSignal.timeout(10 * 60_000),
        })
        if (res.ok) { offset = Number(res.headers.get('Upload-Offset')) || offset + len; failures = 0; onProgress?.(offset / size); continue }
        if (res.status !== 409 && res.status >= 400 && res.status < 500) throw Object.assign(new Error(`Stream a refusé le morceau (${res.status}).`), { fatal: true })
        throw new Error(`Stream ${res.status}`)
      } catch (e) {
        if (e.fatal || ++failures > retries) throw e
        await new Promise((r) => setTimeout(r, Math.min(30_000, 1000 * 2 ** failures)))
        offset = await headOffset(location).catch(() => offset)
      }
    }
  } finally { await fh.close() }
}

async function headOffset(location) {
  const res = await fetch(location, { method: 'HEAD', headers: { 'Tus-Resumable': '1.0.0' }, signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`Stream ne répond pas (${res.status}).`)
  return Number(res.headers.get('Upload-Offset')) || 0
}
