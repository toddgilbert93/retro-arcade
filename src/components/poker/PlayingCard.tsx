import type { Card } from '@/poker/types'
import { cardAlt, cardImage } from '@/poker/cardSprites'
import { cn } from '@/lib/utils'

type CardSize = 'sm' | 'md' | 'lg'

const SIZE: Record<CardSize, string> = {
  sm: 'h-11 w-8',
  md: 'h-16 w-12',
  lg: 'h-20 w-[60px]',
}

interface PlayingCardProps {
  card?: Card | null
  size?: CardSize
  dim?: boolean
  className?: string
}

/**
 * A single pixel-art card. With no `card`, renders an empty table slot (used for
 * undealt community cards).
 */
export function PlayingCard({ card, size = 'md', dim = false, className }: PlayingCardProps) {
  if (!card) {
    return (
      <div
        className={cn(
          SIZE[size],
          'shrink-0 rounded-sm border border-dashed border-border/60 bg-black/15',
          className,
        )}
        aria-hidden
      />
    )
  }
  return (
    <img
      src={cardImage(card)}
      alt={cardAlt(card)}
      className={cn(
        SIZE[size],
        'pixelated shrink-0 object-contain transition-opacity',
        dim && 'opacity-40 grayscale',
        className,
      )}
    />
  )
}
