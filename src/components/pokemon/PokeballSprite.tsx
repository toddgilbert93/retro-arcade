import { cn } from '@/lib/utils'
import { POKEBALL_ANIM_MS, POKEBALL_IMG } from '@/pokemon/pokeballAnim'

export function PokeballSprite({ className }: { className?: string }) {
  return (
    <div
      className={cn('pokeball-pixel pokeball-pixel-active', className)}
      style={{ '--pb-dur': `${POKEBALL_ANIM_MS}ms` } as React.CSSProperties}
      aria-hidden
    >
      <img src={POKEBALL_IMG} alt="" className="pokeball-pixel__img pixelated" draggable={false} />
      <div className="pokeball-pixel__flash" />
    </div>
  )
}
