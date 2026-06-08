import { useEffect, useRef, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/8bit/select'
import { TabsList, TabsTrigger } from '@/components/ui/8bit/tabs'
import { cn } from '@/lib/utils'

export const PAGES = [
  { value: 'battler', label: 'Pokemon Battler' },
  { value: 'game', label: 'Chess' },
  { value: 'poker', label: 'Poker' },
  { value: 'tournament', label: 'Tournament' },
] as const

export type Page = (typeof PAGES)[number]['value']

/** Mirrors tab list layout for width measurement without Radix tab semantics. */
function TabMeasure({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex h-auto w-fit items-center rounded-none bg-card p-1',
        className,
      )}
      aria-hidden
    >
      {PAGES.map((page) => (
        <div
          key={page.value}
          className="retro whitespace-nowrap px-4 py-2 text-sm"
        >
          {page.label}
        </div>
      ))}
    </div>
  )
}

/** True when the tab labels overflow and the nav should use a dropdown. */
export function useNavCompact() {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return

    const update = () => {
      const tabs = measure.firstElementChild as HTMLElement | null
      if (!tabs) return
      setCompact(tabs.scrollWidth > container.clientWidth)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    observer.observe(measure)
    return () => observer.disconnect()
  }, [])

  const measureNode = (
    <div
      ref={measureRef}
      className="pointer-events-none invisible absolute h-0 w-full overflow-hidden"
      aria-hidden
    >
      <TabMeasure />
    </div>
  )

  return { compact, containerRef, measureNode }
}

interface PageNavProps {
  value: Page
  onChange: (value: Page) => void
  compact: boolean
  className?: string
}

export function PageNav({ value, onChange, compact, className }: PageNavProps) {
  return (
    <div className={cn('relative mt-8 w-full min-w-0', className)}>
      <div className="flex h-12 w-full items-center">
        {compact ? (
          <Select value={value} onValueChange={(next) => onChange(next as Page)}>
            <SelectTrigger aria-label="Game">
              <SelectValue placeholder="Select game" />
            </SelectTrigger>
            <SelectContent>
              {PAGES.map((page) => (
                <SelectItem key={page.value} value={page.value}>
                  {page.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <TabsList className="h-auto w-fit p-1">
            {PAGES.map((page) => (
              <TabsTrigger
                key={page.value}
                value={page.value}
                className="px-4 py-2"
              >
                {page.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
      </div>
    </div>
  )
}
