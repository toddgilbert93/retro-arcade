import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { MOVE_HIT_MS } from '@/pokemon/moveSequence'
import type { MoveVfxConfig } from '@/pokemon/vfxRegistry'
import { vfxForMoveType } from '@/pokemon/vfxRegistry'
import type { MoveVfxState } from '@/pokemon/types'

function SheetVfx({
  config,
  displaySize,
  token,
  onDone,
}: {
  config: Extract<MoveVfxConfig, { kind: 'sheet' }>
  displaySize: number
  token: number
  onDone: () => void
}) {
  const durationMs = Math.round((config.frameCount / config.fps) * 1000)
  const scale = displaySize / config.frameSize

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 z-20"
      style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      aria-hidden
    >
      <div
        key={token}
        className="move-vfx-sheet pixelated"
        style={{
          width: config.frameSize,
          height: config.frameSize,
          backgroundImage: `url(${config.src})`,
          backgroundSize: `${config.frameSize}px auto`,
          animationDuration: `${durationMs}ms`,
          ['--vfx-steps' as string]: config.frameCount,
          ['--vfx-travel' as string]: `${config.frameSize * (config.frameCount - 1)}px`,
        }}
        onAnimationEnd={onDone}
      />
    </div>
  )
}

function FramesVfx({
  config,
  displaySize,
  token,
  onDone,
}: {
  config: Extract<MoveVfxConfig, { kind: 'frames' }>
  displaySize: number
  token: number
  onDone: () => void
}) {
  const [frame, setFrame] = useState(0)
  const [visible, setVisible] = useState(true)
  const frameMs = 1000 / config.fps

  useEffect(() => {
    setFrame(0)
    setVisible(true)
    if (config.frames.length <= 1) {
      const timer = setTimeout(onDone, frameMs)
      return () => clearTimeout(timer)
    }

    let index = 0
    const stepTimer = setInterval(() => {
      index += 1
      if (index >= config.frames.length) {
        clearInterval(stepTimer)
        setVisible(false)
        onDone()
        return
      }
      setFrame(index)
    }, frameMs)

    return () => clearInterval(stepTimer)
  }, [config.frames, config.fps, frameMs, token, onDone])

  if (!visible) return null

  const src = config.frames[frame] ?? config.frames[0]
  if (!src) return null

  return (
    <img
      key={token}
      src={src}
      alt=""
      aria-hidden
      className="pixelated pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 object-contain"
      style={{ width: displaySize, height: displaySize }}
    />
  )
}

export function MoveVfxOverlay({
  moveVfx,
  side,
  compact = false,
}: {
  moveVfx: MoveVfxState | null
  side: 0 | 1
  compact?: boolean
}) {
  const active =
    moveVfx !== null && moveVfx.targetSide === side ? moveVfx : null
  const [playing, setPlaying] = useState<MoveVfxState | null>(null)

  const stop = useCallback(() => setPlaying(null), [])

  useEffect(() => {
    if (!active) {
      setPlaying(null)
      return
    }
    setPlaying(active)
    const timer = setTimeout(stop, MOVE_HIT_MS)
    return () => clearTimeout(timer)
  }, [active?.token, active, stop])

  if (!playing) return null

  const config = vfxForMoveType(playing.moveType)
  if (!config) return null

  const displaySize = compact ? 80 : 112

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden')}>
      {config.kind === 'sheet' ? (
        <SheetVfx
          config={config}
          displaySize={displaySize}
          token={playing.token}
          onDone={stop}
        />
      ) : (
        <FramesVfx
          config={config}
          displaySize={displaySize}
          token={playing.token}
          onDone={stop}
        />
      )}
    </div>
  )
}
