import { useEffect, useRef } from 'react'
import type { PokerLogEntry } from '@/poker/types'
import { logLineClass } from '@/poker/seatColors'
import { WinnerTicker } from '@/components/pokemon/WinnerTicker'
import { cn } from '@/lib/utils'

const HISTORY_SIZE = 4
const HISTORY_SECTION_H = 'h-28'
const HISTORY_ROW_H = 'h-7'
const HISTORY_ROW_PX = 28
const HISTORY_SHIFT_MS = 280

/** Keep bet/fold/win lines; drop reasoning, street deals, checks, and card reveals. */
function isVisibleActivity(entry: PokerLogEntry): boolean {
  if (entry.kind === 'winner') return true

  if (entry.kind === 'showdown') {
    return /\bwins\b|\bsplit\b/i.test(entry.text) && !/\bshows\b/i.test(entry.text)
  }

  if (entry.kind !== 'action') return false

  if (/\sposts\s/i.test(entry.text)) return true

  const actionMatch = entry.text.match(/^[^:]+:\s*(.+)$/)
  if (actionMatch) {
    const action = actionMatch[1]!.toLowerCase()
    if (action.startsWith('check')) return false
    if (action.startsWith('fold')) return true
    if (
      action.startsWith('bet ') ||
      action.startsWith('raise ') ||
      action.startsWith('call ')
    ) {
      return true
    }
    return false
  }

  return false
}

function ActivityEntry({
  entry,
  prominent = false,
}: {
  entry: PokerLogEntry
  prominent?: boolean
}) {
  if (entry.kind === 'winner' && prominent) {
    return (
      <div className="overflow-hidden">
        <WinnerTicker text={entry.text} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'retro overflow-hidden',
        logLineClass(entry),
        prominent
          ? 'activity-entry-prominent line-clamp-2 text-sm leading-snug'
          : 'activity-entry-history line-clamp-1 text-[9px]',
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
  log: PokerLogEntry[]
  history: PokerLogEntry[]
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

interface PokerActivityFeedProps {
  log: PokerLogEntry[]
}

export function PokerActivityFeed({ log }: PokerActivityFeedProps) {
  const visibleLog = log.filter(isVisibleActivity)
  const active = visibleLog.at(-1) ?? null
  const history = visibleLog.slice(-(HISTORY_SIZE + 1), -1).reverse()

  if (!active) {
    return <p className="retro px-2 text-sm text-muted-foreground">No activity yet.</p>
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-2 pb-2">
      <div className="mb-2 shrink-0 overflow-hidden border-b border-border py-1">
        <ActivityEntry entry={active} prominent />
      </div>

      <HistorySection log={visibleLog} history={history} />
    </div>
  )
}
