import { useEffect, useRef } from 'react'
import type { PokerCommentary, PokerLogEntry, Seat, SeatView } from '@/poker/types'
import { POKER_PLAYER_LABELS } from '@/poker/pokerRunner'
import {
  CommentaryDialogue,
  CommentaryDialogueEmpty,
} from '@/components/poker/CommentaryDialogue'
import { ScrollArea } from '@/components/ui/8bit/scroll-area'

/** Cap rendered history so a long game doesn't pile up DOM nodes. */
const MAX_MESSAGES = 40

interface ChatMessage {
  key: string
  seat: Seat
  label: string
  text: string
}

function labelFor(seat: Seat, seats?: SeatView[]): string {
  return seats?.find((s) => s.seat === seat)?.label ?? POKER_PLAYER_LABELS[seat]!
}

interface PokerCommentaryFeedProps {
  log: PokerLogEntry[]
  commentary: PokerCommentary | null
  seats?: SeatView[]
}

/**
 * Live chat of the table's reasoning. Past messages (from the log) stay above;
 * the currently-acting seat shows a "thinking…" bubble at the bottom, synced to
 * the seat highlight. Auto-scrolls to the newest message.
 */
export function PokerCommentaryFeed({ log, commentary, seats }: PokerCommentaryFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const messages: ChatMessage[] = log
    .filter((e) => e.kind === 'reasoning' && e.seat !== undefined && !!e.text)
    .map((e, i) => ({ key: `m${i}`, seat: e.seat!, label: labelFor(e.seat!, seats), text: e.text }))
    .slice(-MAX_MESSAGES)

  // Newest first (most recent message on top).
  const ordered = [...messages].reverse()
  const thinkingSeat =
    commentary && commentary.reasoning === null ? commentary.seat : null

  // Keep the newest (top) entry in view as the conversation grows.
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )
    if (viewport) viewport.scrollTop = 0
  }, [messages.length, thinkingSeat])

  if (messages.length === 0 && thinkingSeat === null) {
    return <CommentaryDialogueEmpty />
  }

  return (
    <div ref={scrollRef}>
      <ScrollArea className="h-[260px] pr-3">
        <div className="flex flex-col gap-5 px-3 py-2">
          {thinkingSeat !== null && (
            <CommentaryDialogue
              seat={thinkingSeat}
              label={labelFor(thinkingSeat, seats)}
              text={null}
              thinking
            />
          )}
          {ordered.map((m) => (
            <CommentaryDialogue key={m.key} seat={m.seat} label={m.label} text={m.text} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
