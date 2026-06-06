import { cn } from '@/lib/utils'

import '@/components/ui/8bit/styles/retro.css'

export interface MiniProgressProps extends React.ComponentProps<'div'> {
  value: number
  progressBg?: string
  /** Number of pixel segments in the fill track */
  segments?: number
}

/**
 * Compact 8bit-style meter: segmented fill inside a contained pixel frame.
 * Unlike Progress, decorative borders stay in-box (no negative-margin overflow).
 */
function MiniProgress({
  value,
  progressBg = 'bg-primary',
  segments = 16,
  className,
  ...props
}: MiniProgressProps) {
  const pct = Math.max(0, Math.min(100, value))
  const filled = Math.round((pct / 100) * segments)

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'w-full rounded-none border-2 border-foreground bg-primary/20 p-px dark:border-ring',
        className,
      )}
      {...props}
    >
      <div className="flex h-1.5 w-full gap-px overflow-hidden">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={cn('h-full flex-1', i < filled ? progressBg : 'bg-transparent')}
          />
        ))}
      </div>
    </div>
  )
}

export { MiniProgress }
