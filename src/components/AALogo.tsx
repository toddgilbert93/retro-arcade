import { useEffect, useState, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '../hooks/useTheme'
import { AA_LOGO_LAYERS } from './aaLogoPaths'

const SWATCH_CYCLE_MS = 700
const SWATCH_CROSSFADE_MS = 400

interface AALogoProps {
  className?: string
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

function useCyclingIndex(length: number, intervalMs: number, enabled: boolean) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setIndex(0)
      return
    }

    const id = window.setInterval(
      () => setIndex((current) => (current + 1) % length),
      intervalMs,
    )
    return () => window.clearInterval(id)
  }, [enabled, intervalMs, length])

  return index
}

export function AALogo({ className }: AALogoProps) {
  const { theme } = useTheme()
  const reducedMotion = usePrefersReducedMotion()
  const offset = useCyclingIndex(2, SWATCH_CYCLE_MS, !reducedMotion)
  const shadow = offset === 0 ? theme.swatch[1] : theme.swatch[2]
  const mid = theme.swatch[0]
  const face = 'var(--foreground)'

  const animatedLayerStyle = (color: string): CSSProperties => ({
    fill: color,
    transition: reducedMotion
      ? undefined
      : `fill ${SWATCH_CROSSFADE_MS}ms ease-in-out`,
  })
  const staticLayerStyle = (color: string): CSSProperties => ({ fill: color })

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 145 14"
      fill="none"
      role="img"
      aria-label="Retro Arcade"
      className={cn('h-8 w-auto md:h-10', className)}
    >
      <g>
        {AA_LOGO_LAYERS[0].map((d) => (
          <path key={d} d={d} style={animatedLayerStyle(shadow)} />
        ))}
      </g>
      <g>
        {AA_LOGO_LAYERS[1].map((d) => (
          <path key={d} d={d} style={staticLayerStyle(mid)} />
        ))}
      </g>
      <g>
        {AA_LOGO_LAYERS[2].map((d) => (
          <path key={d} d={d} style={staticLayerStyle(face)} />
        ))}
      </g>
    </svg>
  )
}
