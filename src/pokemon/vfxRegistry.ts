import type { PokemonType } from '@battler/data/types.ts'

import pixogenElectric from '@/assets/vfx/pixogen/electric-lightning.png'
import pixogenExplosion from '@/assets/vfx/pixogen/explosion.png'
import pixogenFire from '@/assets/vfx/pixogen/fire-flame.png'
import pixogenHoly from '@/assets/vfx/pixogen/holy-cross.png'
import pixogenVoid from '@/assets/vfx/pixogen/void-shield.png'
import pixogenWater from '@/assets/vfx/pixogen/water-wave.png'

const PIXOGEN_FRAME_SIZE = 64
const PIXOGEN_FRAME_COUNT = 6
const PIXOGEN_FPS = 14

const foozleFrameModules = import.meta.glob<string>(
  '../assets/vfx/foozle/**/*.png',
  { eager: true, import: 'default' },
)

function foozleFrames(folder: string): string[] {
  return Object.entries(foozleFrameModules)
    .filter(([path]) => path.includes(`/foozle/${folder}/`))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, url]) => url)
}

export type VfxSheetConfig = {
  kind: 'sheet'
  src: string
  frameSize: number
  frameCount: number
  fps: number
}

export type VfxFramesConfig = {
  kind: 'frames'
  frames: string[]
  frameSize: number
  fps: number
}

export type MoveVfxConfig = VfxSheetConfig | VfxFramesConfig

function sheet(src: string): VfxSheetConfig {
  return {
    kind: 'sheet',
    src,
    frameSize: PIXOGEN_FRAME_SIZE,
    frameCount: PIXOGEN_FRAME_COUNT,
    fps: PIXOGEN_FPS,
  }
}

function frames(folder: string, fps = 14): VfxFramesConfig {
  const list = foozleFrames(folder)
  return {
    kind: 'frames',
    frames: list,
    frameSize: 64,
    fps,
  }
}

/** Type → overlay animation used during the impact phase. */
export const TYPE_VFX: Record<PokemonType, MoveVfxConfig> = {
  NORMAL: sheet(pixogenExplosion),
  FIRE: sheet(pixogenFire),
  WATER: sheet(pixogenWater),
  ELECTRIC: sheet(pixogenElectric),
  GRASS: frames('earth-spike'),
  ICE: sheet(pixogenHoly),
  FIGHTING: frames('explosion'),
  POISON: frames('portal', 12),
  GROUND: frames('rocks'),
  FLYING: frames('tornado'),
  PSYCHIC: sheet(pixogenVoid),
  BUG: frames('wind'),
  ROCK: frames('rocks'),
  GHOST: sheet(pixogenVoid),
  DRAGON: frames('molten-spear'),
}

export function vfxForMoveType(type: string): MoveVfxConfig | null {
  return TYPE_VFX[type as PokemonType] ?? sheet(pixogenExplosion)
}
