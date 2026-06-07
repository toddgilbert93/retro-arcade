import { cn } from '@/lib/utils'

interface PixelFrameProps extends React.ComponentProps<'div'> {
  contentClassName?: string
  /** CSS color value for a custom border tint (e.g. seat accent). */
  borderColor?: string
}

function barProps(color: string | undefined, position: string) {
  return {
    className: cn(
      'pointer-events-none absolute',
      position,
      !color && 'bg-foreground dark:bg-ring',
    ),
    style: color ? { backgroundColor: color } : undefined,
    'aria-hidden': true as const,
  }
}

/** Rounded 8-bit decorative frame (matches Alert / commentary bubbles). */
function PixelFrame({
  children,
  className,
  contentClassName,
  borderColor,
  ...props
}: PixelFrameProps) {
  return (
    <div className={cn('relative', className)} {...props}>
      <div className={contentClassName}>{children}</div>

      <div {...barProps(borderColor, '-top-1.5 w-1/2 left-1.5 h-1.5')} />
      <div {...barProps(borderColor, '-top-1.5 w-1/2 right-1.5 h-1.5')} />
      <div {...barProps(borderColor, '-bottom-1.5 w-1/2 left-1.5 h-1.5')} />
      <div {...barProps(borderColor, '-bottom-1.5 w-1/2 right-1.5 h-1.5')} />
      <div {...barProps(borderColor, 'top-0 left-0 size-1.5')} />
      <div {...barProps(borderColor, 'top-0 right-0 size-1.5')} />
      <div {...barProps(borderColor, 'bottom-0 left-0 size-1.5')} />
      <div {...barProps(borderColor, 'bottom-0 right-0 size-1.5')} />
      <div {...barProps(borderColor, 'top-1.5 -left-1.5 h-1/2 w-1.5')} />
      <div {...barProps(borderColor, 'bottom-1.5 -left-1.5 h-1/2 w-1.5')} />
      <div {...barProps(borderColor, 'top-1.5 -right-1.5 h-1/2 w-1.5')} />
      <div {...barProps(borderColor, 'bottom-1.5 -right-1.5 h-1/2 w-1.5')} />
    </div>
  )
}

export { PixelFrame }
