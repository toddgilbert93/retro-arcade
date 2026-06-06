import { useEffect, useRef, useState } from 'react'
import { MiniProgress } from '@/components/ui/8bit/mini-progress'
import { cn } from '@/lib/utils'
import { PokeballSprite } from '@/components/pokemon/PokeballSprite'
import { MoveVfxOverlay } from '@/components/pokemon/MoveVfxOverlay'
import { POKEBALL_ANIM_MS, POKEBALL_SWAP_AT_MS } from '@/pokemon/pokeballAnim'
import { backSprite, frontSprite } from '@/pokemon/sprites'
import type { MonView, MoveVfxState, PlayerSide } from '@/pokemon/types'

const TYPE_COLORS: Record<string, string> = {
  NORMAL: 'bg-stone-400 text-black',
  FIRE: 'bg-orange-500 text-black',
  WATER: 'bg-blue-500 text-white',
  ELECTRIC: 'bg-yellow-400 text-black',
  GRASS: 'bg-green-500 text-black',
  ICE: 'bg-cyan-300 text-black',
  FIGHTING: 'bg-red-700 text-white',
  POISON: 'bg-purple-500 text-white',
  GROUND: 'bg-amber-600 text-black',
  FLYING: 'bg-indigo-300 text-black',
  PSYCHIC: 'bg-pink-500 text-white',
  BUG: 'bg-lime-500 text-black',
  ROCK: 'bg-yellow-700 text-white',
  GHOST: 'bg-purple-800 text-white',
  DRAGON: 'bg-indigo-600 text-white',
}

const STATUS_COLORS: Record<string, string> = {
  BURN: 'bg-orange-600 text-white',
  FREEZE: 'bg-cyan-400 text-black',
  PARALYSIS: 'bg-yellow-500 text-black',
  POISON: 'bg-purple-600 text-white',
  TOXIC: 'bg-purple-800 text-white',
  SLEEP: 'bg-slate-500 text-white',
}

const STATUS_LABEL: Record<string, string> = {
  BURN: 'BRN',
  FREEZE: 'FRZ',
  PARALYSIS: 'PAR',
  POISON: 'PSN',
  TOXIC: 'TOX',
  SLEEP: 'SLP',
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        'retro inline-block rounded-none border border-black/40 px-1.5 py-0.5 text-[8px] uppercase',
        TYPE_COLORS[type] ?? 'bg-muted text-foreground',
      )}
    >
      {type}
    </span>
  )
}

function hpColor(pct: number): string {
  if (pct > 50) return 'bg-green-500'
  if (pct > 20) return 'bg-yellow-400'
  return 'bg-red-500'
}

function HpBar({ pct }: { pct: number }) {
  return <MiniProgress value={pct} progressBg={hpColor(pct)} />
}

/**
 * One side of the battlefield: nameplate (name, HP bar, status, types) plus the
 * sprite. Shakes when its HP drops and plays an enter animation on switch-in.
 */
type BallPhase = 'idle' | 'active'

export function PokemonPanel({
  mon,
  nameClassName,
  facing,
  compact = false,
  side,
  moveVfx,
}: {
  mon: MonView
  nameClassName?: string
  facing: 'front' | 'back'
  compact?: boolean
  side: PlayerSide
  moveVfx?: MoveVfxState | null
}) {
  const align = facing === 'front' ? 'right' : 'left'
  const prevHp = useRef<number | null>(null)
  const prevDex = useRef<number | null>(null)
  const [hit, setHit] = useState(false)
  const [entering, setEntering] = useState(false)
  const [ballPhase, setBallPhase] = useState<BallPhase>('idle')
  const [showMon, setShowMon] = useState(true)
  const [spriteBroken, setSpriteBroken] = useState(false)
  const [spriteSrc, setSpriteSrc] = useState(() =>
    facing === 'front' ? frontSprite(mon.dexNumber) : backSprite(mon.dexNumber),
  )

  // HP drops only — keep separate so battle damage doesn't cancel switch timers.
  useEffect(() => {
    const lastHp = prevHp.current
    if (lastHp !== null && mon.hp < lastHp) {
      setHit(true)
      const t = setTimeout(() => setHit(false), 450)
      prevHp.current = mon.hp
      return () => clearTimeout(t)
    }
    prevHp.current = mon.hp
  }, [mon.hp])

  useEffect(() => {
    setSpriteBroken(false)
  }, [spriteSrc])

  useEffect(() => {
    const src = facing === 'front' ? frontSprite(mon.dexNumber) : backSprite(mon.dexNumber)
    const lastDex = prevDex.current
    const timers: ReturnType<typeof setTimeout>[] = []

    const finishAnim = () => {
      setShowMon(true)
      setBallPhase('idle')
      setEntering(false)
    }

    if (lastDex === null || lastDex !== mon.dexNumber) {
      setBallPhase('active')
      setShowMon(false)

      timers.push(
        setTimeout(() => {
          setSpriteSrc(src)
          setShowMon(true)
          setEntering(true)
        }, POKEBALL_SWAP_AT_MS),
        setTimeout(finishAnim, POKEBALL_ANIM_MS),
      )

      prevDex.current = mon.dexNumber
      return () => {
        timers.forEach(clearTimeout)
        finishAnim()
      }
    }
  }, [mon.dexNumber, facing])

  const showBall = ballPhase !== 'idle'

  const nameplate = (
    <div className={cn(compact ? 'w-32' : 'w-52', 'max-w-full', align === 'right' ? 'text-right' : 'text-left')}>
      <div className="flex items-center gap-2" style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        <span className={cn('retro text-[10px]', nameClassName)}>{mon.species}</span>
        {mon.status !== 'NONE' && (
          <span
            className={cn(
              'retro rounded-none border border-black/40 px-1 py-0.5 text-[8px]',
              STATUS_COLORS[mon.status] ?? 'bg-muted',
            )}
          >
            {STATUS_LABEL[mon.status] ?? mon.status}
          </span>
        )}
      </div>
      <div className="mt-1 mb-1">
        <HpBar pct={mon.hpPct} />
      </div>
      <div className="retro text-[8px] text-muted-foreground">
        {mon.hp}/{mon.maxHp} HP
      </div>
      <div className={cn('mt-1 flex gap-1', align === 'right' ? 'justify-end' : 'justify-start')}>
        {mon.types.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>
    </div>
  )

  const spriteSize = compact ? 'h-20 w-20' : 'h-32 w-32'
  const sprite = (
    <div className={cn('poke-sprite-slot relative', spriteSize)}>
      <img
        src={spriteSrc}
        alt={mon.species}
        width={128}
        height={128}
        className={cn(
          'pixelated object-contain',
          spriteSize,
          (!showMon || spriteBroken) && 'opacity-0',
          mon.fainted && showMon && ballPhase === 'idle' && 'poke-faint',
          hit && 'poke-shake',
          entering && 'poke-enter',
        )}
        onError={() => setSpriteBroken(true)}
        onLoad={() => setSpriteBroken(false)}
      />
      {showBall && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center pb-2">
          <PokeballSprite key={mon.dexNumber} />
        </div>
      )}
      <MoveVfxOverlay moveVfx={moveVfx ?? null} side={side} compact={compact} />
    </div>
  )

  return (
    <div className={cn('retro', align === 'right' ? 'text-right' : 'text-left')}>
      <div className="flex items-center gap-2">
        {facing === 'back' ? (
          <>
            {sprite}
            {nameplate}
          </>
        ) : (
          <>
            <div className="flex flex-col items-end">{nameplate}</div>
            {sprite}
          </>
        )}
      </div>
    </div>
  )
}
