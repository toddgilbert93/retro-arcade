import { useEffect, useRef } from 'react'
import type { LogEntry } from '@/pokemon/types'
import { logLineClass } from '@/pokemon/playerColors'
import { WinnerTicker } from '@/components/pokemon/WinnerTicker'
import { cn } from '@/lib/utils'

const HISTORY_SIZE = 4
const RECENT_SECTION_H = 'h-28'
const HISTORY_SECTION_H = 'h-28'
const HISTORY_ROW_H = 'h-7'
const HISTORY_ROW_PX = 28
const HISTORY_SHIFT_MS = 280

function ActivityEntry({
  entry,
  prominent = false,
}: {
  entry: LogEntry
  prominent?: boolean
}) {
  if (entry.kind === 'winner' && prominent) {
    return (
      <div className="h-full overflow-hidden pt-1">
        <WinnerTicker text={entry.text} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'retro overflow-hidden',
        logLineClass(entry),
        prominent ? 'activity-entry-prominent line-clamp-4 text-sm' : 'activity-entry-history line-clamp-1 text-[9px]',
      )}
    >
      {entry.text}
    </div>
  )
}

function HistorySection({
  log,
  history,
}: {
  log: LogEntry[]
  history: LogEntry[]
}) {
  const innerRef = useRef<HTMLDivElement>(null)
  const prevLenRef = useRef(log.length)

  useEffect(() => {
    const inner = innerRef.current
    if (!inner) return

    const prevLen = prevLenRef.current
    prevLenRef.current = log.length

    if (log.length <= prevLen || prevLen < 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const onEnd = () => {
      inner.style.transition = ''
      inner.style.transform = ''
    }

    inner.style.transition = 'none'
    inner.style.transform = `translateY(-${HISTORY_ROW_PX}px)`

    let outer = 0
    let mid = 0
    outer = requestAnimationFrame(() => {
      mid = requestAnimationFrame(() => {
        inner.addEventListener('transitionend', onEnd, { once: true })
        inner.style.transition = `transform ${HISTORY_SHIFT_MS}ms ease-out`
        inner.style.transform = 'translateY(0)'
      })
    })

    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(mid)
      inner.removeEventListener('transitionend', onEnd)
    }
  }, [log])

  return (
    <div className={cn(HISTORY_SECTION_H, 'shrink-0 overflow-hidden')}>
      <div ref={innerRef} className="flex flex-col">
        {Array.from({ length: HISTORY_SIZE }, (_, i) => {
          const entry = history[i]
          return (
            <div
              key={entry ? log.length - 2 - i : `history-slot-${i}`}
              className={cn(HISTORY_ROW_H, 'box-border shrink-0 overflow-hidden py-px')}
            >
              {entry ? <ActivityEntry entry={entry} /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ActivityFeedProps {
  log: LogEntry[]
}

export function ActivityFeed({ log }: ActivityFeedProps) {
  const active = log.at(-1) ?? null
  const history = log.slice(-(HISTORY_SIZE + 1), -1).reverse()

  if (!active) {
    return <p className="retro px-2 text-sm text-muted-foreground">No activity yet.</p>
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-2 pb-2">
      <div
        className={cn(
          RECENT_SECTION_H,
          'mb-3 shrink-0 overflow-hidden border-b border-border',
        )}
      >
        <div className="box-border flex h-full min-h-0 flex-col overflow-hidden pt-3 pb-1.5">
          <ActivityEntry entry={active} prominent />
        </div>
      </div>

      <HistorySection log={log} history={history} />
    </div>
  )
}
