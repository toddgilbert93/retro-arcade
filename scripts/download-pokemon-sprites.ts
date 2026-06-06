/**
 * Download Gen-1 Red/Blue front/back sprites from the PokeAPI sprite repo
 * into public/pokemon/{front,back}/{dex}.png (dex 1–151).
 *
 * Uses the 96×96 transparent variants (same set as the original rental-pool
 * sprites), not the smaller default red-blue PNGs with white backgrounds.
 */
import { mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'pokemon')
const BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent'

const FIRST = 1
const LAST = 151

async function exists(file: string): Promise<boolean> {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → ${res.status} ${res.statusText}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  const force = process.argv.includes('--force')
  await mkdir(path.join(OUT, 'front'), { recursive: true })
  await mkdir(path.join(OUT, 'back'), { recursive: true })

  let downloaded = 0
  let skipped = 0
  const failures: string[] = []

  for (let dex = FIRST; dex <= LAST; dex++) {
    for (const [dir, suffix] of [
      ['front', `${dex}.png`],
      ['back', `back/${dex}.png`],
    ] as const) {
      const dest = path.join(OUT, dir, `${dex}.png`)
      if (!force && (await exists(dest))) {
        skipped++
        continue
      }
      const url = `${BASE}/${suffix}`
      try {
        const data = await download(url)
        await writeFile(dest, data)
        downloaded++
      } catch (err) {
        failures.push(`${url}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  console.log(`Sprites: ${downloaded} downloaded, ${skipped} skipped (already present)`)
  if (failures.length) {
    console.error(`${failures.length} failed:`)
    for (const f of failures) console.error(`  ${f}`)
    process.exit(1)
  }
}

main()
